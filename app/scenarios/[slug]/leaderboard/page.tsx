'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useApiGet } from '@/lib/use-api';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { useAuth } from '@/lib/auth-context';
import type { LeaderboardResponseDto } from '@/lib/types';

const PAGE_SIZE = 20;
const MAX_SIZE = 50;

function formatElapsed(seconds: number | null | undefined): string {
  if (seconds === undefined || seconds === null) return '—';
  if (seconds <= 0) return '< 1m';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function LeaderboardContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const page = Math.max(0, Number(searchParams.get('page') ?? '0') || 0);
  const size = Math.min(
    Math.max(1, Number(searchParams.get('size') ?? String(PAGE_SIZE)) || PAGE_SIZE),
    MAX_SIZE
  );

  const result = useApiGet<LeaderboardResponseDto>(
    `/api/v1/scenarios/${params.slug}/leaderboard?page=${page}&size=${size}`,
    [params.slug, page, size]
  );

  function goToPage(next: number) {
    router.push(`/scenarios/${params.slug}/leaderboard?page=${next}&size=${size}`);
  }

  return (
    <main className="shell page">

      {/* Back link */}
      <Link className="lb-back" href={`/scenarios/${params.slug}`}>
        ← Back to incident
      </Link>

      {/* Header */}
      <div className="lb-header">
        <div>
          <span className="section-label">Rankings</span>
          <h1 className="lb-title">Top responders</h1>
          <p className="lb-subtitle">Fastest, highest-scoring operators for this incident.</p>
        </div>
      </div>

      <AsyncBoundary state={result} loadingLabel="Loading leaderboard…">
        {(data) =>
          data.entries.length === 0 ? (
            <div className="lb-empty">
              <span className="mono lb-empty__code">// no entries yet</span>
              <p>No completed runs yet — be the first to resolve this incident.</p>
              <Link className="button primary" href={`/scenarios/${params.slug}`}>
                Start now →
              </Link>
            </div>
          ) : (
            <>
              {/* Top 3 podium */}
              {page === 0 && data.entries.length >= 1 && (
                <div className="lb-podium">
                  {data.entries.slice(0, 3).map((entry) => (
                    <div
                      key={entry.userId}
                      className={`lb-podium__card lb-podium__card--rank${entry.rank}${user?.id === entry.userId ? ' lb-podium__card--you' : ''}`}
                    >
                      <div className="lb-podium__medal">{RANK_MEDALS[entry.rank] ?? `#${entry.rank}`}</div>
                      <div className="lb-podium__name">{entry.displayName}</div>
                      <div className="lb-podium__score mono">{entry.score} pts</div>
                      <div className="lb-podium__time mono">{formatElapsed(entry.elapsedSeconds)}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Full table */}
              <div className="lb-table">
                {/* Header row */}
                <div className="lb-row lb-row--head">
                  <span>Rank</span>
                  <span>Operator</span>
                  <span>Score</span>
                  <span>Time</span>
                  <span>Date</span>
                </div>
                {data.entries.map((entry) => (
                  <div
                    className={`lb-row${user?.id === entry.userId ? ' lb-row--you' : ''}${entry.rank <= 3 ? ` lb-row--top${entry.rank}` : ''}`}
                    key={`${entry.rank}-${entry.userId}`}
                  >
                    <span className="lb-row__rank mono">
                      {entry.rank <= 3 ? RANK_MEDALS[entry.rank] : `#${entry.rank}`}
                    </span>
                    <span className="lb-row__name">
                      {entry.displayName}
                      {user?.id === entry.userId && (
                        <span className="lb-row__you-tag">you</span>
                      )}
                    </span>
                    <span className="lb-row__score mono">{entry.score}</span>
                    <span className="lb-row__time mono">{formatElapsed(entry.elapsedSeconds)}</span>
                    <span className="lb-row__date mono">{formatDate(entry.achievedAt)}</span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.totalEntries > size && (
                <div className="catalog-pagination">
                  <button
                    className="catalog-page-btn"
                    disabled={page === 0}
                    onClick={() => goToPage(page - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="catalog-page-info mono">
                    {page + 1} / {Math.max(Math.ceil(data.totalEntries / size), 1)}
                  </span>
                  <button
                    className="catalog-page-btn"
                    disabled={(page + 1) * size >= data.totalEntries}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )
        }
      </AsyncBoundary>
    </main>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<main className="shell page empty mono">Loading…</main>}>
      <LeaderboardContent />
    </Suspense>
  );
}
