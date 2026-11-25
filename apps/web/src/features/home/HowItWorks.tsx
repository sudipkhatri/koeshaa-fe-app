"use client";

import { PageContainer } from "@/components/ui/PageContainer";
import { useMessages } from "@/lib/locale";

const steps = ["landing.step1Title", "landing.step2Title", "landing.step3Title"] as const;
const bodies = ["landing.step1Body", "landing.step2Body", "landing.step3Body"] as const;

export function HowItWorks() {
  const { translate } = useMessages();
  return (
    <section id="how" className="scroll-mt-28 bg-canvas">
      <PageContainer className="py-14 lg:py-20">
        <div className="mb-10 max-w-xl">
          <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">
            {translate("landing.howEyebrow")}
          </p>
          <h2 className="mb-4 text-3xl font-bold text-text sm:text-4xl">
            {translate("landing.howTitle")}
          </h2>
          <p className="text-ink-soft">{translate("landing.howBody")}</p>
        </div>
        <ol className="grid gap-5 md:grid-cols-3">
          {steps.map((title, index) => (
            <li key={title} className="rounded-2xl border border-line bg-mist p-7">
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary font-bold text-on-primary">
                {index + 1}
              </span>
              <h3 className="mb-2 text-xl font-bold">{translate(title)}</h3>
              <p className="text-ink-soft">{translate(bodies[index] ?? title)}</p>
            </li>
          ))}
        </ol>
      </PageContainer>
    </section>
  );
}
