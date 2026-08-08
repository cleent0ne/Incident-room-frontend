'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconFlame, IconClock, IconXMark, IconRadio, IconBolt } from '@/components/ui/icons';
import { useApiGet } from '@/lib/use-api';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { ScenarioCard } from '@/components/scenario/scenario-card';
import { DifficultyBadge } from '@/components/scenario/difficulty-badge';
import { HeroPreview } from '@/components/home/hero-preview';
import type { Page, ScenarioDetailDto, ScenarioSummaryDto } from '@/lib/types';

// ─── Ticker Sentences ─────────────────────────────────────────────────────────

const TICKER_SENTENCES = [
  "When p95 latency spikes, inspect database lock metrics before restarting application pods.",
  "Circuit breakers prevent retry storms from cascading into downstream microservice failures.",
  "Formulate your root cause hypothesis before executing potentially destructive remediations.",
  "Analyze distributed trace spans to pinpoint the exact RPC bottleneck and wait-time offsets.",
  "Review postmortem debriefs after every incident simulation to sharpen on-call response skills.",
];

function ExplanationTicker() {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % TICKER_SENTENCES.length);
        setAnimating(false);
      }, 600);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const currentText = TICKER_SENTENCES[index]!;
  const nextText = TICKER_SENTENCES[(index + 1) % TICKER_SENTENCES.length]!;

  return (
    <div className="section" style={{ marginTop: 40, textAlign: 'center' }}>
      <div className="section-label" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <IconBolt size={13} />
        ON-CALL TACTICAL KNOWLEDGE
      </div>
      <div className="ticker-wrapper" aria-live="polite">
        <div className={`ticker-sentence ${animating ? 'exit-up' : 'enter-center'}`}>
          {currentText}
        </div>
        {animating && (
          <div className="ticker-sentence enter-from-below">
            {nextText}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Workflow Card Modal Data ─────────────────────────────────────────────────

interface WorkflowDetail {
  id: string;
  stepNum: string;
  title: string;
  subtitle: string;
  description: string;
  details: string[];
  codeSample?: {
    filename: string;
    content: string;
  };
}

const WORKFLOW_DETAILS: Record<string, WorkflowDetail> = {
  '01': {
    id: '01',
    stepNum: '01',
    title: 'Telemetry Stream Inspection',
    subtitle: 'Real-time observability logs, metric data points, and trace spans.',
    description: 'During a live incident, telemetry data is revealed incrementally as you execute investigative actions. Each action carries an in-scenario time cost.',
    details: [
      'Structured Log Parsing: View severity levels (WARN, ERROR), timestamp offsets, and payload metadata.',
      'Metric Points: Monitor P95/P99 latency curves, thread pool utilization, and connection counts.',
      'Trace Spans: Inspect RPC spans across microservices to pinpoint execution bottlenecks.',
      'Time-Cost Tradeoffs: Choose actions wisely — irrelevant investigations consume scenario time.'
    ],
    codeSample: {
      filename: 'telemetry_stream.log',
      content: `[t+14s] WARN  payments-api: Retry storm detected on POST /authorize\n[t+20s] TRACE payments-db: pool_connections_active=96/100 (wait_time_ms=2100ms)`
    }
  },
  '02': {
    id: '02',
    stepNum: '02',
    title: 'Topology Graph Mapping',
    subtitle: 'Interactive service dependency graph and failure propagation.',
    description: 'Complex microservice architectures obscure the true origin of an outage. The interactive topology graph visualizes nodes, dependencies, and health states.',
    details: [
      'Service Nodes & Edges: Inspect upstream callers and downstream databases/caches.',
      'Implicated Node Highlighting: Nodes pulse in real-time when telemetry indicates degradation.',
      'Cascade Isolation: Identify whether a failure originates at the ingress proxy or deep in the storage tier.',
      'Interactive Layout: Click any node to filter related logs and metrics.'
    ],
    codeSample: {
      filename: 'topology_map.json',
      content: `{\n  "nodes": ["api-gateway", "payments-service", "redis-cache", "postgres-primary"],\n  "edges": [{"from": "api-gateway", "to": "payments-service"}],\n  "degraded": ["redis-cache"]\n}`
    }
  },
  '03': {
    id: '03',
    stepNum: '03',
    title: 'Root Cause Hypothesis',
    subtitle: 'Documenting engineering intent before committing to fixes.',
    description: 'In high-stakes incidents, guessing or blindly restarting services causes further outages. Incident Room requires you to record a hypothesis before remediation.',
    details: [
      'Engineering Reasoning: Articulate why you believe a specific component is failing.',
      'Hypothesis vs Reality: Your reflection is preserved and evaluated against the actual postmortem.',
      'Debrief Scoring: Higher accuracy and clear reasoning contribute to overall debrief score.',
      'Prevents Trigger-Happy Restarts: Instills disciplined SRE methodology under pressure.'
    ],
    codeSample: {
      filename: 'sre_hypothesis.log',
      content: `$ incident-room reflect --text "Redis cache connection pool is exhausted due to missing backoff policy on authorization retries."`
    }
  },
  '04': {
    id: '04',
    stepNum: '04',
    title: 'Mitigation & Technical Debrief',
    subtitle: 'Executing targeted remediations, scoring, and postmortem analysis.',
    description: 'After identifying the root cause, select the optimal remediation action. Receive instant feedback, speed bonus calculations, and a complete postmortem.',
    details: [
      'Remediation Evaluation: Choices range from Correct to Partially Correct, Incorrect, or Harmful.',
      'Time Bonus Calculation: Finishing under target time grants bonus points.',
      'Comprehensive Postmortem: Review a detailed technical breakdown of the outage.',
      'Global Percentile & Leaderboard: Compare your resolution time against SREs worldwide.'
    ],
    codeSample: {
      filename: 'debrief_summary.json',
      content: `{\n  "correctness": "CORRECT",\n  "scorePoints": 100,\n  "timeBonus": 45,\n  "finalScore": 145,\n  "percentile": 92\n}`
    }
  }
};

function WorkflowModal({ detail, onClose }: { detail: WorkflowDetail; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="workflow-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="workflow-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="workflow-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="home-workflow-num" style={{ margin: 0 }}>{detail.stepNum}</span>
            <strong style={{ fontSize: 16 }}>{detail.title}</strong>
          </div>
          <button className="workflow-modal-close" onClick={onClose} aria-label="Close modal">
            <IconXMark size={16} />
          </button>
        </div>

        <div className="workflow-modal-body">
          <p className="lead" style={{ fontSize: 15, margin: '0 0 16px', color: 'var(--ink)' }}>
            {detail.subtitle}
          </p>
          <p style={{ color: 'var(--dim)', lineHeight: 1.6, margin: 0 }}>
            {detail.description}
          </p>

          <ul className="workflow-modal-list">
            {detail.details.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          {detail.codeSample && (
            <div className="workflow-modal-code">
              <div style={{ color: 'var(--faint)', marginBottom: 6, fontSize: 11 }}>
                // {detail.codeSample.filename}
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{detail.codeSample.content}</pre>
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <button className="button outline" onClick={onClose}>
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const dailyResult = useApiGet<ScenarioDetailDto>('/api/v1/scenarios/daily');
  const scenariosResult = useApiGet<Page<ScenarioSummaryDto>>('/api/v1/scenarios?page=0&size=6');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDetail | null>(null);

  return (
    <main className="shell page">
      {/* ── SRE Hero Section ── */}
      <div className="home-hero">
        <div>
          <h1 className="home-hero-title">
            Debug production outages under real on-call conditions.
          </h1>
          <p className="home-hero-lead">
            No mocks or dummy slides. Real service topologies, live log streams, and cascading system failures.
            Inspect telemetry, isolate the root cause, and execute the fix under pressure.
          </p>
          <div className="home-hero-actions">
            <Link className="home-hero-btn-primary" href="/scenarios">
              Browse Incidents →
            </Link>
            <Link className="button outline" href="/play?daily=true" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconFlame size={14} /> Daily Challenge (~10m)
            </Link>
          </div>

          {/* Real Dynamic CLI Triage Box (Sourced from backend dailyResult API) */}
          <div className="hero-triage-box">
            <div><span className="cmd">$</span> incident-room status --daily</div>
            {dailyResult.status === 'success' ? (
              <>
                <div>
                  <span className="key">DAILY INCIDENT:</span> <span className="val">{dailyResult.data.title}</span> ({dailyResult.data.difficulty})
                </div>
                <div>
                  <span className="key">ROOT CAUSE CLASS:</span> <span className="val">#{dailyResult.data.rootCauseClass}</span> · Target: {Math.round(dailyResult.data.durationTargetSeconds / 60)}m
                </div>
              </>
            ) : (
              <div>
                <span className="key">STATUS:</span> <span className="val">Connecting to incident simulation cluster…</span>
              </div>
            )}
          </div>
        </div>

        {/* Hero Right Column: Daily Incident + Live Hero Preview */}
        <div className="hero-right">
          <div className="home-daily-card">
            <div className="section-label" style={{ color: 'var(--signal)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconFlame size={13} /> Today&rsquo;s Featured Incident
            </div>
            <AsyncBoundary state={dailyResult} loadingLabel="Loading daily incident challenge…">
              {(daily) => (
                <>
                  <div className="daily-top" style={{ marginTop: 12 }}>
                    <DifficultyBadge difficulty={daily.difficulty} />
                    <span className="tag">#{daily.rootCauseClass}</span>
                  </div>
                  <h3 style={{ fontSize: 20, marginTop: 12, fontWeight: 700 }}>{daily.title}</h3>
                  <p style={{ margin: '8px 0 16px', color: 'var(--dim)', fontSize: 13, lineHeight: 1.5 }}>
                    {daily.symptomSummary}
                  </p>
                  <div className="daily-bottom">
                    <span className="mono" style={{ color: 'var(--faint)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <IconClock size={12} /> Target: {Math.round(daily.durationTargetSeconds / 60)} min
                    </span>
                    <Link className="button primary" href={`/play?scenario=${daily.slug}`}>
                      Start Challenge →
                    </Link>
                  </div>
                </>
              )}
            </AsyncBoundary>
          </div>

          <HeroPreview />
        </div>
      </div>

      {/* ── Explanation Flow Ticker (Replaces Fake Stats Bar) ── */}
      <ExplanationTicker />

      {/* ── Featured Incidents Catalog ── */}
      <div className="section">
        <div className="section-heading">
          <div>
            <div className="section-label">Incident Catalog</div>
            <h2>Featured Outage Simulations</h2>
          </div>
          <Link className="text-btn" href="/scenarios">
            View all incidents →
          </Link>
        </div>

        <AsyncBoundary state={scenariosResult} loadingLabel="Loading catalog scenarios…">
          {(data) => (
            <div className="grid">
              {data.content.map((scenario) => (
                <ScenarioCard key={scenario.slug} scenario={scenario} />
              ))}
            </div>
          )}
        </AsyncBoundary>
      </div>

      {/* ── Incident Response Loop Workflow (Interactive Detail Modal on Click) ── */}
      <div className="section">
        <div className="section-heading">
          <div>
            <div className="section-label">Command Workflow</div>
            <h2>The Incident Response Loop</h2>
          </div>
        </div>

        <div className="home-workflow-grid">
          <div
            className="home-workflow-card"
            onClick={() => setSelectedWorkflow(WORKFLOW_DETAILS['01']!)}
            title="Click to view detailed walkthrough for Telemetry Stream"
          >
            <div className="home-workflow-num">01. TELEMETRY STREAM</div>
            <h3 style={{ marginBottom: 8, fontSize: 17 }}>Inspect Live Signals</h3>
            <p style={{ margin: 0, color: 'var(--dim)', fontSize: 13, lineHeight: 1.6 }}>
              Stream real-time log outputs, metric data points, and trace spans as you execute diagnostic checks.
            </p>
            <div className="home-workflow-card__hint">Inspect Details ↗</div>
          </div>

          <div
            className="home-workflow-card"
            onClick={() => setSelectedWorkflow(WORKFLOW_DETAILS['02']!)}
            title="Click to view detailed walkthrough for Topology Graph"
          >
            <div className="home-workflow-num">02. TOPOLOGY GRAPH</div>
            <h3 style={{ marginBottom: 8, fontSize: 17 }}>Map System Dependencies</h3>
            <p style={{ margin: 0, color: 'var(--dim)', fontSize: 13, lineHeight: 1.6 }}>
              Visualize microservice dependencies and trace cascade failures to locate the failing node.
            </p>
            <div className="home-workflow-card__hint">Inspect Details ↗</div>
          </div>

          <div
            className="home-workflow-card"
            onClick={() => setSelectedWorkflow(WORKFLOW_DETAILS['03']!)}
            title="Click to view detailed walkthrough for Root Cause Hypothesis"
          >
            <div className="home-workflow-num">03. ROOT CAUSE HYPOTHESIS</div>
            <h3 style={{ marginBottom: 8, fontSize: 17 }}>Formulate Hypothesis</h3>
            <p style={{ margin: 0, color: 'var(--dim)', fontSize: 13, lineHeight: 1.6 }}>
              Document your diagnostic reasoning under time pressure before committing to remediation.
            </p>
            <div className="home-workflow-card__hint">Inspect Details ↗</div>
          </div>

          <div
            className="home-workflow-card"
            onClick={() => setSelectedWorkflow(WORKFLOW_DETAILS['04']!)}
            title="Click to view detailed walkthrough for Mitigation & Debrief"
          >
            <div className="home-workflow-num">04. MITIGATION &amp; DEBRIEF</div>
            <h3 style={{ marginBottom: 8, fontSize: 17 }}>Remediate &amp; Score</h3>
            <p style={{ margin: 0, color: 'var(--dim)', fontSize: 13, lineHeight: 1.6 }}>
              Execute remediation fixes, earn speed bonuses, and review technical postmortem reports.
            </p>
            <div className="home-workflow-card__hint">Inspect Details ↗</div>
          </div>
        </div>
      </div>

      {/* ── Workflow Detail Modal Overlay ── */}
      {selectedWorkflow && (
        <WorkflowModal
          detail={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
        />
      )}

      {/* ── Call to Action Banner ── */}
      <div className="home-cta-banner">
        <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>
          Test your SRE incident response skills now.
        </h2>
        <p className="lead" style={{ margin: '0 0 28px', textAlign: 'center' }}>
          No installation required. Jump straight into an active simulation or sign up to track your daily streak.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link className="home-hero-btn-primary" href="/scenarios">
            Explore Incident Scenarios →
          </Link>
          <Link className="button outline" href="/register">
            Create Free Account
          </Link>
        </div>
      </div>
    </main>
  );
}
