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

  const [mobileTab, setMobileTab] = useState<'topology' | 'telemetry' | 'actions'>('actions');
  const [symptomExpanded, setSymptomExpanded] = useState(false);

  // Staged, not binary: crossing the target costs the time bonus, it doesn't fail the
  // attempt — a hard jump straight to --bad overstates that. Amber past target, red
  // reserved for well past (1.5x) — see the design guide's timer-urgency research on
  // avoiding manufactured panic for something that isn't actually a failure state.
  const overTarget = displayedElapsed > attempt.durationTargetSeconds;
  const wellOverTarget = displayedElapsed > attempt.durationTargetSeconds * 1.5;
  const timerClass = `timer mono${wellOverTarget ? ' over' : overTarget ? ' warn' : ''}`;

  return (
    <main className="shell page pb-12">
      {/* Sticky Play Header */}
      <div className="play-header">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="eyebrow truncate">{attempt.scenarioTitle}</span>
            <button
              type="button"
              className="text-[11px] font-mono text-neutral-400 hover:text-[#A3E635] sm:hidden underline decoration-dotted"
              onClick={() => setSymptomExpanded((v) => !v)}
            >
              {symptomExpanded ? 'Hide brief' : 'Brief'}
            </button>
          </div>
          <p
            className={`text-neutral-300 text-xs sm:text-sm mt-1 max-w-2xl transition-all ${
              symptomExpanded ? 'block' : 'hidden sm:block'
            }`}
          >
            {attempt.symptomSummary}
          </p>
        </div>
        <div className={`${timerClass} shrink-0 text-xs sm:text-sm`}>
          {formatClock(displayedElapsed)} / {formatClock(attempt.durationTargetSeconds)}
        </div>
      </div>

      {/* Mobile Tab Switcher (< 768px) */}
      <div className="md:hidden flex items-center justify-between bg-[#121214] border border-neutral-800 rounded-xl p-1 mt-3 gap-1 sticky top-[120px] z-10 shadow-lg">
        <button
          type="button"
          className={`flex-1 py-2 text-xs font-mono rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'topology'
              ? 'bg-[#A3E635] text-black shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
          onClick={() => setMobileTab('topology')}
        >
          <span>Topology</span>
          <span className="text-[10px] opacity-75">({attempt.topology.nodes.length})</span>
        </button>

        <button
          type="button"
          className={`flex-1 py-2 text-xs font-mono rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'telemetry'
              ? 'bg-[#A3E635] text-black shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
          onClick={() => setMobileTab('telemetry')}
        >
          <span>Signals</span>
          {telemetry.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              mobileTab === 'telemetry' ? 'bg-black text-[#A3E635]' : 'bg-[#A3E635]/20 text-[#A3E635]'
            }`}>
              {telemetry.length}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`flex-1 py-2 text-xs font-mono rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'actions'
              ? 'bg-[#A3E635] text-black shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
          onClick={() => setMobileTab('actions')}
        >
          <span>Actions</span>
          <span className="text-[10px] opacity-75">
            ({actionsTaken.size}/{investigateActions.length})
          </span>
        </button>
      </div>

      {/* Desktop Grid Layout & Mobile Active Tab View */}
      <div className="play-grid-container mt-4">
        
        {/* Topology Section */}
        <div className={`${mobileTab === 'topology' ? 'block' : 'hidden'} md:block mb-4 md:mb-0`}>
          <Topology
            topology={attempt.topology}
            interactive
            highlightedNodeIds={highlightedNodeIds}
            pulseNodeId={pulseNodeId}
          />
        </div>

        {/* Telemetry Feed Section */}
        <div className={`${mobileTab === 'telemetry' ? 'block' : 'hidden'} md:block feed bg-[#0A0A0A] border border-neutral-800 rounded-2xl md:rounded-none overflow-hidden shadow-lg`}>
          <div className="feed-title section-label flex items-center justify-between">
            <span>Telemetry Signals</span>
            <span className="text-[11px] font-mono text-neutral-400">
              {telemetry.length} revealed
            </span>
          </div>
          {telemetry.length === 0 ? (
            <div className="empty text-center py-10">
              No signals revealed yet — run an investigation action below.
            </div>
          ) : (
            <div className="max-h-[460px] overflow-y-auto overscroll-contain divide-y divide-white/5">
              {telemetry.map((event, idx) => (
                <div className="telemetry p-3.5 sm:p-4" key={`${event.source}-${event.t}-${idx}`}>
                  <time className="shrink-0 font-mono text-neutral-500 text-xs">t+{event.t}s</time>
                  <div className="min-w-0">
                    <span className="source text-xs font-mono font-bold text-neutral-400">
                      {event.source} · <span className="text-neutral-500">{event.type}</span>
                    </span>
                    <div className="mt-1">
                      <TelemetryPayload event={event} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {actionError && <div className="form-error mt-3.5 p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono">{actionError}</div>}

      {/* Actions Section */}
      <div className={`${mobileTab === 'actions' ? 'block' : 'hidden'} md:block mt-4`}>
        <div className="actions grid grid-cols-1 md:grid-cols-2 bg-[#0A0A0A] border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
          
          {/* Investigation Actions Column */}
          <div className="action-col p-2 sm:p-3 border-b md:border-b-0 md:border-r border-neutral-800">
            <div className="flex items-center justify-between px-2 py-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                Investigation Tools
              </span>
              <span className="progress-signal text-[11px]">
                {actionsTaken.size} of {investigateActions.length} run
              </span>
            </div>
            
            <div className="space-y-1.5">
              {investigateActions.map((action) => {
                const done = actionsTaken.has(action.key);
                return (
                  <button
                    key={action.key}
                    type="button"
                    className={`action w-full min-h-[52px] p-3 rounded-xl flex items-center justify-between gap-3 text-left transition-all ${
                      done
                        ? 'bg-neutral-900/40 border border-neutral-800/60 opacity-60'
                        : 'bg-[#121214] border border-neutral-800 hover:border-neutral-700 active:scale-[0.98]'
                    }`}
                    disabled={done || pendingKey === action.key || resolving}
                    onClick={() => handleInvestigate(action)}
                  >
                    <span className="min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-white block truncate">
                        {action.label}
                      </span>
                      <small className="text-[11px] text-neutral-400 block mt-0.5 line-clamp-1">
                        {action.description}
                      </small>
                    </span>
                    <span className="mono shrink-0 text-xs px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-bold text-neutral-300">
                      {done ? '✓' : pendingKey === action.key ? '…' : `${action.costSeconds}s`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remediation Decisions Column */}
          <div className="action-col p-2 sm:p-3 bg-[#0d0d0f]">
            <div className="px-2 py-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A3E635] font-semibold flex items-center gap-1.5">
                <span>⚡ Remediation Choice</span>
              </span>
              <span className="text-[10px] text-neutral-500 block mt-0.5">
                Choosing a fix concludes this incident and locks your final score.
              </span>
            </div>

            <div className="space-y-2 mt-1">
              {remediateActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  className="action remedy w-full min-h-[54px] p-3.5 rounded-xl border border-neutral-700/80 bg-[#141416] hover:border-[#A3E635] hover:bg-[#A3E635]/5 active:scale-[0.98] transition-all flex items-center justify-between gap-3 text-left"
                  disabled={resolving}
                  onClick={() => setConfirmRemediation(action)}
                >
                  <span className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-white block truncate">
                      {action.label}
                    </span>
                    <small className="text-[11px] text-neutral-400 block mt-0.5 line-clamp-1">
                      {action.description}
                    </small>
                  </span>
                  <span className="mono shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[#A3E635] text-black font-bold shadow-sm">
                    {resolving ? '…' : 'Remediate'}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Hypothesis Input Section */}
      <div className="hypothesis mt-4 p-4 rounded-2xl bg-[#0A0A0A] border border-neutral-800 shadow-lg">
        <div className="section-label flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
            Working Hypothesis
          </span>
          <span className="mono text-[11px] text-[#A3E635]">
            {reflectionStatus === 'saving' ? 'Saving…' : reflectionStatus === 'saved' ? 'Saved ✓' : ''}
          </span>
        </div>
        <textarea
          className="w-full min-h-[90px] p-3 rounded-xl bg-[#121214] border border-neutral-800 text-white text-xs sm:text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#A3E635] transition-colors"
          value={reflection}
          maxLength={REFLECTION_MAX}
          placeholder="What do you think is going on, before you commit to a fix?"
          onChange={(e) => handleReflectionChange(e.target.value)}
        />
      </div>

      {/* Centered Modal / Bottom Sheet for Remediation Confirmation */}
      {confirmRemediation && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirm remediation"
        >
          <div className="bg-[#121214] border border-neutral-700 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#A3E635]">
              <span className="text-xl">⚠️</span>
              <h3 className="text-base font-bold text-white font-mono">
                Confirm Remediation
              </h3>
            </div>
            
            <p className="text-neutral-300 text-sm leading-relaxed">
              Commit to <b className="text-white">&ldquo;{confirmRemediation.label}&rdquo;</b>? This will resolve the incident, evaluate your investigation, and lock in your score.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                className="btn-primary-lime w-full justify-center py-3 text-sm font-bold order-1 sm:order-2"
                onClick={() => handleResolve(confirmRemediation)}
                disabled={resolving}
              >
                {resolving ? 'Resolving incident…' : 'Yes, Confirm & Resolve'}
              </button>
              <button
                ref={cancelButtonRef}
                className="button outline w-full justify-center py-2.5 text-sm order-2 sm:order-1"
                onClick={() => setConfirmRemediation(null)}
                disabled={resolving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
