# 🚨 Incident Room: Frontend

A web app for practicing production incident response. Players get a failing system, investigate it with telemetry and diagnostic tools, form a hypothesis, apply a remediation, and receive a scored debrief with a postmortem.

This repo is the **Next.js frontend**. It talks to a Spring Boot backend through a same-origin proxy.

**Live demo:** *(add link)* · **Backend repo:** *(add link)*

---

## ✨ Features

**Play**
- Scenario catalog with difficulty and root-cause filters, synced to the URL so filtered views are linkable and back-button safe
- Daily scenario with a streak and per-scenario leaderboards
- Interactive play screen with a system topology diagram, live telemetry feed, investigate and remediate actions, and an autosaved working hypothesis
- Debrief screen with score breakdown, outcome (`CORRECT`, `PARTIALLY_CORRECT`, `INCORRECT`, `HARMFUL`), your hypothesis, and the postmortem

**Accounts**
- Email registration with verification code, login, and logout
- Anonymous play with capability tokens, so guests can play first and **claim their attempts automatically** after signing up
- Profile with paginated attempt history that resumes in-progress attempts or opens past debriefs

**Admin**
- Role-gated panel for importing scenarios from YAML, publishing and unpublishing, and scheduling the daily scenario

**SEO**
- Server-rendered scenario and daily pages with per-scenario metadata and Open Graph tags
- Generated `sitemap.xml` and `robots.txt`

---

## 🧱 Tech Stack

| Layer | Tools |
|---|---|
| Framework | Next.js 14 (App Router), React |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS plus a custom design system in `globals.css` |
| Fonts | Manrope and DM Mono via `next/font/google` |
| Hosting | Vercel (frontend), Railway (Spring Boot backend) |

---

## 🚀 Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

| Variable | Purpose |
|---|---|
| `BACKEND_BASE_URL` | Backend origin, used by the proxy rewrite and server-side fetches |
| `SITE_URL` | Public site URL, used server-side for metadata, sitemap, and robots |

Other scripts: `npm run typecheck` runs a strict TypeScript check with no emit.

---

## 🗂 Project Structure

app/
page.tsx Homepage: hero, daily incident, featured scenarios
scenarios/ Catalog, detail, and leaderboard
daily/ Today’s scenario
play/ , play/[id]/ Start an attempt, then the play screen
result/[id]/ Debrief
login/ register/ verify-email/
profile/ admin/
sitemap.ts robots.ts
components/
layout/ scenario/ ui/ Header, topology and cards, toasts, boundaries, empty states
lib/
api.ts Fetch wrapper (errors, CSRF, correlation IDs)
server-api.ts Server-only fetch for metadata and sitemap
auth-context.tsx AuthProvider and useAuth()
anon-tokens.ts Anonymous capability token storage
use-api.ts use-claim-attempts.ts toast-context.tsx
error-messages.ts form-errors.ts types.ts


---

## 🧠 Design Decisions

**Path-preserving proxy.** The backend scopes the `ir_refresh` cookie to `Path=/api/v1/auth`, so the frontend must serve requests at the identical `/api/v1/...` path. Using a prefix like `/api/proxy` would stop the cookie from being attached and silently break refresh and logout. `next.config.js` rewrites without changing the path.

**One API wrapper.** `lib/api.ts` treats any `2xx` as success (register is `202`, start-attempt is `201`, several PATCHes are `204`). It parses the shared error envelope, prefers the `X-Correlation-Id` response header over the body, and attaches `X-CSRF-Token` from the `ir_csrf` cookie on every non-GET request.

**Auth states.** `user` is `undefined` while `GET /auth/me` is in flight and `null` once confirmed anonymous. Protected pages redirect only on `null`, so a hard reload never bounces a logged-in user.

**Deliberately vague attempt errors.** The backend returns a single `404` whether an attempt doesn't exist, isn't yours, or the token was wrong. The UI shows one "expired" card and implies nothing more.

**Idempotent mutations.** `resolve()` and `takeAction()` are safe to retry, so the UI only disables buttons while a request is in flight.

**Admin is invisible to non-admins.** Anonymous and non-admin visitors get the same 404 as any unknown route, and the nav link only renders for `role === 'ADMIN'`.

**Computed topology layout.** The API sends nodes and edges with no coordinates, so the topology component computes a layered layout client-side (BFS by edge direction), and it works for any scenario's diagram.

**Hybrid rendering.** Public pages that benefit from crawling (scenario detail, daily) are server components with `generateMetadata`. Everything cookie-gated (play, profile, admin) stays client-fetched through the proxy so cookie behavior is uniform.

**Safe claiming.** Attempt claiming fires once when a user becomes authenticated, covering login, register-then-verify, and reload. The local claim list clears only after a successful round-trip, so a rate limit or network failure retries on the next login instead of losing tokens.

---

## ⚠️ Known Assumptions

- `ScenarioSeoDto.ogImagePath` isn't documented as absolute or relative. A relative path is treated as backend-hosted (`BACKEND_BASE_URL` + path). If OG images ship from this app's `/public` folder instead, change it to `SITE_URL` in `lib/server-api.ts`.
- Admin scenario management is tracked locally in the browser, because the API has no endpoint that lists scenarios by ID.
- The postmortem and explanation render as plain paragraphs. There is no markdown renderer yet.

---

## 📌 Status

All planned milestones are complete: foundations, public surface, core play loop, daily and leaderboard, auth, claim flow, profile, error surfaces, admin, and SEO.
