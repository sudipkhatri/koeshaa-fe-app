"use client";

import { defaultLocale, t, type Locale, type MessageKey } from "@keoshaa/i18n";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "keoshaa.locale";
const listeners = new Set<() => void>();

function storedLocale(): Locale {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "en" || saved === "ne" ? saved : defaultLocale;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

interface LocaleValue {
  locale: Locale;
  choose: (locale: Locale) => void;
  translate: (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, storedLocale, () => defaultLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const choose = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    listeners.forEach((listener) => listener());
  }, []);

  const translate = useCallback(
    (key: MessageKey, params?: Readonly<Record<string, string | number>>) => t(locale, key, params),
    [locale],
  );

  const value = useMemo(() => ({ locale, choose, translate }), [locale, choose, translate]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useMessages(): LocaleValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useMessages must be used inside LocaleProvider");
  return value;
}
