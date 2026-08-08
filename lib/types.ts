/**
 * Error envelope shape, confirmed against ApiErrorResponse.java / GlobalExceptionHandler.java.
 *
 * - `@JsonInclude(NON_NULL)` on the backend means `fieldErrors` is OMITTED entirely
 *   (not present as `null` or `[]`) on non-validation errors — treat it as optional.
 * - There is NO `status` field in the body. HTTP status only ever comes from the
 *   actual response status code.
 * - The 429 rate-limit response does NOT follow this envelope at all (see ApiError /
 *   parseErrorBody in lib/api.ts) — it's a hand-written literal with only `code`/`message`.
 */
export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  timestamp?: string;
  correlationId?: string;
  fieldErrors?: ApiFieldError[];
}

/**
 * Known error codes the frontend branches on. This is not an exhaustive union of every
 * code the backend can emit — just the ones with distinct frontend-facing behavior.
 * Treat unrecognized codes as generic errors (show `message`).
 */
export type KnownApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED' // Spring Security itself blocked the request before it reached a controller
  | 'INVALID_CREDENTIALS' // thrown explicitly by service/controller code for a business reason
  | 'FORBIDDEN' // only reachable via /actuator/**, not attempt ownership
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'RATE_LIMITED'
  | 'EMAIL_NOT_VERIFIED';

// ---------------------------------------------------------------------------
// Reconciled against the real OpenAPI document (openapi.json) in this pass.
// Every field name/shape below is taken directly from `components.schemas` —
// this REPLACES the M1 best-effort reconstruction, which had drifted in a few
// places now that the real spec is available:
//   - ScenarioSummaryDto has NO duration/estimate field at all (only DetailDto
//     does, as `durationTargetSeconds`, in SECONDS not minutes).
//   - the root-cause field is `rootCauseClass`, not `rootCauseTag`.
//   - `TopologyDto.nodes` carry `type`/`label`, NOT `xPct`/`yPct` — the API
//     does not send layout positions at all. `components/scenario/topology.tsx`
//     now computes a layered layout client-side instead of reading DTO coords.
//   - `ScenarioDetailDto` has no `briefing`/`investigationToolCount`/
//     `remediationCount` fields — those were invented in M1. Long-form intro
//     copy is `symptomSummary`; tool/remediation counts are derived from the
//     `actions` array (`kind === 'INVESTIGATE' | 'REMEDIATE'`) at render time.
// ---------------------------------------------------------------------------

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ActionKind = 'INVESTIGATE' | 'REMEDIATE';
export type TelemetryType = 'LOG' | 'METRIC_POINT' | 'TRACE_SPAN';
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type Correctness = 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'HARMFUL';
export type UserRole = 'USER' | 'ADMIN';

export interface NodeDto {
  id: string;
  type: string;
  label: string;
}

export interface EdgeDto {
  from: string;
  to: string;
}

export interface TopologyDto {
  nodes: NodeDto[];
  edges: EdgeDto[];
}

export interface ScenarioActionDto {
  key: string;
  kind: ActionKind;
  label: string;
  description: string;
  costSeconds: number;
}

export interface TelemetryEventDto {
  t: number;
  type: TelemetryType;
  source: string;
  payload: Record<string, unknown>;
}

export interface ScenarioSeoDto {
  metaTitle: string;
  metaDescription: string;
  ogImagePath: string;
}

export interface ScenarioSummaryDto {
  slug: string;
  title: string;
  difficulty: Difficulty;
  rootCauseClass: string;
  symptomSummary: string;
}

export interface ScenarioDetailDto {
  slug: string;
  title: string;
  difficulty: Difficulty;
  rootCauseClass: string;
  symptomSummary: string;
  durationTargetSeconds: number;
  topology: TopologyDto;
  actions: ScenarioActionDto[];
  ambientTelemetry: TelemetryEventDto[];
  postmortemMarkdown: string;
  seo: ScenarioSeoDto;
}

/** Spring Data Page<T> shape, confirmed §A.3 — used by /scenarios and /users/me/attempts. */
export interface PageMeta {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface Page<T> {
  content: T[];
  page: PageMeta;
}

export interface SitemapEntryDto {
  slug: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// M2 — Attempts (play loop) DTOs
// ---------------------------------------------------------------------------

export interface AttemptStateResponse {
  attemptId: string;
  scenarioSlug: string;
  scenarioTitle: string;
  symptomSummary: string;
  durationTargetSeconds: number;
  topology: TopologyDto;
  actions: ScenarioActionDto[];
  revealedTelemetry: TelemetryEventDto[];
  actionsTakenKeys: string[];
  status: AttemptStatus;
  /** Only present for anonymous attempts, only on the initial `start` response. */
  capabilityToken?: string;
}

export interface TakeActionResponse {
  revealedTelemetry: TelemetryEventDto[];
  costSeconds: number;
  elapsedSeconds: number;
}

export interface ResolveAttemptResponse {
  correctness: Correctness;
  scorePoints: number;
  timeBonus: number;
  finalScore: number;
  explanation: string;
  /** Same markdown as ScenarioDetailDto.postmortemMarkdown, re-served under this key. */
  postmortem: string;
  elapsedSeconds: number;
  percentile: number | null;
  reflectionText: string | null;
  scenarioSlug?: string;
  scenarioTitle?: string;
}

export interface ClaimAttemptsResponse {
  claimedCount: number;
  skippedCount: number;
}

/** scenarioTitle is null (not omitted) if the scenario was later deleted — render a
 *  fallback, don't assume it's always present. finalScore/elapsedSeconds are only
 *  ever populated for a COMPLETED attempt; both are null otherwise. */
export interface AttemptSummaryDto {
  attemptId: string;
  scenarioSlug: string;
  scenarioTitle: string | null;
  status: AttemptStatus;
  finalScore: number | null;
  elapsedSeconds: number | null;
  startedAt: string;
  completedAt?: string;
}

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  elapsedSeconds: number;
  achievedAt: string;
}

/** Bespoke shape, NOT a Spring Page<T> — confirmed §A.3. */
export interface LeaderboardResponseDto {
  scenarioSlug: string;
  entries: LeaderboardEntryDto[];
  totalEntries: number;
  page: number;
  size: number;
}

export interface ImportScenarioResponse {
  id: string;
  slug: string;
  published: boolean;
  validationWarnings: string[];
}

// ---------------------------------------------------------------------------
// Admin scenario management — backs GET/DELETE /api/v1/admin/scenarios(/{id}).
// Added alongside the backend endpoints of the same name: the admin console no
// longer keeps its own bookkeeping of "scenarios imported in this browser" in
// localStorage (see the product analysis, gap 3.1) — this is the backend's own
// authoritative list, so it's consistent across devices/admins.
// ---------------------------------------------------------------------------

export interface AdminScenarioSummaryDto {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  rootCauseClass: string;
  published: boolean;
  dailyDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// User stats — backs GET /api/v1/users/me/stats, the profile page's summary row.
// ---------------------------------------------------------------------------

export interface UserStatsDto {
  completedCount: number;
  /** null (not 0) when completedCount is 0 — "no data yet", not "average score of zero". */
  averageScore: number | null;
}
