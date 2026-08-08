'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useApiGet } from '@/lib/use-api';
import { patch } from '@/lib/api';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Avatar } from '@/components/profile/avatar';
import { useToast } from '@/lib/toast-context';
import {
  IconFlame,
  IconEdit,
  IconShield,
  IconDownload,
  IconAlertTriangle,
  IconHistory,
  IconRadio,
} from '@/components/ui/icons';
import type { AttemptStatus, AttemptSummaryDto, Page, UserStatsDto } from '@/lib/types';

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<AttemptStatus, string> = {
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  ABANDONED: 'Abandoned',
};

const STATUS_COLOR: Record<AttemptStatus, string> = {
  COMPLETED: 'var(--good)',
  IN_PROGRESS: 'var(--signal)',
  ABANDONED: 'var(--faint)',
};

const OAUTH_PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMemberSince(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function attemptHref(attempt: AttemptSummaryDto): string {
  switch (attempt.status) {
    case 'IN_PROGRESS':  return `/play/${attempt.attemptId}`;
    case 'COMPLETED':    return `/result/${attempt.attemptId}`;
    case 'ABANDONED':
    default:             return `/scenarios/${attempt.scenarioSlug}`;
  }
}

// ─── Inline Display-Name Edit ─────────────────────────────────────────────────

function EditableName({ displayName, onSaved }: { displayName: string; onSaved: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();
  const { setUser, user } = useAuth();

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function startEdit() {
    setValue(displayName);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function save() {
    const trimmed = value.trim();
    if (trimmed === displayName) { setEditing(false); return; }
    if (trimmed.length < 2 || trimmed.length > 40) {
      setError('Display name must be 2–40 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await patch<{ displayName: string }>('/api/v1/users/me', { displayName: trimmed });
      if (user) setUser({ ...user, displayName: updated.displayName });
      onSaved(updated.displayName);
      push('Display name updated.', 'success');
      setEditing(false);
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void save();
    if (e.key === 'Escape') cancelEdit();
  }

  if (!editing) {
    return (
      <div className="editable-name">
        <h1 className="editable-name__text">{displayName}</h1>
        <button
          className="editable-name__btn"
          onClick={startEdit}
          aria-label="Edit display name"
          title="Edit display name"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <IconEdit size={13} /> Edit
        </button>
      </div>
    );
  }

  return (
    <div className="editable-name editable-name--editing">
      <input
        ref={inputRef}
        className="editable-name__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        maxLength={40}
        disabled={saving}
        aria-label="Display name"
      />
      <div className="editable-name__actions">
        <button className="button primary" onClick={save} disabled={saving || !value.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="button outline" onClick={cancelEdit} disabled={saving}>
          Cancel
        </button>
      </div>
      {error && <p className="field-error" style={{ marginTop: 6 }}>{error}</p>}
    </div>
  );
}

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="stats-row stats-skeleton" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="stat-block skeleton-block" />
      ))}
    </div>
  );
}

function AttemptsSkeleton() {
  return (
    <div className="table" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="tr skeleton-row" />
      ))}
    </div>
  );
}

// ─── Data & Privacy Controls ──────────────────────────────────────────────────

type DangerState = 'idle' | 'confirm-delete' | 'deleting' | 'exporting';

