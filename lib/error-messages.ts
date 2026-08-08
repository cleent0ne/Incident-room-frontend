import { ApiError } from './api';

/**
 * Centralizes the user-facing copy for the error `code`s the plan document confirms
 * have distinct frontend-facing meaning (§A.1 / `KnownApiErrorCode`). This is used by
 * `AsyncBoundary` for GET failures; the auth forms (login/register/verify-email) keep
 * their own tailored branches for codes with page-specific behavior (e.g.
 * `EMAIL_NOT_VERIFIED` redirecting instead of erroring) since that's more than a
 * message swap — but their generic fallback branches can reach for this too so the
 * "something went wrong, try again" copy stays consistent app-wide.
 *
 * Deliberately does NOT attempt to distinguish reasons the backend itself won't
 * distinguish (e.g. attempt-access 404s covering "doesn't exist" / "not yours" / "bad
 * token" identically) — see the M2 notes. Callers that need that specific collapsed
 * copy should keep using their own message rather than this generic one.
 */
export function describeApiError(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  switch (error.code) {
    case 'NOT_FOUND':
      return "This couldn't be found.";
    case 'UNAUTHENTICATED':
      return 'You need to be logged in to see this.';
    case 'INVALID_CREDENTIALS':
      return 'Incorrect email or password.';
    case 'EMAIL_NOT_VERIFIED':
      return 'This account still needs email verification.';
    case 'FORBIDDEN':
      return "You don't have access to this.";
    case 'CONFLICT':
      return "This isn't ready yet — it may still be in progress.";
    case 'BAD_REQUEST':
      return error.message || 'That request was invalid.';
    case 'VALIDATION_FAILED':
      return error.message || 'One or more fields are invalid.';
    case 'RATE_LIMITED':
      return 'Too many requests — slow down and try again in a moment.';
    default:
      return error.message || fallback;
  }
}
