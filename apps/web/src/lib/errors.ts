import { ApiError, NetworkError } from "@keoshaa/core";
import type { Locale, MessageKey } from "@keoshaa/i18n";

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
  "VALIDATION_ERROR",
  "FORBIDDEN",
  "UNAUTHORIZED",
  "TOO_MANY_CODES",
  "TOO_MANY_REQUESTS",
  "ACCOUNT_PAUSED",
  "MFA_UNAVAILABLE",
  "HTTP_500",
] as const;

type KnownCode = (typeof KNOWN_CODES)[number];

const isKnown = (code: string): code is KnownCode =>
  (KNOWN_CODES as readonly string[]).includes(code);

type Translate = (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string;

/** Turns a failure into a catalogue message. The server's own text is never shown. */
export function errorMessage(
  error: unknown,
  translate: Translate,
  formatClock: (seconds: number) => string,
): string {
  if (error instanceof NetworkError) return translate("errors.network");
  if (error instanceof ApiError) {
    const time = formatClock(error.retryAfterSeconds ?? 60);
    if (isKnown(error.code)) return translate(`errors.${error.code}`, { time });
    if (error.status === 429) return translate("errors.TOO_MANY_REQUESTS", { time });
    if (error.status >= 500) return translate("errors.HTTP_500");
    return translate("errors.unknown");
  }
  return translate("errors.unknown");
}

/** Connection problems and 5xx only, and only twice (data-fetching.md). */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof NetworkError) return true;
  return error instanceof ApiError && error.status >= 500;
}

/** When the visitor can try again, as a Kathmandu clock time. */
export function formatRetryTime(seconds: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ne" ? "ne-NP" : "en-GB", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kathmandu",
  }).format(new Date(Date.now() + seconds * 1000));
}
