import type { ApiFieldError } from './types';

/**
 * `fieldErrors` is only ever present on `VALIDATION_FAILED` responses (omitted
 * entirely elsewhere, per `@JsonInclude(NON_NULL)` — see lib/types.ts). Register's
 * `400` for a bad `email`/`password`/`displayName` is the only M4 case that uses this;
 * everything else (login, verify-email, resend) surfaces as a single `code` with no
 * per-field breakdown, so this stays a small shared helper rather than baked into
 * `ApiError` itself.
 */
export function fieldErrorMap(fieldErrors: ApiFieldError[] | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  for (const fe of fieldErrors ?? []) {
    map[fe.field] = fe.message;
  }
  return map;
}
