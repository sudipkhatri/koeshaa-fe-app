"use client";

import { PageContainer } from "@/components/ui/PageContainer";
import { useMessages } from "@/lib/locale";

import { GetApp } from "./GetApp";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { ParentsBand } from "./ParentsBand";
import { Pricing } from "./Pricing";
import { SchoolsBand } from "./SchoolsBand";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SubjectsBand } from "./SubjectsBand";

const chips = [
  "landing.chipNursery",
  "landing.chipSee",
  "landing.chipNeb",
  "landing.chipStreams",
  "landing.chipLanguages",
] as const;

export function LandingPage() {
  const { translate } = useMessages();
  return (
    <div className="min-h-dvh bg-canvas text-text">
      <SiteHeader />
      <main>
        <Hero />
        <section className="border-b border-line bg-canvas">
          <PageContainer className="flex flex-wrap items-center justify-between gap-4 py-7">
            <p className="text-xs font-semibold tracking-widest text-text-muted uppercase">
              {translate("landing.proof")}
            </p>
            <ul className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <li key={chip} className="rounded-lg bg-mist px-3 py-2 text-sm font-semibold">
                  {translate(chip)}
                </li>
              ))}
            </ul>
          </PageContainer>
        </section>
        <HowItWorks />
        <SubjectsBand />
        <ParentsBand />
        <Pricing />
        <SchoolsBand />
        <GetApp />
      </main>
      <SiteFooter />
    </div>
  );
}
