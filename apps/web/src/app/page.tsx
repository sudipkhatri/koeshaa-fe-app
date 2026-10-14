import { defaultLocale, t } from "@keoshaa/i18n";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold text-brand">{t(defaultLocale, "app.name")}</h1>
      <p className="text-lg text-text-muted">{t(defaultLocale, "app.tagline")}</p>
    </main>
  );
}
