import { defaultLocale, locales } from "@keoshaa/i18n";
import type { Locale } from "@keoshaa/i18n";

import { readPreference } from "./storage";

export const themePreferences = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof themePreferences)[number];

export interface Preferences {
  theme: ThemePreference;
  locale: Locale;
}

export const defaultPreferences: Preferences = { theme: "light", locale: defaultLocale };

function pick<T extends string>(allowed: readonly T[], stored: string | null, fallback: T): T {
  return allowed.find((value) => value === stored) ?? fallback;
}

/** Reads the stored choices; anything missing or unknown falls back to the defaults. */
export async function loadPreferences(): Promise<Preferences> {
  const [theme, locale] = await Promise.all([readPreference("theme"), readPreference("locale")]);
  return {
    theme: pick(themePreferences, theme, defaultPreferences.theme),
    locale: pick(locales, locale, defaultPreferences.locale),
  };
}
