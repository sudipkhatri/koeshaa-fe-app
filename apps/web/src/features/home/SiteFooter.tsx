"use client";

import type { MessageKey } from "@keoshaa/i18n";
import Link from "next/link";

import { Mark } from "@/components/ui/Mark";
import { PageContainer } from "@/components/ui/PageContainer";
import { useMessages } from "@/lib/locale";

const learnLinks = [
  { href: "/#how", label: "landing.howNav" },
  { href: "/#subjects", label: "landing.subjectsNav" },
  { href: "/#get", label: "landing.getApp" },
  { href: "/#parents", label: "landing.parentsNav" },
] as const satisfies readonly { href: string; label: MessageKey }[];

const schoolLinks = [
  { href: "/schools", label: "landing.talk" },
  { href: "/school", label: "landing.schoolSignIn" },
  { href: "/schools", label: "landing.pricingSchools" },
] as const satisfies readonly { href: string; label: MessageKey }[];

export function SiteFooter() {
  const { translate } = useMessages();
  return (
    <footer className="bg-footer text-footer-text">
      <PageContainer className="flex flex-wrap gap-8 py-12 lg:gap-12 lg:py-14">
        <div className="min-w-0 flex-1 basis-64">
          <Link href="/" className="mb-3 inline-flex items-center gap-2">
            <Mark />
            <span className="text-lg font-bold text-on-primary">{translate("app.name")}</span>
          </Link>
          <p className="mb-4 max-w-xs text-sm">{translate("landing.footerBlurb")}</p>
          <p className="text-sm">{translate("landing.place")}</p>
        </div>
        <FooterColumn label="landing.learn" links={learnLinks} />
        <FooterColumn label="landing.schoolsNav" links={schoolLinks} />
      </PageContainer>
      <div className="border-t border-on-primary/10">
        <PageContainer className="py-5">
          <p className="text-sm">{translate("landing.rights")}</p>
        </PageContainer>
      </div>
    </footer>
  );
}

function FooterColumn({
  label,
  links,
}: {
  label: MessageKey;
  links: readonly { href: string; label: MessageKey }[];
}) {
  const { translate } = useMessages();
  return (
    <nav aria-label={translate(label)} className="min-w-0 flex-1 basis-40">
      <p className="mb-3 text-xs font-semibold tracking-widest text-on-primary uppercase">
        {translate(label)}
      </p>
      <ul className="flex flex-col">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              className="flex min-h-12 cursor-pointer items-center text-sm text-footer-text transition-colors hover:text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-primary"
              href={link.href}
            >
              {translate(link.label)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
