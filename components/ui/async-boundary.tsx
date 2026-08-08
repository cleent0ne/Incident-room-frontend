import type { AsyncState } from '@/lib/use-api';
import { describeApiError } from '@/lib/error-messages';
import { CorrelationIdBlock } from './correlation-id';

/**
 * M7 upgrade over the M1 placeholder: per-code messaging via `describeApiError`
 * instead of a single generic string, an optional "Try again" action when the caller
 * passes `refetch` (every `useApiGet` result has one as of M7 — see lib/use-api.ts),
 * and the failing request's correlation ID for support reference when one is
 * available. Still deliberately generic beyond that — pages with backend-collapsed
 * error states (e.g. the play/result screens' single 404 card, per M2) keep their own
 * bespoke handling instead of routing through this.
 */
export function AsyncBoundary<T>({
  state,
  children,
  loadingLabel = 'Loading…',
}: {
  state: AsyncState<T> & { refetch?: () => void };
  children: (data: T) => React.ReactNode;
  loadingLabel?: string;
}) {
  if (state.status === 'loading') {
    return <div className="empty mono">{loadingLabel}</div>;
  }
  if (state.status === 'error') {
    return (
      <div className="empty">
        <p>{describeApiError(state.error)}</p>
        <CorrelationIdBlock error={state.error} />
        {state.refetch && (
          <button className="button outline" style={{ marginTop: 12 }} onClick={state.refetch}>
            Try again
          </button>
        )}
      </div>
    );
  }
  return <>{children(state.data)}</>;
}
