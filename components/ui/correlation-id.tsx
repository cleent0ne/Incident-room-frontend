import { ApiError } from '@/lib/api';

/**
 * `ApiError.correlationId` is sourced from the `X-Correlation-Id` response header
 * (present on every request, including 429s — see lib/api.ts) with a body fallback.
 * It's genuinely absent in exactly one case worth naming: a non-JSON/empty error body
 * from a layer outside the app's own error handling (network failure before any
 * response, or a proxy-level error) that also somehow didn't get a header attached —
 * in that case there's nothing to show, so this renders nothing rather than a
 * confusing "Reference: undefined".
 */
export function CorrelationIdBlock({ error }: { error: unknown }) {
  if (!(error instanceof ApiError) || !error.correlationId) {
    return null;
  }
  return (
    <p className="tag mono" style={{ marginTop: 10 }}>
      Reference: {error.correlationId}
    </p>
  );
}
