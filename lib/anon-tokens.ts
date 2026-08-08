/**
 * localStorage bookkeeping for anonymous-play capability tokens.
 *
 * `AttemptStateResponse.capabilityToken` is only present on the initial `start`
 * response, and only for anonymous (unauthenticated) attempts — every subsequent
 * request against that attempt (`GET /attempts/{id}`, actions, reflection, resolve,
 * result) needs it echoed back in the `X-Capability-Token` header, since the backend
 * collapses "no cookie session" + "no/wrong token" into an identical 404 (see M2 notes:
 * `requireAccessibleAttempt` never distinguishes these cases on purpose).
 *
 * Two things are stored:
 *  - a per-attempt map (attemptId -> token) so the play/result screens can attach the
 *    right header after a reload, without the token ever appearing in the URL.
 *  - a flat list of {attemptId, scenarioSlug, token} entries, capped at the backend's
 *    claim limit (20), used by M5's "claim your anonymous attempts" flow after login.
 */

const TOKEN_MAP_KEY = 'ir_capability_tokens_v1';
const CLAIM_LIST_KEY = 'ir_claimable_attempts_v1';
const MAX_CLAIMABLE = 20;

export interface ClaimableAttempt {
  attemptId: string;
  scenarioSlug: string;
  scenarioTitle: string;
  token: string;
  startedAt: string;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or disabled (private browsing) — degrade silently. Anonymous
    // play still works within the tab; claiming later just won't find this one.
  }
}

export function getCapabilityToken(attemptId: string): string | undefined {
  return readJson<Record<string, string>>(TOKEN_MAP_KEY, {})[attemptId];
}

export function saveCapabilityToken(entry: {
  attemptId: string;
  scenarioSlug: string;
  scenarioTitle: string;
  token: string;
}): void {
  const map = readJson<Record<string, string>>(TOKEN_MAP_KEY, {});
  map[entry.attemptId] = entry.token;
  writeJson(TOKEN_MAP_KEY, map);

  const list = readJson<ClaimableAttempt[]>(CLAIM_LIST_KEY, []);
  const withoutDupe = list.filter((e) => e.attemptId !== entry.attemptId);
  const next = [
    ...withoutDupe,
    { ...entry, startedAt: new Date().toISOString() },
  ].slice(-MAX_CLAIMABLE);
  writeJson(CLAIM_LIST_KEY, next);
}

export function listClaimableAttempts(): ClaimableAttempt[] {
  return readJson<ClaimableAttempt[]>(CLAIM_LIST_KEY, []);
}

export function clearClaimableAttempts(): void {
  writeJson(CLAIM_LIST_KEY, []);
}

/** Attach the stored token for this attempt as a header, if one exists. Harmless to
 * omit — an authenticated attempt never had one stored in the first place. */
export function withCapabilityHeader(attemptId: string, headers: HeadersInit = {}): HeadersInit {
  const token = getCapabilityToken(attemptId);
  return token ? { ...headers, 'X-Capability-Token': token } : headers;
}
