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
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono font-medium transition-all ${
          isOpen
            ? 'bg-[#121214] border-[#A3E635] text-white shadow-[0_0_15px_rgba(163,230,53,0.2)]'
            : 'bg-[#121214] border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedLabel}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180 text-[#A3E635]' : 'text-neutral-400'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl bg-[#121214] border border-neutral-800 shadow-2xl py-1 z-50 focus:outline-none max-h-60 overflow-y-auto"
          role="listbox"
        >
          <div
            role="option"
            aria-selected={value === 'ALL'}
            className={`flex items-center justify-between px-4 py-2.5 text-xs font-mono cursor-pointer transition-colors ${
              value === 'ALL'
                ? 'bg-[#A3E635]/10 text-[#A3E635] font-bold'
                : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
            }`}
            onClick={() => {
              onChange('ALL');
              setIsOpen(false);
            }}
          >
            <span>All root causes</span>
            {value === 'ALL' && <span className="text-[#A3E635]">✓</span>}
          </div>
          {options.map((opt) => (
            <div
              key={opt}
              role="option"
              aria-selected={value === opt}
              className={`flex items-center justify-between px-4 py-2.5 text-xs font-mono cursor-pointer transition-colors ${
                value === opt
                  ? 'bg-[#A3E635]/10 text-[#A3E635] font-bold'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              <span>#{opt}</span>
              {value === opt && <span className="text-[#A3E635]">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CatalogClient() {
  return (
    <Suspense fallback={<main className="shell page empty mono text-neutral-400">Loading catalog…</main>}>
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
    <main className="min-h-screen bg-[#0A0A0A] text-white bg-dot-pattern">
      <div className="shell page space-y-10 py-10">
        
        {/* ── Page Header ── */}
        <div className="space-y-4 max-w-3xl">
          <span className="pill-counter-badge">
            INCIDENT SCENARIO CATALOG
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Browse <span className="text-[#A3E635]">Incidents</span>
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Practice reading real telemetry logs, diagnosing system bottlenecks, and applying fixes under pressure.
          </p>
          <div className="accent-header-line" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-[#121214] border border-neutral-800/80 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6 shadow-lg">
          {/* Difficulty pills */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold mr-1">
              Difficulty:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {DIFFICULTIES.map((d) => {
                const active = difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    className={`px-4 py-2 rounded-full text-xs font-mono font-bold transition-all ${
                      active
                        ? 'bg-[#A3E635] text-[#0A0A0A] shadow-[0_0_15px_rgba(163,230,53,0.3)]'
                        : 'bg-[#0A0A0A] text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white'
                    }`}
                    onClick={() => updateParams({ difficulty: d })}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Root cause custom dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
              Root cause:
            </span>
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
        <div className="space-y-6">
          <AsyncBoundary state={scenarios} loadingLabel="Loading incidents…">
            {(result) =>
              result.content.length === 0 ? (
                <div className="bg-[#121214] border border-neutral-800 rounded-2xl p-12 text-center space-y-3">
                  <span className="text-sm font-mono text-[#A3E635]">// no matching results</span>
                  <p className="text-neutral-400 text-base">No incidents match these active filters — try widening your selection.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-neutral-800/60 pb-3">
                    <span>Showing {result.content.length} of {result.page.totalElements} incidents</span>
                    <span className="text-[#A3E635]">Page {result.page.number + 1} of {result.page.totalPages}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.content.map((scenario) => (
                      <ScenarioCard key={scenario.slug} scenario={scenario} />
                    ))}
                  </div>

                  {result.page.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-8">
                      <button
                        className="px-5 py-2.5 rounded-full bg-[#121214] border border-neutral-800 text-neutral-300 text-sm font-mono font-bold hover:border-[#A3E635] hover:text-[#A3E635] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        disabled={result.page.number === 0}
                        onClick={() => updateParams({ page: result.page.number - 1 })}
                      >
                        ← Prev
                      </button>
                      <span className="text-xs font-mono text-neutral-400">
                        {result.page.number + 1} / {result.page.totalPages}
                      </span>
                      <button
                        className="px-5 py-2.5 rounded-full bg-[#121214] border border-neutral-800 text-neutral-300 text-sm font-mono font-bold hover:border-[#A3E635] hover:text-[#A3E635] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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

      </div>
    </main>
  );
}

