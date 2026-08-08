'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiGet } from '@/lib/use-api';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { ScenarioCard } from '@/components/scenario/scenario-card';
import type { Difficulty, Page, ScenarioSummaryDto } from '@/lib/types';

const DIFFICULTIES: Array<Difficulty | 'ALL'> = ['ALL', 'EASY', 'MEDIUM', 'HARD'];
const PAGE_SIZE = 12;

const DIFFICULTY_LABELS: Record<string, string> = {
  ALL: 'All levels',
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

function buildQuery(params: { difficulty: string; rootCause: string; page: number }) {
  const q = new URLSearchParams();
  if (params.difficulty !== 'ALL') q.set('difficulty', params.difficulty);
  if (params.rootCause !== 'ALL') q.set('rootCauseClass', params.rootCause);
  q.set('page', String(params.page));
  q.set('size', String(PAGE_SIZE));
  return q.toString();
}

/** Custom dropdown component for Root Cause selection */
function CustomRootCauseSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = value === 'ALL' ? 'All root causes' : value;

  return (
    <div className="custom-dropdown" ref={containerRef}>
      <button
        type="button"
        className={`custom-dropdown__trigger${isOpen ? ' custom-dropdown__trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="mono">{selectedLabel}</span>
        <svg
          className={`custom-dropdown__chevron${isOpen ? ' custom-dropdown__chevron--rotated' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="custom-dropdown__menu fade-in" role="listbox">
          <div
            role="option"
            aria-selected={value === 'ALL'}
            className={`custom-dropdown__item${value === 'ALL' ? ' custom-dropdown__item--selected' : ''}`}
            onClick={() => {
              onChange('ALL');
              setIsOpen(false);
            }}
          >
            <span className="mono">All root causes</span>
            {value === 'ALL' && <span className="custom-dropdown__check">✓</span>}
          </div>
          {options.map((opt) => (
            <div
              key={opt}
              role="option"
              aria-selected={value === opt}
              className={`custom-dropdown__item${value === opt ? ' custom-dropdown__item--selected' : ''}`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              <span className="mono">#{opt}</span>
              {value === opt && <span className="custom-dropdown__check">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CatalogClient() {
  return (
    <Suspense fallback={<main className="shell page empty mono">Loading…</main>}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const difficulty = searchParams.get('difficulty') ?? 'ALL';
  const rootCause = searchParams.get('rootCause') ?? 'ALL';
  const page = Number(searchParams.get('page') ?? '0');

  const rootCauses = useApiGet<string[]>('/api/v1/scenarios/root-cause-classes');
  const scenarios = useApiGet<Page<ScenarioSummaryDto>>(
    `/api/v1/scenarios?${buildQuery({ difficulty, rootCause, page })}`,
    [difficulty, rootCause, page]
  );

  function updateParams(next: Partial<{ difficulty: string; rootCause: string; page: number }>) {
    const merged = {
      difficulty: next.difficulty ?? difficulty,
      rootCause: next.rootCause ?? rootCause,
      page: next.page ?? 0,
    };
    router.push(`/scenarios?${buildQuery(merged)}`);
  }

  return (
    <main className="shell page">
      {/* ── Page Header ── */}
      <div className="catalog-header">
        <div className="catalog-header__meta">
          <span className="section-label">Incident Catalog</span>
          <h1 className="catalog-header__title">Browse incidents</h1>
          <p className="catalog-header__lead">
            Practice reading telemetry and making the call under pressure.
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="catalog-filterbar">
        {/* Difficulty pills */}
        <div className="catalog-filterbar__group">
          <span className="catalog-filterbar__label">Difficulty</span>
          <div className="catalog-filterbar__pills">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`catalog-pill${difficulty === d ? ' catalog-pill--active' : ''}`}
                onClick={() => updateParams({ difficulty: d })}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Root cause custom dropdown */}
        <div className="catalog-filterbar__group">
          <span className="catalog-filterbar__label">Root cause</span>
          <AsyncBoundary state={rootCauses} loadingLabel="">
            {(options) => (
              <CustomRootCauseSelect
                value={rootCause}
                options={options}
                onChange={(val) => updateParams({ rootCause: val })}
              />
            )}
          </AsyncBoundary>
        </div>
      </div>

      {/* ── Scenario Grid ── */}
      <div className="catalog-grid-area">
        <AsyncBoundary state={scenarios} loadingLabel="Loading incidents…">
          {(result) =>
            result.content.length === 0 ? (
              <div className="catalog-empty">
                <span className="mono">// no results</span>
                <p>No incidents match these filters — try widening them.</p>
              </div>
            ) : (
              <>
                <div className="catalog-count mono">
                  {result.page.totalElements} incident{result.page.totalElements !== 1 ? 's' : ''}
                </div>
                <div className="grid catalog-grid">
                  {result.content.map((scenario) => (
                    <ScenarioCard key={scenario.slug} scenario={scenario} />
                  ))}
                </div>
                {result.page.totalPages > 1 && (
                  <div className="catalog-pagination">
                    <button
                      className="catalog-page-btn"
                      disabled={result.page.number === 0}
                      onClick={() => updateParams({ page: result.page.number - 1 })}
                    >
                      ← Prev
                    </button>
                    <span className="catalog-page-info mono">
                      {result.page.number + 1} / {result.page.totalPages}
                    </span>
                    <button
                      className="catalog-page-btn"
                      disabled={result.page.number + 1 >= result.page.totalPages}
                      onClick={() => updateParams({ page: result.page.number + 1 })}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )
          }
        </AsyncBoundary>
      </div>
    </main>
  );
}
