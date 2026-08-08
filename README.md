# Incident Room — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind, built modularly against the
source-verified backend contract. This package is **M0 — Foundations**.

## What's in this milestone

- **`next.config.js`** — the corrected path-preserving proxy rewrite. This is the fix
  for the critical bug in the original draft: the backend scopes the `ir_refresh`
  cookie to `Path=/api/v1/auth`, so the frontend origin must serve requests at the
  identical `/api/v1/...` path (no `/api/proxy` prefix) or the refresh cookie is never
  attached and refresh/logout silently break.
- **`lib/api.ts`** — the fetch wrapper. Treats any `2xx` as success (register is 202,
  start-attempt is 201, several PATCHes are 204 — all success, none special-cased).
  Parses the `{ code, message, timestamp?, correlationId?, fieldErrors? }` error
  envelope, reading `X-Correlation-Id` from the response header first (always present,
  even on 429s) and falling back to the body only if the header is missing.
- **`lib/types.ts`** — the error envelope + known error codes shared across the app.
- **`lib/auth-context.tsx`** — `AuthProvider`. Calls `GET /auth/me` on mount; a `401
  UNAUTHENTICATED` response is treated as "anonymous," not an error. Exposes
  `user` (`undefined` = still checking, `null` = confirmed anonymous), `refresh()`,
  `setUser()` (for the login/register flow to call in M4), and `logout()`.
- **`app/globals.css`** — the full design system, ported 1:1 from the approved
  prototype's `styles.css`. Class names (`.card`, `.badge`, `.button`, `.topbar`,
  `.panel`, etc.) are kept identical on purpose so later milestones reuse this
  vocabulary instead of re-deriving new styles per page.
- **`app/layout.tsx`** + **`components/layout/header.tsx`** — root shell, fonts
  (Manrope + DM Mono via `next/font/google`, matching the prototype exactly), and the
  auth-aware top bar (shows "Log in" when anonymous; streak + Profile + "Log out" when
  authenticated).
