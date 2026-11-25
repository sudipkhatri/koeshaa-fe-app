"use client";

import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageContainer } from "@/components/ui/PageContainer";
import { useMessages } from "@/lib/locale";

export function SchoolsBand() {
  const { translate } = useMessages();
  return (
    <section className="bg-text text-on-primary">
      <PageContainer className="py-14 lg:py-20">
        <p className="mb-3 text-xs font-semibold tracking-widest text-reward uppercase">
          {translate("landing.schoolsEyebrow")}
        </p>
        <h2 className="mb-4 max-w-xl text-3xl font-bold sm:text-4xl">
          {translate("landing.schoolsTitle")}
        </h2>
        <p className="mb-6 max-w-xl text-footer-text">{translate("landing.schoolsBody")}</p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/schools" tone="quiet">
            {translate("landing.talk")}
          </ButtonLink>
          <Link
            href="/school"
            className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-card border border-on-primary px-4 font-medium text-on-primary transition-colors hover:bg-on-primary/10"
          >
            {translate("landing.schoolSignIn")}
          </Link>
        </div>
      </PageContainer>
    </section>
  );
}
