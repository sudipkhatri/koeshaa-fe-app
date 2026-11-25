import { ApiError, NetworkError } from "@keoshaa/core";
import type { MessageKey } from "@keoshaa/i18n";

/** Codes that have a friendly message in both languages (`errors.<CODE>` in `@keoshaa/i18n`). */
const KNOWN_CODES = [
  "INVALID_CREDENTIALS",
  "SIGN_IN_LOCKED",
  "SESSION_ENDED",
  "SIGNED_OUT_FOR_DEVICE",
  "TOKEN_INVALID",
  "SESSION_REQUIRED",
  "CHALLENGE_EXPIRED",
  "INVALID_CODE",
  "WEAK_PASSWORD",
  "USE_PHONE_OR_EMAIL",
  "CHILD_NEEDS_IDENTIFIER",
  "NOT_A_STUDENT",
  "NOT_A_PARENT",
  "ACCOUNT_PAUSED",
  "ACCOUNT_CLOSING",
  "NO_VERIFIED_CONTACT",
  "UNDER_13_NEEDS_PARENT",
  "WRONG_PASSWORD",
  "DEVICE_NOT_FOUND",
  "IDENTIFIER_TAKEN",
  "CONSENT_OUTDATED",
  "TOO_MANY_CODES",
  "TOO_MANY_REQUESTS",
  "VALIDATION_ERROR",
  "FORBIDDEN",
  "UNAUTHORIZED",
  "POOL_NOT_PUBLISHED",
  "GRADE_LEVEL_NOT_FOUND",
  "STREAM_REQUIRED",
  "ENROLLMENT_EXISTS",
  "ENROLLMENT_NOT_DRAFT",
  "ENROLLMENT_DRAFT",
  "ENROLLMENT_ENDED",
  "WINDOW_CLOSED",
  "WINDOW_OPEN",
  "REQUEST_PENDING",
  "REQUEST_DECIDED",
  "NO_CHANGE",
  "PROFILE_LOCKED",
  "PAGE_NOT_FOUND",
  "MFA_UNAVAILABLE",
] as const;
type KnownCode = (typeof KNOWN_CODES)[number];

const isKnown = (code: string): code is KnownCode =>
  (KNOWN_CODES as readonly string[]).includes(code);

type Translate = (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string;

const withReference = (message: string, requestId: string | undefined) =>
  requestId ? `${message}\nRef: ${requestId}` : message;

/** The one place that turns a failure into a friendly message; pure, never shows the server's text. */
export function errorMessage(
  error: unknown,
  t: Translate,
  formatClock: (seconds: number) => string,
): string {
  if (error instanceof NetworkError) return t("errors.network");
  if (error instanceof ApiError) {
    if (isKnown(error.code)) {
      return t(`errors.${error.code}`, { time: formatClock(error.retryAfterSeconds ?? 60) });
    }
    if (error.status === 429) {
      return t("errors.TOO_MANY_REQUESTS", { time: formatClock(error.retryAfterSeconds ?? 60) });
    }
    if (error.status >= 500) {
      return withReference(t("errors.HTTP_500"), error.requestId);
    }
    return withReference(t("errors.unknown"), error.requestId);
  }
  return t("errors.unknown");
}

/** Server faults and unknown failures are worth a report; connection, 4xx and rate limits are not. */
export function shouldReport(error: unknown): boolean {
  if (error instanceof NetworkError) return false;
  if (error instanceof ApiError) return error.status >= 500;
  return true;
}

export const isNetworkError = (error: unknown): boolean => error instanceof NetworkError;

/** Rate-limit answers carry the time to wait; screens disable the action until then. */
export function retryAfterSeconds(error: unknown): number {
  return error instanceof ApiError && error.status === 429 ? (error.retryAfterSeconds ?? 60) : 0;
}

/** Whether a failed query should be tried again: connection problems and 5xx only (data-fetching.md). */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof NetworkError) return true;
  return error instanceof ApiError && error.status >= 500;
}
