'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { post, patch, del, ApiError } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { useApiGet } from '@/lib/use-api';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import type { AdminScenarioSummaryDto, ImportScenarioResponse, Page } from '@/lib/types';

const ROW_COLUMNS = '28px 1.3fr 90px 140px 200px';
const PAGE_SIZE = 20;

type PublishFilter = 'all' | 'published' | 'draft';

function AdminGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user === undefined) return <main className="shell page empty mono">Loading admin console…</main>;
  if (user === null || user.role !== 'ADMIN') {
    return (
      <main className="shell page" style={{ textAlign: 'center' }}>
        <div className="eyebrow">404</div>
        <h1 style={{ fontSize: 40 }}>This page doesn&rsquo;t exist.</h1>
        <p className="lead" style={{ margin: '0 auto' }}>
          The link may be broken, or the page hasn&rsquo;t moved in yet.
        </p>
      </main>
    );
  }
  return <>{children}</>;
}

function SummaryStrip({ reloadToken }: { reloadToken: number }) {
  const published = useApiGet<Page<AdminScenarioSummaryDto>>(
    '/api/v1/admin/scenarios?page=0&size=1&published=true', [reloadToken]
  );
  const drafts = useApiGet<Page<AdminScenarioSummaryDto>>(
    '/api/v1/admin/scenarios?page=0&size=1&published=false', [reloadToken]
  );
  const publishedCount = published.status === 'success' ? published.data.page.totalElements : null;
  const draftCount    = drafts.status    === 'success' ? drafts.data.page.totalElements    : null;
  const total = publishedCount !== null && draftCount !== null ? publishedCount + draftCount : null;

  return (
    <div className="stats-row" style={{ marginTop: 24 }}>
      <div className="stat-block">
        <strong>{total ?? '—'}</strong>
        <span>Total catalog scenarios</span>
      </div>
      <div className="stat-block">
        <strong style={{ color: 'var(--good)' }}>{publishedCount ?? '—'}</strong>
        <span>Published live</span>
      </div>
      <div className="stat-block">
        <strong style={{ color: 'var(--dim)' }}>{draftCount ?? '—'}</strong>
        <span>Work-in-progress drafts</span>
      </div>
    </div>
  );
}

