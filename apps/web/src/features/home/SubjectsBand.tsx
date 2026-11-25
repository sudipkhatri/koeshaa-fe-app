"use client";

import type { MessageKey } from "@keoshaa/i18n";

import { PageContainer } from "@/components/ui/PageContainer";
import { useMessages } from "@/lib/locale";

import { Check } from "./Check";

const points = [
  ["landing.offlineTitle", "landing.offlineBody"],
  ["landing.dataTitle", "landing.dataBody"],
  ["landing.languagesTitle", "landing.languagesBody"],
] as const satisfies ReadonlyArray<readonly [MessageKey, MessageKey]>;

const subjects = [
  ["landing.subjectMaths", "landing.rangeNursery"],
  ["landing.subjectScience", "landing.rangeScience"],
  ["landing.subjectEnglish", "landing.rangeNursery"],
  ["landing.subjectNepali", "landing.rangeNursery"],
  ["landing.subjectSocial", "landing.rangeSocial"],
] as const satisfies ReadonlyArray<readonly [MessageKey, MessageKey]>;

export function SubjectsBand() {
  const { translate } = useMessages();
  return (
    <section id="subjects" className="scroll-mt-28 border-y border-line bg-mist">
      <PageContainer className="flex flex-wrap items-center gap-8 py-14 sm:gap-12 lg:py-20">
        <div className="min-w-0 flex-1 basis-96">
          <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">
            {translate("landing.subjectsEyebrow")}
          </p>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            {translate("landing.subjectsTitle")}
          </h2>
          <p className="mb-6 text-ink-soft">{translate("landing.subjectsBody")}</p>
          <ul className="flex flex-col gap-3">
            {points.map(([title, body]) => (
              <li key={title} className="flex gap-3 text-text">
                <Check />
                <span>
                  <strong>{translate(title)}</strong> {translate(body)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <ul className="grid min-w-0 flex-1 basis-80 grid-cols-2 gap-3">
          {subjects.map(([name, range]) => (
            <li key={name} className="rounded-2xl border border-line bg-canvas p-5">
              <p className="font-bold">{translate(name)}</p>
              <p className="text-sm text-text-muted">{translate(range)}</p>
            </li>
          ))}
          <li className="rounded-2xl bg-text p-5 text-on-primary">
            <p className="font-bold">{translate("landing.subjectHealth")}</p>
            <p className="text-sm text-footer-text">{translate("landing.healthNote")}</p>
          </li>
        </ul>
      </PageContainer>
    </section>
  );
}
