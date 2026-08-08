import type { ApiErrorBody, KnownApiErrorCode } from './types';

/**
 * Thrown by `api()` for any non-2xx response. `correlationId` is sourced from the
 * `X-Correlation-Id` response header first (present on EVERY request — set by
 * CorrelationIdFilter, which runs before rate limiting or security, so it's on 429s
 * and 500s too) and falls back to the error body's `correlationId` only if the header
 * is somehow missing. The body's `correlationId` is itself absent on 429 responses,
 * since RateLimitFilter writes a hand-rolled body that doesn't follow the standard
 * envelope — so the header is the reliable source, not a redundant one.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId: string | undefined;
  readonly fieldErrors: ApiErrorBody['fieldErrors'];

  constructor(status: number, body: ApiErrorBody, correlationId: string | undefined) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.correlationId = correlationId;
    this.fieldErrors = body.fieldErrors;
  }

  is(code: KnownApiErrorCode): boolean {
    return this.code === code;
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip JSON-encoding `body` (e.g. FormData). Defaults to false. */
  rawBody?: boolean;
}

/**
 * `ir_csrf` is the one auth cookie that's NOT HttpOnly (`Path=/`, JS-readable by
 * design — it's the double-submit half of CSRF protection). Read directly rather than
 * threading it through every call site: every mutating endpoint in the API
 * (`/attempts*`, `/auth/logout*`, `/attempts/claim`, `/admin/**`, the reflection PATCH)
 * lists `csrfHeader` as an accepted security scheme, so attaching it centrally in
 * `api()` is the only way this doesn't need re-deriving per feature milestone.
 * Anonymous callers (no login yet) simply won't have this cookie set — `undefined` is
 * fine, no header gets sent, and the backend doesn't require it without a session to
 * protect in the first place.
 */
function readCsrfCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)ir_csrf=([^;]*)/);
  return match?.[1] !== undefined ? decodeURIComponent(match[1]) : undefined;
}

let activeRefreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }
  activeRefreshPromise = (async () => {
    try {
      const csrfToken = readCsrfCookie();
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      activeRefreshPromise = null;
    }
  })();
  return activeRefreshPromise;
}

/**
 * Fetch wrapper for the backend, called ONLY with paths under `/api/v1/...` so the
 * request stays same-origin and goes through the next.config.js rewrite (see the
 * critical cookie-path note there). Never call the backend origin directly from the
 * browser — SameSite=Strict cookies depend on this.
 *
 * Success handling is deliberately generic: the backend uses 200/201/202/204 across
 * different endpoints for "successful," and that set has already drifted once from
 * what an OpenAPI doc claimed. Any 2xx is success here; callers should not gate UI
 * logic on one specific status code.
 */
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, rawBody, headers, ...rest } = options;
  const method = (rest.method ?? 'GET').toUpperCase();
  const csrfToken = method !== 'GET' && method !== 'HEAD' ? readCsrfCookie() : undefined;

  const init: RequestInit = {
    ...rest,
    credentials: 'include', // cookies are HttpOnly + SameSite=Strict; always send them
    headers: {
      ...(rawBody || body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...headers,
    },
    body: rawBody || body === undefined ? (body as BodyInit | undefined) : JSON.stringify(body),
  };

  let response = await fetch(path, init);

  // If request failed with 401 on an endpoint other than auth endpoints,
  // attempt a single deduped silent refresh via /api/v1/auth/refresh and retry.
  if (
    response.status === 401 &&
    path !== '/api/v1/auth/refresh' &&
    path !== '/api/v1/auth/login' &&
    path !== '/api/v1/auth/register' &&
    path !== '/api/v1/auth/logout' &&
    path !== '/api/v1/auth/verify-email'
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const newCsrfToken = method !== 'GET' && method !== 'HEAD' ? readCsrfCookie() : undefined;
      const retryInit: RequestInit = {
        ...init,
        headers: {
          ...(init.headers as Record<string, string>),
          ...(newCsrfToken ? { 'X-CSRF-Token': newCsrfToken } : {}),
        },
      };
      response = await fetch(path, retryInit);
    }
  }

  const correlationIdHeader = response.headers.get('X-Correlation-Id') ?? undefined;

  if (!response.ok) {
    let errorBody: ApiErrorBody;
    try {
      errorBody = (await response.json()) as ApiErrorBody;
    } catch {
      // Body wasn't JSON (or was empty) — synthesize a minimal envelope so callers
      // can still branch on `status` even if `code`/`message` are generic.
      errorBody = { code: 'UNKNOWN', message: response.statusText || 'Request failed' };
    }
    throw new ApiError(response.status, errorBody, correlationIdHeader ?? errorBody.correlationId);
  }

  // 204 No Content (logout, logout-all, reflection PATCH, daily-date PATCH) and any
  // other empty-body 2xx — don't attempt to parse JSON that isn't there.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export const get = <T>(path: string, options?: ApiOptions) => api<T>(path, { ...options, method: 'GET' });
export const post = <T>(path: string, body?: unknown, options?: ApiOptions) =>
  api<T>(path, { ...options, method: 'POST', body });
export const patch = <T>(path: string, body?: unknown, options?: ApiOptions) =>
  api<T>(path, { ...options, method: 'PATCH', body });
export const del = <T>(path: string, options?: ApiOptions) => api<T>(path, { ...options, method: 'DELETE' });

