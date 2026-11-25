"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageContainer } from "@/components/ui/PageContainer";
import { useMessages } from "@/lib/locale";

export function GetApp() {
  const { translate } = useMessages();
  return (
    <section id="get" className="scroll-mt-28 bg-background">
      <PageContainer className="py-14 text-center lg:py-20">
        <h2 className="mx-auto mb-4 max-w-xl text-3xl font-bold sm:text-4xl">
          {translate("landing.getTitle")}
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-ink-soft">{translate("landing.getBody")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href="/#get" tone="ink">
            {translate("landing.play")}
          </ButtonLink>
          <ButtonLink href="/#get" tone="quiet">
            {translate("landing.store")}
          </ButtonLink>
        </div>
        <p className="mt-5 text-sm text-ink-soft">{translate("landing.getNote")}</p>
      </PageContainer>
    </section>
  );
}
