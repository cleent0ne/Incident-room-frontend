'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, get } from './api';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | Error }
  | { status: 'success'; data: T };

/**
 * GETs `path` on mount and whenever `deps` changes. Deliberately client-side (not a
 * server component fetch): every request needs to go through the same-origin
 * next.config.js rewrite so SameSite=Strict auth cookies are attached consistently,
 * and keeping ALL data fetching on one path (this hook) rather than splitting
 * public pages onto server-side fetches keeps that behavior uniform across the app.
 * M9 (SEO) revisits this for the handful of pages that need real SSR/crawlability.
 *
 * Pass `path = null` to skip fetching (e.g. waiting on a param).
 *
 * Returns the async state plus a `refetch()` — added in M7 so `AsyncBoundary` can
 * offer a "Try again" action on error without every call site building its own retry
 * plumbing. `refetch` just bumps an internal counter that's part of the effect's
 * dependency list; existing call sites that only destructure `.status`/`.data`/
 * `.error` off the returned object are unaffected by the extra field.
 */
export function useApiGet<T>(
  path: string | null,
  deps: React.DependencyList = []
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let cancelled = false;
    setState({ status: 'loading' });
    get<T>(path)
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', error: error instanceof Error ? error : new Error('Unknown error') });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, reloadToken, ...deps]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { ...state, refetch };
}

export { ApiError };

