"use client";

import { defaultLocale, t } from "@keoshaa/i18n";

export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section role="alert" className="flex flex-col gap-4 py-8">
      <h1 className="text-3xl font-semibold">{t(defaultLocale, "state.errorTitle")}</h1>
      <p>{t(defaultLocale, "state.errorMessage")}</p>
      <button
        type="button"
        className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-card bg-primary px-4 text-on-primary transition-colors hover:bg-primary-pressed"
        onClick={() => retry()}
      >
        {t(defaultLocale, "ui.retry")}
      </button>
    </section>
  );
}