- **`app/page.tsx`** — placeholder homepage confirming the scaffold renders correctly.
  The real homepage (hero, today's incident, featured scenarios) ships in M1.

## Setup

```bash
npm install
cp .env.example .env.local   # set BACKEND_BASE_URL to your backend
npm run dev
```

Open http://localhost:3000 — you should see the dark-themed shell, top bar, and the
M0 placeholder message.

`npm run typecheck` runs a strict TypeScript check with no emit.

## Design system source of truth

The uploaded prototype (`index.html` / `app.js` / `styles.css`) is the approved visual
language. `app/globals.css` is a faithful port of its CSS — don't restyle existing
classes without checking against the prototype first. New components introduced in
later milestones should extend this vocabulary, not replace it.

## M1 — Public Surface (added on top of M0)

- **`app/page.tsx`** — real homepage: hero, today's-incident card (`GET /scenarios/daily`),
  featured scenarios grid (`GET /scenarios?page=0&size=4`).
- **`app/scenarios/page.tsx`** — catalog. Difficulty + root-cause filters and pagination
  are synced to the URL query string (`?difficulty=&rootCause=&page=`) via
  `useSearchParams`/`router.push` rather than local-only state, so filtered views are
  linkable/bookmarkable/back-button-safe. Wrapped in `<Suspense>` per Next's
  `useSearchParams` requirement.
- **`app/scenarios/[slug]/page.tsx`** — scenario detail, 404s cleanly via `AsyncBoundary`
  when the backend returns `404 NOT_FOUND` (unpublished/nonexistent slug).
- **`app/daily/page.tsx`** — same detail view, `daily` variant (today's-date eyebrow,
  streak nudge), sourced from `GET /scenarios/daily` instead of a slug.
- **`components/scenario/topology.tsx`** — renders `TopologyDto` (nodes + edges)
  dynamically instead of the prototype's hardcoded 4-node SVG, so it's correct for
  any scenario's system diagram, not just "The Thundering Herd." Reused as-is by M2
  in interactive mode (`interactive`, `activeNodeId`, `onNodeClick` props already
  wired for that).
- **`components/scenario/{difficulty-badge,scenario-card,detail-view}.tsx`** — shared
  UI pulled out so the homepage, catalog, and detail pages don't duplicate markup.
- **`app/not-found.tsx`** — styled 404 for unmatched routes.

**Known stub links in this milestone:** "Start incident" points to `/play` (built in
M2) and "View leaderboard" points to `/scenarios/{slug}/leaderboard` (built in M3).
Both 404 until those milestones land — expected, not a bug.

**Assumption flagged for review:** the plan document confirms `ScenarioSummaryDto` /
`ScenarioDetailDto` / `TopologyDto` shapes are unchanged from an earlier OpenAPI-based
draft that wasn't included in what I verified — so the exact field names in
`lib/types.ts` (`rootCauseTag`, `symptomSummary`, `estimatedMinutes`, `topology: {
nodes, edges }`, etc.) are my best reconstruction from the design prototype's data
shape, not source-checked the way the rest of this doc is. If they don't match the
real DTOs, it's a one-file rename in `lib/types.ts` — no other file hardcodes field
names independently.

**Data fetching is client-side on purpose.** `lib/use-api.ts` fetches from the browser
through the same-origin proxy so cookie behavior stays uniform across public and
authenticated pages alike, rather than splitting some pages onto server-side fetches.
M9 (SEO) is the place to reconsider this for crawlability on the handful of pages that
need it (catalog, scenario detail) — everything else (play, profile, admin) should
stay client-fetched regardless since it's all cookie-gated.

## M1 correction pass (done at the start of M2)

The real OpenAPI document was supplied for the first time in this pass, and it
diverges from the M1 best-effort DTO reconstruction in a few places. Fixed
throughout `lib/types.ts` and every component/page that touched these fields:

- `ScenarioSummaryDto` has **no** duration/estimate field at all — only
  `ScenarioDetailDto` does, as `durationTargetSeconds` (seconds, not minutes).
  `ScenarioCard` no longer shows a "~N min" pill; the estimate now only
  appears on the detail page, computed from seconds.
- The root-cause field is `rootCauseClass`, not `rootCauseTag` — including the
  catalog filter's query param, which is `?rootCauseClass=`, not `?rootCause=`.
- `TopologyDto.nodes` carry `{ id, type, label }` — **no layout coordinates**.
  The M1 `Topology` component assumed `xPct`/`yPct` per node; that data
  doesn't exist in the real API. Rewritten to compute a deterministic layered
  layout client-side (BFS by edge direction, columns = layer, evenly spaced
  rows) instead of reading positions off the DTO.
- `ScenarioDetailDto` has no `briefing`/`investigationToolCount`/
  `remediationCount` fields. Briefing copy now uses `symptomSummary`; the two
  counts are derived from `actions` (split by `kind`) at render time.
- `UserResponse` — `AuthUser` renamed `streakDays` → `currentStreak` and added
  `role`, matching the real DTO exactly.
- `lib/api.ts` now centrally attaches `X-CSRF-Token` (read from the
  JS-readable `ir_csrf` cookie) on every non-GET request. This was needed for
  M2's mutating calls but is a cross-cutting fix — every milestone from here
  on benefits without re-deriving it.

## M2 — Core Loop (Play Screen + Debrief)

- **`app/play/page.tsx`** — starter route. Reads `?scenario=slug` or
  `?daily=true`, resolves a scenario slug (fetching `GET /scenarios/daily`
  first if needed), `POST`s `/attempts` exactly once (guarded against
  double-invocation), stores the anonymous `capabilityToken` if one comes
  back, then replaces the URL to `/play/{attemptId}`. Starting an attempt is
  a side-effecting POST, so it deliberately doesn't live on a re-enterable
  route.
- **`app/play/[id]/page.tsx`** — the actual play screen. Hydrates via
  `GET /attempts/{id}` (safe to reload/reload-and-resume). Renders the
  topology, a live telemetry feed, investigate/remediate action columns, and
  the working-hypothesis textarea (debounced autosave to
  `PATCH /reflection`, flushed synchronously before resolving). Remediation
  requires an explicit confirm step before it commits. Elapsed time is a
  client-side approximation reset to the server's `elapsedSeconds` after every
  action/resolve round-trip — `AttemptStateResponse` itself carries no
  elapsed field, so this is a soft pacing display against
  `durationTargetSeconds`, not the number used for scoring.
- **`app/result/[id]/page.tsx`** — debrief screen, `GET /attempts/{id}/result`.
  A `409 CONFLICT` (not yet resolved) redirects back to `/play/{id}`; a `404`
  shows the same expired-attempt card as the play screen. Renders score
  breakdown, outcome badge (`CORRECT`/`PARTIALLY_CORRECT`/`INCORRECT`/
  `HARMFUL`), the player's saved hypothesis if any, and the postmortem.
- **`lib/anon-tokens.ts`** — localStorage bookkeeping for anonymous
  capability tokens: a per-attempt map (used to attach
  `X-Capability-Token` on every subsequent request for that attempt) and a
  capped list of claimable attempts for M5's post-login claim flow.
- Attempt access failures collapse to a single `404` card everywhere
  (`ExpiredCard`) — per the plan, the backend deliberately won't say whether
  an attempt doesn't exist, isn't yours, or the token was wrong, so the UI
  doesn't imply more certainty than that.
- `resolve()` and `takeAction()` are idempotent server-side, so no special
  handling is needed for double-submits beyond disabling the button while a
  request is in flight (already done).
- No markdown renderer is in this package's dependencies yet — `postmortem`/
  `explanation` are rendered as plain paragraphs split on blank lines
  (`ProseBlock`), not through a markdown library. Fine for prose; revisit if
  scenario authors start relying on lists/headings.

**Known stub links in this milestone:** the leaderboard link on the detail
page still 404s until M3. Login-gated attempt claiming isn't wired up until
M5 — anonymous tokens are being collected in `localStorage` starting now so
M5 has something to claim.

## M3 — Daily + Leaderboard

Daily itself (`app/daily/page.tsx`, the homepage's daily card) already shipped in M1
— this milestone is the leaderboard page it and the scenario detail page both link to.

- **`app/scenarios/[slug]/leaderboard/page.tsx`** — paginated leaderboard table.
  `page`/`size` are synced to the URL query string (same pattern as the catalog
  filters) so a specific page is linkable/bookmarkable. `size` is clamped
  client-side to 50 — confirmed in the plan that, unlike `/scenarios` and
  `/users/me/attempts`, this endpoint does **not** cap it server-side, so a
  hand-edited URL could otherwise ask the backend for an unbounded page.
  The current user's row (matched by `userId` against `useAuth()`'s `user.id`)
  gets the `.you` highlight class. A 404 (unpublished/nonexistent slug) falls
  through to `AsyncBoundary`'s existing generic not-found copy — no special
  handling needed since that's already the right message here.
- No changes elsewhere — the plan confirms nothing else in M3 needed touching
  beyond what M1 already had right (the daily detail view, its "View
  leaderboard" link, and the 404-before-empty-list behavior on the backend).

## M4 — Auth Flow

- **`app/login/page.tsx`** — `POST /auth/login`. `401 INVALID_CREDENTIALS` (unknown
  email, wrong password, or an OAuth-only account — indistinguishable by design) shows
  "incorrect email or password"; `403 EMAIL_NOT_VERIFIED` redirects straight to
  `/verify-email?email=` instead of showing an error, since that's a normal next step,
  not a failure. Confirmed ordering: a wrong password on an unverified account is
  `401`, not `403` — the backend checks the password first, so the branch order above
  is load-bearing, not incidental. Supports `?next=/some/path` for post-login redirect
  (ignored unless it's a same-origin path).
- **`app/register/page.tsx`** — `POST /auth/register`, always `202` regardless of what
  happened server-side (new account / already-verified silent no-op / unverified
  account gets a fresh code) — success copy is deliberately non-committal ("check your
  email if it needs verifying") rather than promising an email was sent, since that
  would be false in the already-verified case. `400 VALIDATION_FAILED` renders
  per-field errors via the new `lib/form-errors.ts` helper (`email`/`password`/
  `displayName`).
- **`app/verify-email/page.tsx`** — code entry (prefilled `?email=` from register) plus
  a "Resend code" action (`POST /auth/resend-verification`, 3/hour). Verifying sets the
  auth cookies and calls `setUser()` directly from the response rather than a separate
  `refresh()` round-trip. Treats the OpenAPI doc's claim that 400/401 here return a
  `UserResponse` body as spec drift (same generation issue as the status-code table) —
  `lib/api.ts`'s standard error-envelope parsing is used regardless of what the doc
  says the error content type is.
- **`lib/form-errors.ts`** — small shared helper turning `fieldErrors[]` into a
  `{ field: message }` map; only register's `400` currently uses it, but it's generic
  for any future form that gets per-field validation errors.

**Known gap in this milestone:** nothing calls `POST /attempts/claim` yet — an
anonymous player who registers/logs in via these screens doesn't have their prior
localStorage attempts linked until M5 explicitly wires that up. `lib/anon-tokens.ts`'s
claimable list keeps accumulating in the meantime, so M5 has something to claim.

## M5 — Claim Attempts

- **`lib/use-claim-attempts.ts`** — `useClaimAttemptsOnLogin()`. Fires
  `POST /attempts/claim` automatically the instant `useAuth().user` becomes truthy —
  covers login, register-then-verify, and a page reload of an already-authenticated
  session, all from one place, instead of re-deriving a "claim now" call at the end of
  every auth flow individually.
- **`components/ui/claim-attempts-toast.tsx`** — mounts the hook at the root layout (so
  it fires no matter which page the user lands on) and shows a brief `.toast` if
  `claimedCount > 0`, auto-dismissing after 6s. Renders nothing if there was nothing to
  claim or the whole claim silently no-oped.
- **No confirmation UI, deliberately.** The tokens being claimed are the ones this
  browser already stored from its own anonymous play (`lib/anon-tokens.ts`) — there's
  no new consent to ask for, just linking data that's already sitting in localStorage
  to the account that just authenticated. Already-owned tokens claim idempotently
  (harmless re-count into `claimedCount`); tokens belonging to a different account are
  silently skipped server-side (`skippedCount`) — no error surfaced for that case,
  matching the confirmed backend behavior.
- The local claimable list is only cleared on a **successful** claim round-trip. A
  `RATE_LIMITED` (5/minute) response or a network blip leaves the list in place and
  resets the "already tried" guard, so the next login/reload retries instead of losing
  the tokens permanently.
- No changes to `/play/[id]` or `/result/[id]` — a claimed attempt is now owned by the
  account, so the existing cookie session is sufficient going forward; the stored
  per-attempt capability token in `lib/anon-tokens.ts` is simply harmless to keep
  sending alongside it.

## M6 — Profile / History

- **`app/profile/page.tsx`** — auth-gated. `useAuth().user` is `undefined` while the
  initial `GET /auth/me` is in flight and `null` once confirmed anonymous; only the
  `null` case redirects to `/login?next=/profile` — redirecting on `undefined` too
  would bounce an already-logged-in user on every hard reload, before the auth check
  has had a chance to resolve.
- Paginated via `GET /users/me/attempts?page=&size=`, synced to `?page=` in the URL
  (same pattern as the catalog and leaderboard). This is one of the two endpoints the
  backend caps server-side at `Math.min(size, 50)` (the other is `/scenarios`), so no
  client-side clamp is required here the way the leaderboard needed one in M3.
- Each row in the attempt table links somewhere useful based on the attempt's actual
  lifecycle state rather than always going to the scenario page: `IN_PROGRESS` resumes
  at `/play/{id}`, `COMPLETED` opens the debrief at `/result/{id}`, `ABANDONED` goes
  back to the scenario detail page to start fresh. `finalScore` is only shown for
  `COMPLETED` rows (an em dash otherwise) since the field isn't meaningful before
  resolution.
- No new DTOs or endpoints beyond what the plan already confirmed for `AttemptSummaryDto`
  / `PagedModelAttemptSummaryDto` — this milestone is UI only.

## M7 — Error Surfaces

- **`lib/toast-context.tsx`** — `ToastProvider` + `useToast()`. Generalizes the
  one-off toast M5 built for the claim-attempts notice into a shared primitive any
  future mutation/action can push to (`success` or `error` variant), instead of every
  feature re-inventing its own dismiss timer. Mounted once at the root layout, above
  `AuthProvider`/`ClaimAttemptsToast`. Multiple toasts stack downward from the same
  top-right corner rather than replacing each other.
- **`components/ui/claim-attempts-toast.tsx`** — updated to push through `useToast()`
  instead of holding its own local visible/timeout state; behavior for the person is
  unchanged from M5.
- **`lib/error-messages.ts`** — `describeApiError()`. Centralizes the copy for every
  `KnownApiErrorCode` in one place for read (`GET`) failures. Auth forms
  (login/register/verify-email) keep their own tailored branches where a code means
  more than a message swap (`EMAIL_NOT_VERIFIED` redirecting instead of erroring,
  `INVALID_CREDENTIALS`'s specific copy) — this doesn't replace those, it's for
  `AsyncBoundary` and any future generic fallback.
- **`components/ui/correlation-id.tsx`** — `<CorrelationIdBlock>`, referenced by name
  in the plan document's §A.1 notes. Renders "Reference: {id}" from `ApiError.correlationId`
  when present, nothing otherwise (the correlation ID is genuinely absent only for a
  failure that never reached the backend's own error handling at all).
- **`components/ui/empty-state.tsx`** — thin wrapper around the existing `.empty`
  class pattern with an optional action slot (a link, a button). Purely additive —
  earlier milestones' hand-rolled `<div className="empty">` blocks don't need
  migrating for this to be useful going forward.
- **`components/ui/async-boundary.tsx`** — upgraded from the M1 placeholder: uses
  `describeApiError` instead of one generic string, shows `<CorrelationIdBlock>`, and
  renders a "Try again" button when the state carries a `refetch` (every `useApiGet`
  result has one now — see below). Every existing page that already passes a
  `useApiGet` result straight into `<AsyncBoundary state={...}>` gets retry and
  per-code messaging automatically, with no changes needed at those call sites.
- **`lib/use-api.ts`** — `useApiGet` now also returns `refetch()`, which bumps an
  internal counter in the effect's dependency list to re-run the same fetch. Returning
  `{ ...state, refetch }` keeps every existing call site working unchanged (they only
  ever destructured `.status`/`.data`/`.error`) while giving `AsyncBoundary` something
  to wire a retry button to.

**Scope note:** this milestone targets shared *read*-path error surfaces (GETs
rendered through `AsyncBoundary`) and the toast system. It deliberately does not touch
the play/result screens' single-404-card handling from M2 (that collapse is
intentional backend behavior, not a generic error case) or the auth forms' specific
branches from M4 — both already have the right bespoke messaging for what they do.

## M8 — Admin

- **`app/admin/page.tsx`** — gated by `user.role === 'ADMIN'`. Non-admins (and
  anonymous visitors) see the exact same 404 as `app/not-found.tsx`, not a "forbidden"
  page — matching the backend's own behavior, where every `/api/v1/admin/**` route is
  intercepted by Spring Security's filter chain before any admin controller runs, so
  it's genuinely unreachable for them regardless (confirmed in the plan). Showing
  anything else here would reveal an admin section exists to someone who can't use it.
- **`lib/admin-scenarios.ts`** — local bookkeeping only, and deliberately so: there is
  **no `GET` endpoint anywhere in this API that lists scenarios by ID** —
  `/scenarios`/`/scenarios/{slug}` are both public-only and only ever return
  *published* scenarios. The one and only place a scenario's Mongo `id` is ever
  surfaced is `ImportScenarioResponse`, right after an import. So this remembers
  "scenarios imported in this browser" (upserted by `slug` — re-importing the same
  slug updates the row, matching the backend's own create-or-update import semantics)
  purely so the admin has something to act on across a page reload, not as a cache of
  authoritative state — every publish/schedule action still round-trips and updates
  from the real response.
- Import form posts raw YAML as `text/plain` (not JSON) via `rawBody: true` on `post()`.
  `400` (syntax/structure error) shows the message inline; success shows any
  `validationWarnings` in a warning block and records the `{id, slug, published}` for
  the management table below.
- Publish/unpublish toggle: unpublishing never validates and always succeeds;
  publishing runs full validation and, on failure, returns **one concatenated message
  string**, not per-field errors (`ScenarioValidationService` joins with `"; "`) —
  rendered as a single block under that row, not split into field errors.
- Daily-date scheduling uses a native `<input type="date">`, whose value format
  (`YYYY-MM-DD`) already matches `SetDailyDateRequest.date`'s expected pattern exactly.
  `204` on success.
- A `404 NOT_FOUND` on either action (the scenario ID no longer resolves) drops that
  row from the local bookkeeping rather than leaving a permanently-broken entry around.
- **`components/layout/header.tsx`** — the "Admin" nav link only renders for
  `user.role === 'ADMIN'`, so non-admins never even see a hint of the section existing.

## Post-M8 bugfixes

Two runtime bugs reported against the M8 build, fixed here:

- **`app/play/page.tsx`** — `scenarioParam`/`isDaily` were declared inside the
  `useEffect`'s async `run()` function but referenced in the effect's dependency
  array, which is out of scope at that point (`scenarioParam is not defined`). Both
  are now derived from `searchParams` at the top of `run()` instead, and the deps
  array is just `[router, searchParams]`.
- **`lib/auth-context.tsx`** — `logout()` used `try/finally`, which still rethrew
  after clearing local state. A failed backend logout call (expired session, stale
  `ir_csrf` cookie, etc.) crashed whatever called `logout()`, since
  `components/layout/header.tsx`'s `handleLogout` wasn't catching it either. `logout()`
  now catches and logs instead of rethrowing — local session state clears either way,
  which is what the user experiences as "logged out" regardless of whether the
  backend call itself succeeded.

## M9 — SEO

- **`lib/server-api.ts`** — new server-only fetch helper (`serverGet`,
  `resolveOgImageUrl`), separate from `lib/api.ts` on purpose: `lib/api.ts` goes
  through the same-origin proxy and reads `document.cookie` for CSRF, neither of which
  exists in a server component / `generateMetadata` / `sitemap.ts` context. This talks
  to `BACKEND_BASE_URL` directly — safe only because every caller is server-only
  (enforced by the `server-only` package) and every endpoint it's used for is public.
- **`app/scenarios/[slug]/page.tsx`** and **`app/daily/page.tsx`** — moved from
  client-fetched (`useApiGet`) to server components with `generateMetadata` sourced
  from `ScenarioDetailDto.seo` (`metaTitle`/`metaDescription`/`ogImagePath`), calling
  `notFound()` on a 404 instead of the client `AsyncBoundary` error card. Same public,
  cookie-free endpoint either way, so no auth behavior changes. `ScenarioDetailView`
  itself needed no changes — it never had a `'use client'` directive or hooks, so it
  renders identically as a server component.
- **`app/scenarios/page.tsx`** — split into a thin server component (static
  `metadata` export) and `app/scenarios/catalog-client.tsx` (the actual filtering/
  pagination UI, unchanged, still client-driven since it's synced to the URL query
  string). Only the wrapper changed; the catalog experience itself is identical.
- **`app/sitemap.ts`** — generates `sitemap.xml` from `GET /sitemap-data` (one entry
  per published scenario, `lastModified` from `updatedAt`) plus the static public
  routes (`/`, `/scenarios`, `/daily`). Revalidates hourly.
- **`app/robots.ts`** — allows the public surface, disallows everything cookie-gated
  or otherwise non-indexable (`/play`, `/result`, `/profile`, `/admin`, the auth forms,
  `/api/`), points to `/sitemap.xml`.
- **`app/layout.tsx`** — added `metadataBase` (required for `generateMetadata`'s
  relative OG image resolution to produce absolute URLs), Open Graph/Twitter defaults,
  and a title template (`%s · Incident Room`) so per-page titles compose instead of
  each page needing to repeat the site name.
- **`.env.example`** — added `SITE_URL`, used server-side only (metadata/sitemap/
  robots all run on the server) for absolute URLs. Not secret, but no `NEXT_PUBLIC_`
  prefix needed since it never reaches the browser bundle.
- **Assumption flagged for review:** `ScenarioSeoDto.ogImagePath` isn't documented as
  absolute-or-relative anywhere in the plan/OpenAPI doc. `resolveOgImageUrl` treats a
  relative path as backend-hosted (`BACKEND_BASE_URL` + path) since Open Graph
  crawlers fetch the image directly, not through the app, so it has to be a real
  public URL regardless of which origin serves it. If scenario OG images actually ship
  from the frontend's own `/public` folder instead, that's a one-line swap to
  `SITE_URL` in `lib/server-api.ts` — flagged the same way the M1 DTO reconstruction
  assumptions were.
- **Out of scope, on purpose:** the homepage (`app/page.tsx`) and leaderboard page
  stay client-fetched. The homepage has no per-instance metadata need beyond what the
  root layout already provides; the leaderboard is inherently dynamic/paginated
  data with no real crawl value of its own. `/play`, `/profile`, and `/admin` stay
  client-fetched regardless, same as every prior milestone — they're cookie-gated,
  so there's nothing for a crawler to see there anyway.

## Milestone roadmap

```
M0 Foundations          ✓
M1 Public Surface       ✓  (home, catalog, scenario detail, topology)
 ├─▶ M2 Core Loop        ✓  (play screen, telemetry feed, debrief)
 │                          ─┐
 ├─▶ M4 Auth Flow        ✓  ─┴─▶ M3 Daily + Leaderboard  ✓
 │     └─▶ M5 Claim Attempts  ✓
 │            └─▶ M6 Profile / History  ✓
 ├─▶ M7 Error Surfaces   ✓  (shared error/toast/empty-state components)
 └─▶ M8 Admin            ✓
M9 SEO                  ✓  (sitemap, robots.txt, per-scenario metadata)
```

Each milestone ships as its own downloadable package that layers on top of this one —
same conventions, same `lib/api.ts`, same design tokens, additive routes and
components. Nothing here should need to be torn out later; M1+ will import from
`lib/api.ts` / `lib/auth-context.tsx` as-is.

## Key backend contract decisions baked in here

- Attempt access failures (`/attempts/{id}*`) are **404-only** by design — the backend
  deliberately collapses "doesn't exist," "not yours," and "bad token" into one
  `NOT_FOUND`. Don't build UI that implies more certainty than that.
- `403 FORBIDDEN` never happens for ownership — it's `/actuator/**` only. Admin routes
  404 for non-admins at the security-filter level, not 403.
- `resolve()` and `takeAction()` are idempotent — safe to retry on flaky networks,
  including double-submits from slow UI disabling.
- Leaderboard `size` has no server-side cap — clamp it client-side (M3).
#   I n c i d e n t - r o o m - f r o n t e n d  
 