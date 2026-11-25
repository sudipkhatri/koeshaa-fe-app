"use client";

import type { Locale } from "@keoshaa/i18n";

import { useMessages } from "@/lib/locale";

const LOCALES = ["en", "ne"] as const satisfies readonly Locale[];

type Variant = "header" | "panel" | "admin";

const groupClass: Record<Variant, string> = {
  header: "flex gap-1 rounded-lg bg-mist p-1",
  panel: "flex gap-2",
  admin: "flex gap-0.5 rounded-lg bg-admin-page p-0.5",
};

const choiceClass: Record<Variant, string> = {
  header: "min-h-12 rounded-xl px-3 text-sm",
  panel: "min-h-12 rounded-xl px-3 text-sm",
  admin: "min-h-12 rounded-md px-2.75 text-caption md:min-h-7.5",
};

const selectedClass: Record<Variant, string> = {
  header: "bg-canvas text-text",
  panel: "bg-primary-tint text-on-primary-tint",
  admin: "bg-admin-surface text-admin-ink",
};

const idleClass: Record<Variant, string> = {
  header: "text-ink-soft hover:text-text",
  panel: "text-ink-soft hover:text-text",
  admin: "text-admin-soft hover:text-admin-ink",
};

export function LocaleSwitch({ variant }: { variant: Variant }) {
  const { locale, choose, translate } = useMessages();
  return (
    <div role="group" aria-label={translate("landing.language")} className={groupClass[variant]}>
      {LOCALES.map((code) => (
        <LocaleChoice
          key={code}
          code={code}
          selected={locale === code}
          variant={variant}
          onChoose={choose}
        />
      ))}
    </div>
  );
}

function LocaleChoice({
  code,
  selected,
  variant,
  onChoose,
}: {
  code: Locale;
  selected: boolean;
  variant: Variant;
  onChoose: (locale: Locale) => void;
}) {
  const { translate } = useMessages();
  const fullName = translate(code === "en" ? "auth.english" : "auth.nepali");
  const label = variant === "panel" ? fullName : code === "en" ? "EN" : "ने";
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={fullName}
      onClick={() => onChoose(code)}
      className={`inline-flex cursor-pointer items-center font-semibold transition-colors ${choiceClass[variant]} ${selected ? selectedClass[variant] : idleClass[variant]}`}
    >
      {label}
    </button>
  );
}
