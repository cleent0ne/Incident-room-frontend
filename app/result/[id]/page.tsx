'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, get } from '@/lib/api';
import { withCapabilityHeader } from '@/lib/anon-tokens';
import { CountUp } from '@/components/ui/count-up';
import { useToast } from '@/lib/toast-context';
import type { ResolveAttemptResponse } from '@/lib/types';

const OUTCOME_LABEL: Record<ResolveAttemptResponse['correctness'], { badge: string; label: string }> = {
  CORRECT:           { badge: '🟢 INCIDENT RESOLVED', label: 'Correct Remediation' },
  PARTIALLY_CORRECT: { badge: '🟡 PARTIAL REMEDIATION', label: 'Partially Correct' },
  INCORRECT:         { badge: '🔴 REMEDIATION FAILED', label: 'Incorrect Action' },
  HARMFUL:           { badge: '💥 HARMFUL INTERVENTION', label: 'Harmful Action' },
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function ProseBlock({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} style={{ marginTop: i === 0 ? 0 : 14 }}>{p}</p>
      ))}
    </>
  );
}

type LoadState = 'loading' | 'ready' | 'expired' | 'error';

export default function ResultScreen() {
  const params = useParams<{ id: string }>();
  const attemptId = params.id;
  const router = useRouter();
  const { push } = useToast();

  const [state, setState] = useState<LoadState>('loading');
  const [result, setResult] = useState<ResolveAttemptResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await get<ResolveAttemptResponse>(`/api/v1/attempts/${attemptId}/result`, {
          headers: withCapabilityHeader(attemptId),
        });
        if (cancelled) return;
        setResult(data);
        setState('ready');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 409) {
          router.replace(`/play/${attemptId}`);
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setState('expired');
        } else {
          setState('error');
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [attemptId, router]);

  function copyShareLink() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href)
      .then(() => push('Debrief link copied to clipboard!', 'success'))
      .catch(() => push('Could not copy link.', 'error'));
  }

  if (state === 'loading') {
    return <main className="shell page empty mono">Loading debrief…</main>;
  }
  if (state === 'expired') {
    return (
      <main className="shell page" style={{ textAlign: 'center' }}>
        <div className="empty">This attempt has expired, or the link isn&rsquo;t valid.</div>
        <Link className="button primary" style={{ marginTop: 18, display: 'inline-block' }} href="/scenarios">
          Browse incidents
        </Link>
      </main>
    );
  }
  if (state === 'error' || !result) {
    return (
      <main className="shell page">
        <div className="empty">Something went wrong loading this debrief. Try refreshing.</div>
      </main>
    );
  }

  const REVEAL = { badge: 0, base: 200, bonus: 550, final: 950, percentile: 1450 };

  return (
    <main className="shell page debrief">
      {/* ── Breadcrumb Navigation ── */}
      <nav className="legal-breadcrumb" aria-label="Breadcrumb">
        <Link href="/scenarios" className="legal-breadcrumb__link">Incidents</Link>
        <span className="legal-breadcrumb__sep" aria-hidden="true">›</span>
        {result.scenarioSlug ? (
          <Link href={`/scenarios/${result.scenarioSlug}`} className="legal-breadcrumb__link">
            {result.scenarioTitle || result.scenarioSlug}
          </Link>
        ) : (
          <span className="legal-breadcrumb__link">Incident</span>
        )}
        <span className="legal-breadcrumb__sep" aria-hidden="true">›</span>
        <span className="legal-breadcrumb__current">Debrief</span>
      </nav>

      {/* ── Hero Outcome Header ── */}
      <div className="debrief-hero fade-in" style={{ animationDelay: `${REVEAL.badge}ms` }}>
        <div className={`debrief-outcome-badge ${result.correctness}`}>
          {OUTCOME_LABEL[result.correctness].badge}
        </div>
        <h1 className="debrief-title">
          {result.scenarioTitle ? `Debrief: ${result.scenarioTitle}` : 'Incident Debrief'}
        </h1>
        {result.explanation && (
          <div className="debrief-lead-card">
            <strong>Diagnosis Summary: </strong> {result.explanation}
          </div>
        )}
      </div>

      {/* ── Metrics & Score Grid ── */}
      <div className="debrief-metrics-grid">
        {/* Base Score */}
        <div className="debrief-metric-card fade-in" style={{ animationDelay: `${REVEAL.base}ms` }}>
          <div className="debrief-metric-label">
            <span>🎯</span> Diagnosis Score
          </div>
          <div className="debrief-metric-value">
            +<CountUp target={result.scorePoints} delayMs={REVEAL.base} />
          </div>
          <div className="debrief-metric-sub">Accuracy points</div>
        </div>

        {/* Speed Bonus */}
        <div className="debrief-metric-card fade-in" style={{ animationDelay: `${REVEAL.bonus}ms` }}>
          <div className="debrief-metric-label">
            <span>⚡</span> Speed Bonus
          </div>
          <div className="debrief-metric-value">
            +<CountUp target={result.timeBonus} delayMs={REVEAL.bonus} />
          </div>
          <div className="debrief-metric-sub">
            Time: <span className="mono">{formatElapsed(result.elapsedSeconds)}</span>
          </div>
        </div>

        {/* Total Score (Hero Card) */}
        <div className="debrief-metric-card debrief-metric-card--hero fade-in" style={{ animationDelay: `${REVEAL.final}ms` }}>
          <div className="debrief-metric-label" style={{ color: 'var(--signal)' }}>
            <span>🏆</span> Final Score
          </div>
          <div className="debrief-metric-value">
            <CountUp target={result.finalScore} delayMs={REVEAL.final} durationMs={900} />
          </div>
          <div className="debrief-metric-sub" style={{ color: 'var(--ink)' }}>
            Combined rating
          </div>
        </div>

        {/* Percentile / Rank */}
        <div className="debrief-metric-card fade-in" style={{ animationDelay: `${REVEAL.percentile}ms` }}>
          <div className="debrief-metric-label">
            <span>📊</span> Efficiency Rank
          </div>
          <div className="debrief-metric-value">
            {result.percentile !== null ? (
              <>
                <CountUp target={result.percentile} delayMs={REVEAL.percentile} />
                <span style={{ fontSize: 24 }}>%</span>
              </>
            ) : (
              '—'
            )}
          </div>
          <div className="debrief-metric-sub">
            {result.percentile !== null
              ? `Faster than ${result.percentile}% of SREs`
              : 'First player today'}
          </div>
          {result.percentile !== null && (
            <div className="percentile-bar-track" aria-hidden="true">
              <div className="percentile-bar-fill" style={{ width: `${Math.min(100, Math.max(5, result.percentile))}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Hypothesis vs Root Cause Terminal Comparison ── */}
      <div className="debrief-analysis-grid fade-in" style={{ animationDelay: `${REVEAL.percentile + 150}ms` }}>
        {/* Your Hypothesis */}
        <div className="debrief-terminal-panel">
          <div className="debrief-terminal-header">
            <div className="terminal-dots">
              <span className="terminal-dot red" />
              <span className="terminal-dot yellow" />
              <span className="terminal-dot green" />
            </div>
            <span>HYPOTHESIS_LOG.txt</span>
          </div>
          <div className="debrief-terminal-body">
            <div className="section-label" style={{ marginBottom: 8, color: 'var(--signal)' }}>
              $ cat /var/log/sre_hypothesis.log
            </div>
            {result.reflectionText ? (
              <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--ink)' }}>
                &ldquo;{result.reflectionText}&rdquo;
              </p>
            ) : (
              <p style={{ margin: 0, color: 'var(--faint)' }}>
                No pre-remediation hypothesis was recorded during this attempt.
              </p>
            )}
          </div>
        </div>

        {/* Root Cause Diagnosis */}
        <div className="debrief-terminal-panel">
          <div className="debrief-terminal-header">
            <div className="terminal-dots">
              <span className="terminal-dot red" />
              <span className="terminal-dot yellow" />
              <span className="terminal-dot green" />
            </div>
            <span>SYSTEM_DIAGNOSIS.md</span>
          </div>
          <div className="debrief-terminal-body">
            <div className="section-label" style={{ marginBottom: 8, color: 'var(--good)' }}>
              System Root Cause Analysis
            </div>
            <ProseBlock text={result.explanation} />
          </div>
        </div>
      </div>

      {/* ── Technical Incident Postmortem Document ── */}
      <div className="debrief-postmortem-card fade-in" style={{ animationDelay: `${REVEAL.percentile + 300}ms` }}>
        <div className="debrief-terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
          </div>
          <span>INCIDENT_POSTMORTEM.md</span>
        </div>
        <div className="debrief-terminal-body" style={{ padding: '24px 28px' }}>
          <div className="section-label" style={{ marginBottom: 12 }}>Technical Postmortem</div>
          <ProseBlock text={result.postmortem} />
        </div>
      </div>

      {/* ── Action Toolbar ── */}
      <div className="debrief-actions-bar fade-in" style={{ animationDelay: `${REVEAL.percentile + 400}ms` }}>
        <Link className="button primary" href="/scenarios">
          Try Another Incident
        </Link>

        {result.scenarioSlug && (
          <Link className="button outline" href={`/scenarios/${result.scenarioSlug}/leaderboard`}>
            🏆 View Leaderboard
          </Link>
        )}

        <button className="button outline" onClick={copyShareLink}>
          🔗 Share Debrief
        </button>

        <Link className="button text-btn" href="/profile" style={{ marginLeft: 8 }}>
          My Profile →
        </Link>
      </div>
    </main>
  );
}
