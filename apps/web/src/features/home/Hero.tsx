"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageContainer } from "@/components/ui/PageContainer";
import { useMessages } from "@/lib/locale";

import { PhonePreview } from "./PhonePreview";

export function Hero() {
  const { translate } = useMessages();
  return (
    <section className="relative overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-32 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 size-96 rounded-full bg-reward/20 blur-3xl"
      />
      <PageContainer className="relative flex flex-wrap items-center gap-8 py-16 sm:gap-12 sm:py-20">
        <div className="flex min-w-0 flex-1 basis-96 flex-col items-start gap-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-canvas/80 py-1 pr-3 pl-1 text-sm font-semibold text-primary-pressed">
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-on-primary">
              {translate("landing.freeBadge")}
            </span>
            {translate("landing.freeChapter")}
          </p>
          <h1 className="text-4xl font-extrabold leading-none tracking-tight text-text sm:text-6xl">
            <span className="block">{translate("landing.heroLine1")}</span>
            <span className="block">{translate("landing.heroLine2")}</span>
          </h1>
          <p className="max-w-xl text-lg text-ink-soft">{translate("landing.heroBody")}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/#get" className="gap-2">
              <PhoneIcon />
              {translate("landing.getAppFree")}
            </ButtonLink>
            <ButtonLink href="/schools" tone="quiet">
              {translate("landing.forSchools")}
            </ButtonLink>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 basis-80 justify-center">
          <PhonePreview />
        </div>
      </PageContainer>
    </section>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="5.5" y="2.5" width="9" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 15.2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
