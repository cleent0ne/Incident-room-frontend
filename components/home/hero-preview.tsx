'use client';

import { useEffect, useState } from 'react';
import { TelemetryPayload } from '@/components/scenario/telemetry-event';
import { CountUp } from '@/components/ui/count-up';
import type { TelemetryEventDto } from '@/lib/types';

/**
 * A muted, auto-playing, looping demo of the core loop — telemetry reveals, then a
 * remediation choice, then a scored result — for the homepage hero's right column,
 * stacked with the daily-incident card.
 *
 * Deliberately NOT a recording of any real, playable scenario: the content below is
 * homepage-only fiction (a "payments API timeout" flavor, distinct from any seeded
 * scenario), so this never spoils an actual answer key for someone about to go play
 * for real — see hero-preview.test.tsx, which asserts that explicitly.
 *
 * Built entirely from the same <TelemetryPayload> renderer and .telemetry/.log/.metric/
 * .trace/.outcome/.score CSS classes the real play and result screens use, so it never
 * drifts out of sync with the rest of the product's visual language.
 *
 * FIXED SIZE, ON PURPOSE: this sits next to the daily-incident card and must never
 * change height or push the rest of the page around while it cycles. That rules out
 * simply accumulating every revealed frame on screen (which is what an earlier version
 * of this component did, and which grew taller every ~1.5s until it reset — exactly
 * the kind of layout shift this version is built to avoid). Instead:
 *   - During the "investigating" beats, only the last MAX_WINDOW frames are ever
 *     rendered at once — older ones are dropped from the DOM, not just visually
 *     hidden, so the container's content can never exceed its fixed height.
 *   - The final "result" beat replaces the feed entirely with its own centered view.
 * The CSS (.hero-preview / .hero-preview-body) also fixes the pixel height and clips
 * overflow as a second line of defense, so even a future content edit that makes a
 * frame taller than expected clips cleanly instead of growing the box.
 */

type Frame =
  | { kind: 'action'; text: string }
  | { kind: 'telemetry'; event: TelemetryEventDto }
  | { kind: 'remediation'; label: string }
  | { kind: 'result'; score: number; timeLabel: string };

const SCRIPT: { frame: Frame; holdMs: number }[] = [
  { frame: { kind: 'action', text: 'Investigating: payments API dashboard' }, holdMs: 1400 },
  {
    frame: {
      kind: 'telemetry',
      event: { t: 0, type: 'METRIC_POINT', source: 'payments-api', payload: { name: 'p95_latency_ms', value: 3800 } },
    },
    holdMs: 1500,
  },
  {
    frame: {
      kind: 'telemetry',
      event: {
        t: 6,
        type: 'LOG',
        source: 'payments-api',
        payload: { level: 'WARN', message: 'Retry storm detected on POST /payments/authorize' },
      },
    },
    holdMs: 1700,
  },
  {
    frame: {
      kind: 'telemetry',
      event: {
        t: 14,
        type: 'METRIC_POINT',
        source: 'payments-db',
        payload: { name: 'pool_connections_active', value: 96, max_connections: 100 },
      },
    },
    holdMs: 1700,
  },
  {
    frame: {
      kind: 'telemetry',
      event: {
        t: 20,
        type: 'TRACE_SPAN',
        source: 'payments-db',
        payload: { pool: 'payments-db-primary', wait_time_ms: 2100, note: 'Requests queuing for a free connection.' },
      },
    },
    holdMs: 1900,
  },
  { frame: { kind: 'remediation', label: 'Raise pool size + add exponential backoff' }, holdMs: 1300 },
  { frame: { kind: 'result', score: 92, timeLabel: '0:41' }, holdMs: 3200 },
];

const MAX_WINDOW = 3;
const TOTAL_CYCLE_MS = SCRIPT.reduce((sum, step) => sum + step.holdMs, 0) + 700; // + pause before restart

// For prefers-reduced-motion: a fixed, non-cycling snapshot chosen to still convey
// "this is a telemetry investigation game" at a glance — action, one representative
// telemetry beat, and the scored result. Deliberately NOT just "jump to the final
// frame": since the result frame renders as its own exclusive view (see below), a
// reduced-motion user would otherwise see only a bare score with zero context for
// what it means.
const REDUCED_MOTION_SNAPSHOT_INDICES = [0, 2, 6];

export function HeroPreview() {
  const [visibleCount, setVisibleCount] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [staticSnapshot, setStaticSnapshot] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setStaticSnapshot(true);
      return;
    }

    let cancelled = false;
    let index = 1;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function scheduleNext() {
      if (cancelled || index >= SCRIPT.length) return;
      const step = SCRIPT[index - 1];
      if (!step) return;
      const t = setTimeout(() => {
        if (cancelled) return;
        setVisibleCount(index + 1);
        index += 1;
        scheduleNext();
      }, step.holdMs);
      timeouts.push(t);
    }
    scheduleNext();

    const restart = setTimeout(() => {
      if (cancelled) return;
      setVisibleCount(1);
      setResetKey((k) => k + 1);
    }, TOTAL_CYCLE_MS);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      clearTimeout(restart);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const currentStep = SCRIPT[visibleCount - 1];
  const isResult = currentStep?.frame.kind === 'result';

  // Sliding window: only ever mount the last MAX_WINDOW frames while in the feed
  // phase — this, not just the CSS height, is what actually guarantees the DOM
  // content can't grow past a bounded size as the cycle progresses.
  const windowStart = Math.max(0, visibleCount - MAX_WINDOW);
  const windowFrames = SCRIPT.slice(windowStart, visibleCount);

  const snapshotFrames = REDUCED_MOTION_SNAPSHOT_INDICES.map((i) => SCRIPT[i]).filter(
    (step): step is (typeof SCRIPT)[number] => step !== undefined
  );

  return (
    <div className="hero-preview" aria-hidden="true">
      <div className="hero-preview-label">
        <span className="live-dot" />
        Live demo · {staticSnapshot ? ' static snapshot' : isResult ? ' result' : ' investigating'}
      </div>
      <div className="hero-preview-body">
        {staticSnapshot ? (
          snapshotFrames.map((step, i) => <HeroPreviewFrame key={i} frame={step.frame} />)
        ) : isResult && currentStep ? (
          <div className="hero-preview-result">
            <HeroPreviewFrame frame={currentStep.frame} />
          </div>
        ) : (
          windowFrames.map((step, i) => <HeroPreviewFrame key={windowStart + i} frame={step.frame} />)
        )}
      </div>
    </div>
  );
}

function HeroPreviewFrame({ frame }: { frame: Frame }) {
  switch (frame.kind) {
    case 'action':
      return <div className="hero-preview-action fade-in">{frame.text}</div>;
    case 'telemetry':
      return (
        <div className="telemetry fade-in">
          <time>t+{frame.event.t}s</time>
          <div>
            <span className="source">
              {frame.event.source} · {frame.event.type}
            </span>
            <TelemetryPayload event={frame.event} />
          </div>
        </div>
      );
    case 'remediation':
      return (
        <div className="hero-preview-action fade-in">
          Remediation selected: <strong>{frame.label}</strong>
        </div>
      );
    case 'result':
      return (
        <div className="score fade-in" style={{ margin: 0 }}>
          <div>
            <strong>
              <CountUp target={frame.score} />
            </strong>
            <span>pts</span>
          </div>
          <div className="outcome">Correct · {frame.timeLabel}</div>
        </div>
      );
  }
}
