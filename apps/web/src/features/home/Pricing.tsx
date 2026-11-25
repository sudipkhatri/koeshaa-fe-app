"use client";

import type { MessageKey } from "@keoshaa/i18n";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageContainer } from "@/components/ui/PageContainer";
import { useMessages } from "@/lib/locale";

import { Check } from "./Check";

const freePoints = ["landing.free1", "landing.free2", "landing.free3"] as const;
const yearPoints = ["landing.year1", "landing.year2", "landing.year3", "landing.year4"] as const;

function Points({ keys, onDark = false }: { keys: readonly MessageKey[]; onDark?: boolean }) {
  const { translate } = useMessages();
  return (
    <ul className="mb-6 flex flex-1 flex-col gap-3">
      {keys.map((key) => (
        <li key={key} className="flex gap-2">
          <Check className={onDark ? "text-reward" : "text-primary"} />
          <span>{translate(key)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Pricing() {
  const { translate } = useMessages();
  return (
    <section className="border-t border-line bg-mist">
      <PageContainer className="py-14 lg:py-20">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">
            {translate("landing.priceEyebrow")}
          </p>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{translate("landing.priceTitle")}</h2>
          <p className="text-ink-soft">{translate("landing.priceBody")}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-5">
          <article className="flex w-full max-w-sm flex-col rounded-2xl border border-line bg-canvas p-8">
            <p className="font-semibold text-text-muted">{translate("landing.freeName")}</p>
            <p className="mb-5 text-4xl font-extrabold">{translate("landing.freePrice")}</p>
            <Points keys={freePoints} />
            <ButtonLink href="/#get" tone="quiet" className="w-full">
              {translate("landing.getApp")}
            </ButtonLink>
          </article>
          <article className="flex w-full max-w-sm flex-col rounded-2xl bg-text p-8 text-on-primary shadow-card">
            <div className="mb-1 flex items-center gap-2">
              <p className="font-semibold text-footer-text">{translate("landing.yearName")}</p>
              <span className="rounded-full bg-reward px-2 py-0.5 text-xs font-bold text-on-reward">
                {translate("landing.mostPicked")}
              </span>
            </div>
            <p className="text-4xl font-extrabold">{translate("landing.yearPrice")}</p>
            <p className="mb-5 text-sm text-reward">{translate("landing.yearNote")}</p>
            <Points keys={yearPoints} onDark />
            <ButtonLink href="/#get" tone="quiet" className="w-full">
              {translate("landing.startFree")}
            </ButtonLink>
          </article>
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-sm text-text-muted">
          {translate("landing.priceFoot")}
        </p>
      </PageContainer>
    </section>
  );
}