function BulkDeleteConfirm({
  count, onConfirm, onCancel, busy,
}: { count: number; onConfirm: () => void; onCancel: () => void; busy: boolean }) {
  return (
    <div className="bulk-confirm-banner" role="alert">
      <span>
        Permanently delete <strong>{count}</strong> draft scenario{count !== 1 ? 's' : ''}?
        This <strong>cannot be undone</strong>.
      </span>
      <div className="bulk-confirm-actions">
        <button className="button danger-btn" onClick={onConfirm} disabled={busy}>
          {busy ? 'Deleting…' : `Delete ${count}`}
        </button>
        <button className="button outline" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function AdminConsole() {
  const { push } = useToast();

  const [yamlText, setYamlText]         = useState('');
  const [importing, setImporting]       = useState(false);
  const [importError, setImportError]   = useState<string | null>(null);
  const [lastWarnings, setLastWarnings] = useState<string[]>([]);

  const [filter, setFilter]             = useState<PublishFilter>('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [page, setPage]                 = useState(0);
  const [reloadToken, setReloadToken]   = useState(0);

  const [busyId, setBusyId]             = useState<string | null>(null);
  const [rowErrors, setRowErrors]       = useState<Record<string, string>>({});
  const [dailyDates, setDailyDates]     = useState<Record<string, string>>({});

  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const publishedParam = filter === 'all' ? '' : `&published=${filter === 'published'}`;
  const listPath = `/api/v1/admin/scenarios?page=${page}&size=${PAGE_SIZE}${publishedParam}`;
  const listResult = useApiGet<Page<AdminScenarioSummaryDto>>(listPath, [filter, page, reloadToken]);

  const yamlLines = yamlText ? yamlText.split('\n').length : 0;

  function reload() { setReloadToken((t) => t + 1); }

  function changeFilter(next: PublishFilter) {
    setFilter(next); setPage(0); setSelected(new Set()); setShowBulkConfirm(false);
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setImportError(null); setLastWarnings([]); setImporting(true);
    try {
      const result = await post<ImportScenarioResponse>('/api/v1/admin/scenarios/import', yamlText, {
        rawBody: true, headers: { 'Content-Type': 'text/plain' },
      });
      setLastWarnings(result.validationWarnings);
      setYamlText('');
      push(`Imported "${result.slug}" as a draft.`, 'success');
      if (filter === 'published') setFilter('all');
      setPage(0);
      reload();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setImportError(err.message || 'That YAML has a syntax or structure problem.');
      } else {
        setImportError('Could not import this scenario. Try again.');
      }
    } finally {
      setImporting(false);
    }
  }

  async function togglePublish(entry: AdminScenarioSummaryDto) {
    setBusyId(entry.id);
    setRowErrors((prev) => ({ ...prev, [entry.id]: '' }));
    try {
      const result = await patch<ImportScenarioResponse>(`/api/v1/admin/scenarios/${entry.id}/publish`, {
        publish: !entry.published,
      });
      push(
        result.published ? `"${entry.slug}" is now published.` : `"${entry.slug}" is now unpublished.`,
        'success'
      );
      reload();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setRowErrors((prev) => ({ ...prev, [entry.id]: err.message || 'Validation failed.' }));
      } else if (err instanceof ApiError && err.is('NOT_FOUND')) {
        reload();
      } else {
        setRowErrors((prev) => ({ ...prev, [entry.id]: 'Could not update this scenario.' }));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function setDailyDate(entry: AdminScenarioSummaryDto) {
    const date = dailyDates[entry.id];
    if (!date) return;
    setBusyId(entry.id);
    setRowErrors((prev) => ({ ...prev, [entry.id]: '' }));
    try {
      await patch(`/api/v1/admin/scenarios/${entry.id}/daily-date`, { date });
      push(`"${entry.slug}" is scheduled as the daily incident for ${date}.`, 'success');
      reload();
    } catch (err) {
      if (err instanceof ApiError && err.is('NOT_FOUND')) {
        reload();
      } else if (err instanceof ApiError && err.status === 400) {
        setRowErrors((prev) => ({ ...prev, [entry.id]: err.message || 'Invalid date.' }));
      } else {
        setRowErrors((prev) => ({ ...prev, [entry.id]: 'Could not schedule this scenario.' }));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkDeleting(true);
    const results = await Promise.allSettled(ids.map((id) => del(`/api/v1/admin/scenarios/${id}`)));
    const failed    = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    if (succeeded > 0) push(`Deleted ${succeeded} scenario${succeeded === 1 ? '' : 's'}.`, 'success');
    if (failed > 0) push(`Could not delete ${failed} scenario${failed === 1 ? '' : 's'}.`, 'error');
    setSelected(new Set());
    setBulkDeleting(false);
    setShowBulkConfirm(false);
    reload();
  }

  return (
    <main className="shell page admin">
      {/* ── Console Header ── */}
      <div className="admin-console-hero">
        <div className="profile-operator-badge">
          <span>●</span> SYSTEM ADMIN ACTIVE
        </div>
        <h1 style={{ fontSize: 36, margin: '8px 0 12px' }}>Scenario Authoring &amp; Management</h1>
        <p className="lead" style={{ margin: 0, maxWidth: 800 }}>
          Import incidents from YAML specifications, run validation checks, manage published state,
          and schedule daily incident challenges.
        </p>

        <SummaryStrip reloadToken={reloadToken} />
      </div>

      {/* ── Terminal Importer Editor ── */}
      <div className="section-heading" style={{ marginTop: 32 }}>
        <div>
          <div className="section-label">Authoring IDE</div>
          <h2>Import scenario YAML</h2>
        </div>
      </div>

      <div className="admin-terminal-editor">
        <div className="admin-terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
          </div>
          <span>IMPORT_SCENARIO.yaml</span>
          {yamlLines > 0 && (
            <span className="yaml-line-count mono">{yamlLines} line{yamlLines !== 1 ? 's' : ''}</span>
          )}
        </div>

        <form onSubmit={handleImport} style={{ padding: 20 }}>
          <textarea
            id="yaml"
            required
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
            placeholder={'slug: cache-stampede-1\ntitle: The Thundering Herd\ndifficulty: HARD\n...'}
            style={{
              width: '100%', minHeight: 220, background: 'transparent',
              border: 'none', color: 'var(--ink)', font: '13px var(--font-dm-mono), "DM Mono", monospace',
              resize: 'vertical', outline: 'none',
            }}
          />
          {importError && <div className="form-error" style={{ marginTop: 12 }}>{importError}</div>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
            <button className="button primary" type="submit" disabled={importing || !yamlText.trim()}>
              {importing ? 'Importing & Validating…' : 'Import as Draft'}
            </button>
            <a
              href="https://github.com/your-org/incident-room/blob/main/docs/scenario-schema.md"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__inline-link"
              style={{ fontSize: 13 }}
            >
              View Scenario Schema Specs ↗
            </a>
          </div>
        </form>
      </div>

      {lastWarnings.length > 0 && (
        <div className="form-error" style={{ color: 'var(--partial)', borderColor: 'rgba(255,209,102,0.4)', marginTop: 14 }}>
          <strong>Imported with validation warnings:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {lastWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* ── Scenario Catalog Suite ── */}
      <div className="section-heading" style={{ marginTop: 48 }}>
        <div>
          <div className="section-label">Catalog Suite</div>
          <h2>Manage scenario repository</h2>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="admin-filter-tabs" role="group" aria-label="Filter scenarios">
            {(['all', 'published', 'draft'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`admin-filter-tab${f === filter ? ' admin-filter-tab--active' : ''}`}
                onClick={() => changeFilter(f)}
              >
                {f === 'all' ? 'All Scenarios' : f === 'published' ? 'Published' : 'Drafts'}
              </button>
            ))}
          </div>

          <input
            type="text"
            className="admin-search-input"
            placeholder="🔍 Search title or slug…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {selected.size > 0 && !showBulkConfirm && (
          <div className="bulk-action-bar">
            <span className="mono">{selected.size} selected</span>
            <button className="text-btn" onClick={() => setSelected(new Set())}>Clear</button>
            <button className="button outline bulk-delete" onClick={() => setShowBulkConfirm(true)}>
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {showBulkConfirm && (
        <BulkDeleteConfirm
          count={selected.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
          busy={bulkDeleting}
        />
      )}

      <AsyncBoundary state={listResult} loadingLabel="Loading scenario repository…">
        {(data) => {
          const filteredScenarios = searchQuery.trim()
            ? data.content.filter((s) =>
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.slug.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : data.content;

          if (filteredScenarios.length === 0) {
            return (
              <div className="empty">
                {searchQuery
                  ? `No scenarios match "${searchQuery}".`
                  : filter === 'all'
                  ? 'No scenarios in catalog yet — import one using the IDE above.'
                  : `No ${filter === 'published' ? 'published' : 'draft'} scenarios.`}
              </div>
            );
          }

          return (
            <>
              <div className="table">
                <div className="tr head" style={{ gridTemplateColumns: ROW_COLUMNS }}>
                  <span />
                  <span>Title / Slug</span>
                  <span>Status</span>
                  <span>Publish</span>
                  <span>Daily Date</span>
                </div>
                {filteredScenarios.map((entry) => (
                  <div className="tr" key={entry.id} style={{ gridTemplateColumns: ROW_COLUMNS }}>
                    <span>
                      {!entry.published && (
                        <input
                          type="checkbox"
                          aria-label={`Select ${entry.slug} for bulk deletion`}
                          checked={selected.has(entry.id)}
                          onChange={() => toggleSelected(entry.id)}
                        />
                      )}
                    </span>
                    <span>
                      <strong>{entry.title}</strong>
                      <br />
                      <span className="mono" style={{ color: 'var(--dim)', fontSize: 12 }}>{entry.slug}</span>
                    </span>
                    <span>
                      <span className={entry.published ? 'status-badge published' : 'status-badge draft'}>
                        {entry.published ? 'Published' : 'Draft'}
                      </span>
                    </span>
                    <span>
                      <button
                        className="button outline"
                        disabled={busyId === entry.id}
                        onClick={() => togglePublish(entry)}
                      >
                        {busyId === entry.id ? 'Working…' : (entry.published ? 'Unpublish' : 'Publish')}
                      </button>
                    </span>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="date"
                        value={dailyDates[entry.id] ?? entry.dailyDate ?? ''}
                        onChange={(e) => setDailyDates((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                      />
                      <button
                        className="text-btn"
                        disabled={busyId === entry.id || !dailyDates[entry.id]}
                        onClick={() => setDailyDate(entry)}
                      >
                        Set
                      </button>
                    </span>
                    {rowErrors[entry.id] && (
                      <div className="admin-row-error" style={{ gridColumn: '1 / -1' }}>
                        {rowErrors[entry.id]}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {data.page.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="text-btn"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    ‹ Previous
                  </button>
                  <span className="mono">
                    Page {data.page.number + 1} of {data.page.totalPages} · {data.page.totalElements} total
                  </span>
                  <button
                    className="text-btn"
                    disabled={page + 1 >= data.page.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next ›
                  </button>
                </div>
              )}
            </>
          );
        }}
      </AsyncBoundary>
    </main>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminConsole />
    </AdminGate>
  );
}
