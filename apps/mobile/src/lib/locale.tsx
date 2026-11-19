import { t as translate } from "@keoshaa/i18n";
import type { Locale, MessageKey } from "@keoshaa/i18n";
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { writePreference } from "./storage";

type Params = Readonly<Record<string, string | number>>;

interface LocaleValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: MessageKey, params?: Params) => string;
  /** Digits and grouping in the active language (Nepali uses Devanagari digits). */
  formatNumber: (value: number) => string;
  /** Digits only, no grouping commas (years). */
  formatDigits: (value: number) => string;
  /** Seconds as m:ss in the active language's digits. */
  formatClock: (seconds: number) => string;
}

const LocaleContext = createContext<LocaleValue | null>(null);

const numberLocale: Record<Locale, string> = { en: "en-US", ne: "ne-NP" };

export function LocaleProvider({ initial, children }: { initial: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState(initial);

  const value = useMemo<LocaleValue>(() => {
    const tag = numberLocale[locale];
    const grouped = new Intl.NumberFormat(tag);
    const plain = new Intl.NumberFormat(tag, { useGrouping: false });
    const twoDigits = new Intl.NumberFormat(tag, { minimumIntegerDigits: 2 });
    return {
      locale,
      setLocale: (next) => {
        setLocaleState(next);
        void writePreference("locale", next);
      },
      t: (key, params) => translate(locale, key, params),
      formatNumber: (n) => grouped.format(n),
      formatDigits: (n) => plain.format(n),
      formatClock: (seconds) =>
        `${grouped.format(Math.floor(seconds / 60))}:${twoDigits.format(seconds % 60)}`,
    };
  }, [locale]);

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}