function DataPrivacySection() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { push } = useToast();
  const [state, setState] = useState<DangerState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const confirmInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state === 'confirm-delete') confirmInputRef.current?.focus();
  }, [state]);

  function openDeleteDialog() { setEmailInput(''); setError(null); setState('confirm-delete'); }
  function cancelDelete()     { setEmailInput(''); setError(null); setState('idle'); }

  const handleExport = useCallback(async () => {
    setState('exporting');
    setError(null);
    try {
      const resp = await fetch('/api/v1/users/me/export', { credentials: 'include' });
      if (!resp.ok) throw new Error(`Export failed (${resp.status})`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incident-room-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      push('Your data export is downloading.', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setState('idle');
    }
  }, [push]);

  const handleDeleteConfirm = useCallback(async () => {
    setState('deleting');
    setError(null);
    try {
      const resp = await fetch('/api/v1/users/me', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRF-TOKEN': document.cookie.match(/ir_csrf=([^;]+)/)?.[1] ?? '' },
      });
      if (!resp.ok) throw new Error(`Delete failed (${resp.status})`);
      await logout();
      router.replace('/?deleted=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed. Please try again.');
      setState('idle');
    }
  }, [logout, router]);

  return (
    <section className="profile-privacy-section" style={{ marginTop: 24 }}>
      <div className="profile-privacy-header">
        <div>
          <div className="section-label">Your Data</div>
          <h2>Data &amp; Privacy Controls</h2>
          <p className="profile-privacy-sub">
            Manage your personal data in accordance with your rights under GDPR and CCPA.{' '}
            <Link href="/privacy" className="site-footer__inline-link">Privacy Policy</Link>
          </p>
        </div>
      </div>

      <div className="profile-privacy-cards">
        {/* Export */}
        <div className="privacy-card">
          <div className="privacy-card__icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconDownload size={20} />
          </div>
          <div className="privacy-card__body">
            <h3>Export my data</h3>
            <p>
              Download a machine-readable JSON file containing all personal data we hold about you:
              account details, attempt history, leaderboard entries, and token metadata.
              Fulfils the <strong>Right to Data Portability</strong> (Art. 20 GDPR / CCPA).
            </p>
          </div>
          <div className="privacy-card__action">
            <button
              className="button outline"
              onClick={handleExport}
              disabled={state === 'exporting' || state === 'deleting'}
              id="export-data-btn"
            >
              {state === 'exporting' ? 'Preparing…' : 'Export My Data'}
            </button>
          </div>
        </div>

        {/* Delete */}
        {state === 'idle' || state === 'exporting' ? (
          <div className="privacy-card privacy-card--danger">
            <div className="privacy-card__icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconAlertTriangle size={20} />
            </div>
            <div className="privacy-card__body">
              <h3>Delete my account</h3>
              <p>
                Permanently delete your account and all associated data: attempts, leaderboard
                entries, sessions, and email verifications. This action is{' '}
                <strong>immediate and irreversible</strong>. Fulfils the{' '}
                <strong>Right to Erasure</strong> (Art. 17 GDPR / CCPA).
              </p>
            </div>
            <div className="privacy-card__action">
              <button
                className="button danger-btn"
                onClick={openDeleteDialog}
                disabled={state === 'exporting'}
                id="delete-account-btn"
              >
                Delete Account
              </button>
            </div>
          </div>
        ) : (
          <div className="privacy-card privacy-card--danger privacy-card--active" role="alert">
            <div className="privacy-card__body">
              <h3>Confirm account deletion</h3>
              <p>
                This will permanently delete your account and all your data.
                This action is <strong>immediate and irreversible</strong> — there is no undo.
              </p>
              <label
                htmlFor="delete-email-confirm"
                style={{ display: 'block', color: 'var(--dim)', fontSize: 13, marginTop: 16 }}
              >
                Type your email address{' '}
                <span className="mono" style={{ color: 'var(--ink)', userSelect: 'all' }}>
                  {user?.email}
                </span>{' '}
                to confirm:
              </label>
              <input
                ref={confirmInputRef}
                id="delete-email-confirm"
                type="email"
                autoComplete="off"
                spellCheck={false}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={user?.email ?? 'your@email.com'}
                disabled={state === 'deleting'}
                style={{
                  width: '100%', marginTop: 8, padding: '10px 12px',
                  background: 'var(--void)', border: '1px solid rgba(255,92,92,0.5)',
                  borderRadius: 4, color: 'var(--ink)', fontSize: 13,
                }}
              />
            </div>
            <div className="privacy-card__action privacy-card__action--row" style={{ marginTop: 20 }}>
              <button
                className="button danger-btn"
                onClick={handleDeleteConfirm}
                disabled={state === 'deleting' || emailInput.trim() !== (user?.email ?? '')}
                id="confirm-delete-btn"
                title={emailInput.trim() !== (user?.email ?? '') ? 'Type your email address above to enable this button' : undefined}
              >
                {state === 'deleting' ? 'Deleting…' : 'Delete my account permanently'}
              </button>
              <button
                className="button outline"
                onClick={cancelDelete}
                disabled={state === 'deleting'}
                id="cancel-delete-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="profile-privacy-error" role="alert">{error}</p>}
    </section>
  );
}

// ─── Profile Content ──────────────────────────────────────────────────────────

type ProfileTab = 'attempts' | 'privacy';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ProfileTab>('attempts');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttemptStatus>('ALL');

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user]);

  const page = Math.max(0, Number(searchParams.get('page') ?? '0') || 0);

  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent('/profile')}`);
  }, [user, router]);

  const attemptsPath = user ? `/api/v1/users/me/attempts?page=${page}&size=${PAGE_SIZE}` : null;
  const attempts = useApiGet<Page<AttemptSummaryDto>>(attemptsPath, [page]);

  const statsPath = user ? '/api/v1/users/me/stats' : null;
  const stats = useApiGet<UserStatsDto>(statsPath, []);

  function goToPage(next: number) { router.push(`/profile?page=${next}`); }

  if (user === undefined || user === null) {
    return <main className="shell page empty mono">Loading operator profile…</main>;
  }

  const memberSince = formatMemberSince(user.createdAt);

  return (
    <main className="shell page">
      {/* ── Operator Hero Card ── */}
      <div className="profile-hero-card">
        <div className="profile-operator-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <IconRadio size={8} /> SRE Command Operator
        </div>

        <div className="profile-header">
          <Avatar name={displayName || user.displayName} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <EditableName displayName={displayName || user.displayName} onSaved={setDisplayName} />
            <p className="lead" style={{ margin: '4px 0 0' }}>{user.email}</p>
            <div className="profile-header__meta">
              {user.oauthProvider && (
                <span className="oauth-badge">
                  Signed in with {OAUTH_PROVIDER_LABEL[user.oauthProvider] ?? user.oauthProvider}
                </span>
              )}
              {memberSince && (
                <span className="profile-member-since">Member since {memberSince}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Metric Strip ── */}
        {stats.status === 'loading' ? (
          <StatsSkeleton />
        ) : (
          <AsyncBoundary state={stats} loadingLabel="">
            {(data) => (
              <div className="stats-row">
                <div className="stat-block">
                  <strong>{data.completedCount}</strong>
                  <span>Incidents resolved</span>
                </div>
                <div className="stat-block">
                  <strong>{data.averageScore != null ? Math.round(data.averageScore) : '—'}</strong>
                  <span>Average score</span>
                </div>
                <div className="stat-block streak">
                  <strong>
                    <span className="streak-flame" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', marginRight: 6 }}>
                      <IconFlame size={20} />
                    </span>
                    {user.currentStreak}
                  </strong>
                  <span>Day streak</span>
                </div>
              </div>
            )}
          </AsyncBoundary>
        )}
      </div>

      {/* ── Profile Tabs ── */}
      <div className="profile-tab-bar" style={{ display: 'flex', gap: 8, margin: '28px 0 20px' }}>
        <button
          className={`catalog-pill${activeTab === 'attempts' ? ' catalog-pill--active' : ''}`}
          onClick={() => setActiveTab('attempts')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <IconHistory size={14} /> Incident History
        </button>
        <button
          className={`catalog-pill${activeTab === 'privacy' ? ' catalog-pill--active' : ''}`}
          onClick={() => setActiveTab('privacy')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <IconShield size={14} /> Data &amp; Privacy Controls
        </button>
      </div>

      {/* ── Tab Content: Attempts ── */}
      {activeTab === 'attempts' && (
        <>
          <div className="section-heading">
            <div>
              <div className="section-label">Your incidents</div>
              <h2>Attempt history</h2>
            </div>

            {/* Filter Pills */}
            <div className="attempt-history-filters" style={{ display: 'flex', gap: 6 }}>
              {(['ALL', 'COMPLETED', 'IN_PROGRESS', 'ABANDONED'] as const).map((st) => (
                <button
                  key={st}
                  className={`catalog-pill${statusFilter === st ? ' catalog-pill--active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'ALL' ? 'All Statuses' : STATUS_LABEL[st]}
                </button>
              ))}
            </div>
          </div>

          {attempts.status === 'loading' ? (
            <AttemptsSkeleton />
          ) : (
            <AsyncBoundary state={attempts} loadingLabel="">
              {(data) => {
                const filteredContent = statusFilter === 'ALL'
                  ? data.content
                  : data.content.filter((a) => a.status === statusFilter);

                if (filteredContent.length === 0) {
                  return (
                    <div className="empty-state-card">
                      <div className="empty-state-card__icon" aria-hidden="true" style={{ display: 'flex', justifyContent: 'center' }}>
                        <IconHistory size={24} />
                      </div>
                      <h3>No incidents match this filter</h3>
                      <p>Try switching filters or launch a new incident simulation.</p>
                      <Link href="/scenarios" className="button primary" style={{ display: 'inline-flex', marginTop: 16 }}>
                        Browse scenarios
                      </Link>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="lb-table">
                      <div className="lb-row lb-row--head">
                        <span>Score</span>
                        <span>Scenario</span>
                        <span>Status</span>
                        <span>Time</span>
                        <span>Started</span>
                      </div>
                      {filteredContent.map((attempt) => (
                        <Link className="lb-row" href={attemptHref(attempt)} key={attempt.attemptId} style={{ textDecoration: 'none' }}>
                          <span className="lb-row__score mono">{attempt.status === 'COMPLETED' ? attempt.finalScore : '—'}</span>
                          <span className="lb-row__name">{attempt.scenarioTitle ?? <span className="mono" style={{ color: 'var(--faint)' }}>Deleted scenario</span>}</span>
                          <span style={{ color: STATUS_COLOR[attempt.status], fontSize: 13, fontWeight: 500 }}>{STATUS_LABEL[attempt.status]}</span>
                          <span className="lb-row__time mono">{attempt.elapsedSeconds != null ? formatElapsed(attempt.elapsedSeconds) : '—'}</span>
                          <span className="lb-row__date mono">{formatDate(attempt.startedAt)}</span>
                        </Link>
                      ))}
                    </div>
                    {data.page.totalPages > 1 && (
                      <div className="catalog-pagination">
                        <button
                          className="catalog-page-btn"
                          disabled={data.page.number === 0}
                          onClick={() => goToPage(page - 1)}
                        >
                          ← Prev
                        </button>
                        <span className="catalog-page-info mono">
                          {data.page.number + 1} / {data.page.totalPages}
                        </span>
                        <button
                          className="catalog-page-btn"
                          disabled={data.page.number + 1 >= data.page.totalPages}
                          onClick={() => goToPage(page + 1)}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                );
              }}
            </AsyncBoundary>
          )}
        </>
      )}

      {/* ── Tab Content: Privacy ── */}
      {activeTab === 'privacy' && <DataPrivacySection />}
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<main className="shell page empty mono">Loading operator profile…</main>}>
      <ProfileContent />
    </Suspense>
  );
}
