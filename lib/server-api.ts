import 'server-only';

/**
 * Server-only counterpart to `lib/api.ts`. That file is deliberately browser-only —
 * it goes through the same-origin `next.config.js` rewrite so `SameSite=Strict`
 * cookies attach correctly, and it reads `document.cookie` for the CSRF header,
 * neither of which exists in a server component / `generateMetadata` / `sitemap.ts`
 * context (there's no browser yet, and none of these public endpoints need cookies
 * at all).
 *
 * This talks to `BACKEND_BASE_URL` directly instead. That's safe here specifically
 * because everything that imports this module runs only on the server (enforced by
 * the `server-only` import above — importing this from a Client Component is a build
 * error), so `BACKEND_BASE_URL` never reaches the browser bundle. Only use this for
 * unauthenticated, public GET endpoints (`/scenarios*`, `/sitemap-data`) — never for
 * anything cookie-gated.
 */
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? 'http://localhost:8080';

export interface ServerFetchOptions {
  /** Next.js fetch cache/revalidate hint. Defaults to revalidating hourly. */
  revalidate?: number | false;
}

/**
 * Returns `null` on a 404 (the one case every public GET endpoint in this API uses
 * consistently for "not found or not published" — see the plan doc), so callers can
 * turn that into `notFound()` without a try/catch at every call site. Any other
 * non-2xx status throws, since that's not an expected/navigable outcome for these
 * pages the way a 404 is.
 */
/**
 * `ScenarioSeoDto.ogImagePath` isn't documented as absolute-or-relative anywhere in
 * the plan/OpenAPI doc — flagged as an assumption, same as the M1 DTO reconstruction
 * pattern this codebase already uses elsewhere. Treated here as relative to the
 * *backend* origin (where the scenario data itself lives), not the frontend: Open
 * Graph crawlers fetch the image URL directly, not through the Next.js app, so it has
 * to be a real public URL regardless — and if it's already absolute (`http...`), it's
 * passed through untouched. If scenario OG images actually ship from the frontend's
 * own `/public` folder instead, swap `BACKEND_BASE_URL` for `SITE_URL` here — it's the
 * one place this assumption is encoded.
 */
export function resolveOgImageUrl(ogImagePath: string): string {
  if (/^https?:\/\//.test(ogImagePath)) return ogImagePath;
  return `${BACKEND_BASE_URL}${ogImagePath.startsWith('/') ? '' : '/'}${ogImagePath}`;
}

export async function serverGet<T>(path: string, options: ServerFetchOptions = {}): Promise<T | null> {
  const { revalidate = 3600 } = options;

  try {
    const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
      next: { revalidate },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    // Gracefully handle connection errors (e.g. backend offline during build prerendering / SSG).
    return null;
  }
}
