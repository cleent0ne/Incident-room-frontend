'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, get, patch, post } from '@/lib/api';
import { withCapabilityHeader } from '@/lib/anon-tokens';
import { Topology, matchNodeIdForSource } from '@/components/scenario/topology';
import { TelemetryPayload } from '@/components/scenario/telemetry-event';
import type {
  AttemptStateResponse,
  ResolveAttemptResponse,
  ScenarioActionDto,
  TakeActionResponse,
  TelemetryEventDto,
} from '@/lib/types';

const REFLECTION_MAX = 2000;
const REFLECTION_DEBOUNCE_MS = 900;

/**
 * Attempt access failures (GET, actions, resolve, reflection) collapse to a single
 * `404 NOT_FOUND` on purpose — the backend won't say whether the attempt doesn't
 * exist, isn't yours, or the token was wrong. Don't build messaging that implies
 * more certainty than that; this one card covers all three cases.
 */
function ExpiredCard() {
  return (
    <main className="shell page" style={{ textAlign: 'center' }}>
      <div className="empty">This attempt has expired, or the link isn&rsquo;t valid — start a new incident.</div>
      <Link className="button primary" style={{ marginTop: 18, display: 'inline-block' }} href="/scenarios">
        Browse incidents
      </Link>
    </main>
  );
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

export default function PlayScreen() {
  const params = useParams<{ id: string }>();
  const attemptId = params.id;
  const router = useRouter();

  const [attempt, setAttempt] = useState<AttemptStateResponse | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'expired' | 'error'>('loading');
  const [telemetry, setTelemetry] = useState<TelemetryEventDto[]>([]);
  const [actionsTaken, setActionsTaken] = useState<Set<string>>(new Set());
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [confirmRemediation, setConfirmRemediation] = useState<ScenarioActionDto | null>(null);
  const [reflection, setReflection] = useState('');
  const [reflectionStatus, setReflectionStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [actionError, setActionError] = useState<string | null>(null);

  // Elapsed time is client-approximated between server round-trips: AttemptStateResponse
  // doesn't carry elapsedSeconds (only TakeActionResponse/ResolveAttemptResponse do), so
  // this is a soft pacing indicator against durationTargetSeconds, not the authoritative
  // figure used for scoring — the server computes the real one from its own timestamps.
  const [baseElapsed, setBaseElapsed] = useState(0);
  const baseTimestampRef = useRef<number>(Date.now());
  const [tick, setTick] = useState(0);
  const reflectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Default focus lands on Cancel, not Confirm — per the design guide's confirmation-
  // dialog research: the safe option should be what a stray Enter/Tab lands on,
  // specifically to prevent accidentally locking in a remediation.
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (confirmRemediation) {
      cancelButtonRef.current?.focus();
    }
  }, [confirmRemediation]);

  useEffect(() => {
    if (!confirmRemediation) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setConfirmRemediation(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmRemediation]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const displayedElapsed = baseElapsed + (Date.now() - baseTimestampRef.current) / 1000;
  void tick; // referenced only to force the re-render each second

  const headers = useCallback(() => withCapabilityHeader(attemptId), [attemptId]);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const state = await get<AttemptStateResponse>(`/api/v1/attempts/${attemptId}`, {
          headers: headers(),
        });
        if (cancelled) return;
        if (state.status === 'COMPLETED') {
          router.replace(`/result/${attemptId}`);
          return;
        }
        if (state.status === 'ABANDONED') {
          // GET /attempts/{id}/result 409s for anything that isn't COMPLETED, so
          // redirecting an ABANDONED attempt to /result would just bounce straight
          // back here (that screen sends 409 back to /play) — an infinite loop.
          // There's no play or debrief to show for an abandoned attempt, so treat
          // it the same as an expired/invalid link instead of redirecting.
          setLoadState('expired');
          return;
        }
        setAttempt(state);
        setTelemetry(state.revealedTelemetry);
        setActionsTaken(new Set(state.actionsTakenKeys));
        setLoadState('ready');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setLoadState('expired');
        } else {
          setLoadState('error');
        }
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const investigateActions = useMemo(
    () => attempt?.actions.filter((a) => a.kind === 'INVESTIGATE') ?? [],
    [attempt]
  );
  const remediateActions = useMemo(
    () => attempt?.actions.filter((a) => a.kind === 'REMEDIATE') ?? [],
    [attempt]
  );

  // Topology reactivity, per the design guide: the diagram should visibly relate to
  // what's been investigated, not sit static all attempt. Every revealed event's
  // source gets a steady highlight; the most recently revealed one additionally gets
  // a one-shot pulse so the newest reveal has a distinct moment.
  const highlightedNodeIds = useMemo(() => {
    if (!attempt) return new Set<string>();
    const ids = telemetry
      .map((event) => matchNodeIdForSource(attempt.topology, event.source))
      .filter((id): id is string => Boolean(id));
    return new Set(ids);
  }, [attempt, telemetry]);

  const pulseNodeId = useMemo(() => {
    if (!attempt || telemetry.length === 0) return undefined;
    return matchNodeIdForSource(attempt.topology, telemetry[telemetry.length - 1]!.source);
  }, [attempt, telemetry]);

  async function handleInvestigate(action: ScenarioActionDto) {
    if (pendingKey || resolving || actionsTaken.has(action.key)) return;
    setActionError(null);
    setPendingKey(action.key);
    try {
      const result = await post<TakeActionResponse>(
        `/api/v1/attempts/${attemptId}/actions`,
        { actionKey: action.key },
        { headers: headers() }
      );
      setTelemetry((prev) => [...prev, ...result.revealedTelemetry]);
      setActionsTaken((prev) => new Set(prev).add(action.key));
      setBaseElapsed(result.elapsedSeconds);
      baseTimestampRef.current = Date.now();
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 404)) {
        // Attempt moved on underneath us (resolved elsewhere, or expired).
        router.replace(`/result/${attemptId}`);
      } else {
        setActionError('That action failed — try again.');
      }
    } finally {
      setPendingKey(null);
    }
  }

  async function handleResolve(action: ScenarioActionDto) {
    if (pendingKey || resolving) return;
    setActionError(null);
    setResolving(true);
    setConfirmRemediation(null);
    try {
      // Flush any pending reflection edit before locking in the remediation.
      if (reflectionTimer.current) {
        clearTimeout(reflectionTimer.current);
        await saveReflection(reflection);
      }
      const result = await post<ResolveAttemptResponse>(
        `/api/v1/attempts/${attemptId}/resolve`,
        { actionKey: action.key },
        { headers: headers() }
      );
      void result;
      router.push(`/result/${attemptId}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setLoadState('expired');
      } else if (err instanceof ApiError && err.status === 400) {
        // requireInProgress() 400 BAD_REQUEST — the attempt moved on underneath us
        // (already resolved from another tab, or abandoned server-side). There's
        // nothing left to confirm here; send them to /result, which will show the
        // real debrief if it's COMPLETED or bounce back if it's genuinely still
        // pending (409).
        router.replace(`/result/${attemptId}`);
        return;
      } else {
        setActionError('Could not resolve the incident — try again.');
      }
      setResolving(false);
    }
  }

  async function saveReflection(text: string) {
    setReflectionStatus('saving');
    try {
      await patch(`/api/v1/attempts/${attemptId}/reflection`, { text }, { headers: headers() });
      setReflectionStatus('saved');
    } catch {
      // Non-critical — the player's typed hypothesis isn't lost locally, it just
      // didn't sync this round; the next debounce tick (or resolve-time flush) retries.
      setReflectionStatus('idle');
    }
  }

  function handleReflectionChange(text: string) {
    const trimmed = text.slice(0, REFLECTION_MAX);
    setReflection(trimmed);
    setReflectionStatus('idle');
    if (reflectionTimer.current) clearTimeout(reflectionTimer.current);
    reflectionTimer.current = setTimeout(() => {
      void saveReflection(trimmed);
    }, REFLECTION_DEBOUNCE_MS);
  }

  if (loadState === 'loading') {
    return <main className="shell page empty mono">Loading incident…</main>;
  }
  if (loadState === 'expired') {
    return <ExpiredCard />;
  }
  if (loadState === 'error' || !attempt) {
    return (
      <main className="shell page">
        <div className="empty">Something went wrong loading this incident. Try refreshing.</div>
      </main>
    );
  }

  // Staged, not binary: crossing the target costs the time bonus, it doesn't fail the
  // attempt — a hard jump straight to --bad overstates that. Amber past target, red
  // reserved for well past (1.5x) — see the design guide's timer-urgency research on
  // avoiding manufactured panic for something that isn't actually a failure state.
  const overTarget = displayedElapsed > attempt.durationTargetSeconds;
  const wellOverTarget = displayedElapsed > attempt.durationTargetSeconds * 1.5;
  const timerClass = `timer mono${wellOverTarget ? ' over' : overTarget ? ' warn' : ''}`;

  return (
    <main className="shell page">
      <div className="play-header">
        <div>
          <div className="eyebrow">{attempt.scenarioTitle}</div>
          <p style={{ margin: '4px 0 0', color: 'var(--dim)', maxWidth: 560 }}>{attempt.symptomSummary}</p>
        </div>
        <div className={timerClass}>
          {formatClock(displayedElapsed)} / {formatClock(attempt.durationTargetSeconds)}
        </div>
      </div>

      <div className="play-grid">
        <Topology
          topology={attempt.topology}
          interactive
          highlightedNodeIds={highlightedNodeIds}
          pulseNodeId={pulseNodeId}
        />
        <div className="feed">
          <div className="feed-title section-label">Telemetry</div>
          {telemetry.length === 0 ? (
            <div className="empty">No signals revealed yet — run an investigation action.</div>
          ) : (
            telemetry.map((event, idx) => (
              <div className="telemetry" key={`${event.source}-${event.t}-${idx}`}>
                <time>t+{event.t}s</time>
                <div>
                  <span className="source">
                    {event.source} · {event.type}
                  </span>
                  <TelemetryPayload event={event} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {actionError && <div className="form-error" style={{ marginTop: 14 }}>{actionError}</div>}

      <div className="actions">
        <div className="action-col">
          <div className="progress-signal">
            {actionsTaken.size} of {investigateActions.length} signals investigated
          </div>
          {investigateActions.map((action) => {
            const done = actionsTaken.has(action.key);
            return (
              <button
                key={action.key}
                type="button"
                className={`action${done ? ' done' : ''}`}
                disabled={done || pendingKey === action.key || resolving}
                onClick={() => handleInvestigate(action)}
              >
                <span>
                  {action.label}
                  <small>{action.description}</small>
                </span>
                <span className="mono">
                  {done ? '✓' : pendingKey === action.key ? '…' : `${action.costSeconds}s`}
                </span>
              </button>
            );
          })}
        </div>
        <div className="action-col">
          {remediateActions.map((action) => (
            <button
              key={action.key}
              type="button"
              className="action remedy"
              disabled={resolving}
              onClick={() => setConfirmRemediation(action)}
            >
              <span>
                {action.label}
                <small>{action.description}</small>
              </span>
              <span className="mono">{resolving ? '…' : 'Remediate'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hypothesis">
        <div className="section-label">
          Working hypothesis{' '}
          <span className="mono" style={{ float: 'right', color: 'var(--faint)' }}>
            {reflectionStatus === 'saving' ? 'Saving…' : reflectionStatus === 'saved' ? 'Saved' : ''}
          </span>
        </div>
        <textarea
          value={reflection}
          maxLength={REFLECTION_MAX}
          placeholder="What do you think is going on, before you commit to a fix?"
          onChange={(e) => handleReflectionChange(e.target.value)}
        />
      </div>

      {confirmRemediation && (
        <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-label="Confirm remediation">
          <p>
            Commit to &ldquo;{confirmRemediation.label}&rdquo;? This ends the incident and locks in your score.
          </p>
          <button className="button primary" onClick={() => handleResolve(confirmRemediation)} disabled={resolving}>
            {resolving ? 'Resolving…' : 'Confirm remediation'}
          </button>{' '}
          <button
            ref={cancelButtonRef}
            className="button outline"
            onClick={() => setConfirmRemediation(null)}
            disabled={resolving}
          >
            Cancel
          </button>
        </div>
      )}
    </main>
  );
}
