"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageContainer } from "@/components/ui/PageContainer";
import { useMessages } from "@/lib/locale";

const rows = [
  ["landing.studied", "landing.studiedValue"],
  ["landing.answered", "landing.answeredValue"],
  ["landing.strongest", "landing.strongestValue"],
  ["landing.needsWork", "landing.needsWorkValue"],
] as const;

export function ParentsBand() {
  const { translate } = useMessages();
  return (
    <section id="parents" className="scroll-mt-28 bg-canvas">
      <PageContainer className="flex flex-wrap items-center gap-8 py-14 sm:gap-12 lg:py-20">
        <div className="min-w-0 flex-1 basis-96">
          <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">
            {translate("landing.parentsEyebrow")}
          </p>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            {translate("landing.parentsTitle")}
          </h2>
          <p className="mb-6 text-ink-soft">{translate("landing.parentsBody")}</p>
          <ButtonLink href="/#get" tone="quiet">
            {translate("landing.parentsLink")}
          </ButtonLink>
        </div>
        <div className="min-w-0 flex-1 basis-80 rounded-2xl bg-background p-6">
          <p className="mb-4 text-xs font-semibold tracking-widest text-on-reward uppercase">
            {translate("landing.parentSees")}
          </p>
          <div className="rounded-2xl bg-canvas p-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-on-primary">
                K
              </span>
              <span>
                <span className="block font-bold">{translate("landing.parentName")}</span>
                <span className="block text-sm text-text-muted">
                  {translate("landing.parentClass")}
                </span>
              </span>
            </div>
            <dl className="mt-4 flex flex-col gap-3">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-sm text-ink-soft">{translate(label)}</dt>
                  <dd className="font-bold">{translate(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-4 text-sm text-on-reward">{translate("landing.parentNote")}</p>
        </div>
      </PageContainer>
    </section>
  );
}
