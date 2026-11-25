"use client";

import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { ApiError, NetworkError } from "@keoshaa/core";
import type { Locale, MessageKey } from "@keoshaa/i18n";

import { errorMessage, formatRetryTime } from "./errors";

/** Puts VALIDATION_ERROR onto the matching fields. The server's message text is not shown. */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  translate: (key: MessageKey) => string,
): void {
  if (!(error instanceof ApiError) || error.code !== "VALIDATION_ERROR") return;
  for (const detail of error.details) {
    if (!detail.field) continue;
    // Forms use the API field names, so the server's field maps onto the input.
    setError(detail.field as FieldPath<T>, { message: translate("errors.VALIDATION_ERROR") });
  }
}

type Translate = (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string;

/** Maps a failed submit onto field errors and one root message, keeping the typed values. */
export function recordFormFailure<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  translate: Translate,
  locale: Locale,
): void {
  applyFieldErrors(error, setError, translate);
  setError("root", {
    type: error instanceof NetworkError ? "offline" : "server",
    message: errorMessage(error, translate, (seconds) => formatRetryTime(seconds, locale)),
  });
}

/** Shows a catalogue key stored as a zod error, or the text itself when it is already translated. */
export function fieldText(
  message: string | undefined,
  translate: (key: MessageKey) => string,
): string | undefined {
  if (!message) return undefined;
  const translated = translate(message as MessageKey);
  return translated === message ? message : translated;
}
