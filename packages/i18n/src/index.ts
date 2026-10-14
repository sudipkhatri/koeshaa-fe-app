/**
 * English and Nepali strings for both apps. English is the default and the reference for keys;
 * Nepali is fully supported (every key, chosen by the user). `t()` is plain and synchronous so it works on the server,
 * in React Native and in tests; app-level hooks pick the locale.
 */

import { en } from "./en";
import { ne } from "./ne";
import type { Locale, MessageKey, Messages } from "./types";

export type { Locale, MessageKey, Messages } from "./types";

export const locales: readonly Locale[] = ["en", "ne"];
export const defaultLocale: Locale = "en";

const catalogs: Record<Locale, Messages> = { en, ne };

export function t(
  locale: Locale,
  key: MessageKey,
  params?: Readonly<Record<string, string | number>>,
): string {
  const template = lookup(catalogs[locale], key) ?? lookup(catalogs.en, key) ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}
