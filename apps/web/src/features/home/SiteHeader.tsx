"use client";

import type { MessageKey } from "@keoshaa/i18n";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { LocaleSwitch } from "@/components/ui/LocaleSwitch";
import { Mark } from "@/components/ui/Mark";
import { PageContainer } from "@/components/ui/PageContainer";
import { useMessages } from "@/lib/locale";

const LINKS = [
  { href: "/#how", label: "landing.howNav" },
  { href: "/#subjects", label: "landing.subjectsNav" },
  { href: "/#parents", label: "landing.parentsNav" },
  { href: "/schools", label: "landing.schoolsNav" },
] as const satisfies readonly { href: string; label: MessageKey }[];

const linkClass =
  "inline-flex min-h-12 cursor-pointer items-center text-sm font-medium text-text transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function SiteHeader() {
  const { translate } = useMessages();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur-md">
      <PageContainer className="flex items-center gap-3 py-3">
        <Link href="/" className="mr-auto flex min-h-12 items-center gap-2 text-text">
          <Mark />
          <span className="text-lg font-bold">{translate("app.name")}</span>
        </Link>
        <nav aria-label={translate("landing.nav")} className="hidden items-center gap-x-5 lg:flex">
          <HeaderLinks />
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitch variant="header" />
          <Link className={linkClass} href="/admin">
            {translate("auth.signIn")}
          </Link>
          <ButtonLink href="/#get">{translate("landing.getApp")}</ButtonLink>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ButtonLink href="/#get">{translate("landing.getApp")}</ButtonLink>
          <button
            ref={menuButton}
            type="button"
            className="inline-flex size-12 cursor-pointer items-center justify-center rounded-xl text-text hover:bg-mist"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
            <span className="sr-only">
              {translate(menuOpen ? "landing.closeMenu" : "landing.openMenu")}
            </span>
          </button>
        </div>
      </PageContainer>
      {menuOpen ? (
        <div id={menuId} className="border-t border-line bg-canvas lg:hidden">
          <PageContainer className="flex flex-col gap-2 py-3">
            <nav aria-label={translate("landing.nav")} className="flex flex-col">
              <HeaderLinks stacked onNavigate={closeMenu} />
            </nav>
            <LocaleSwitch variant="header" />
            <Link className={linkClass} href="/admin" onClick={closeMenu}>
              {translate("auth.signIn")}
            </Link>
          </PageContainer>
        </div>
      ) : null}
    </header>
  );
}

function HeaderLinks({
  stacked = false,
  onNavigate,
}: {
  stacked?: boolean;
  onNavigate?: () => void;
}) {
  const { translate } = useMessages();
  const className = stacked ? `${linkClass} w-full` : linkClass;
  return LINKS.map((link) => (
    <Link key={link.href} className={className} href={link.href} onClick={onNavigate}>
      {translate(link.label)}
    </Link>
  ));
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M5 5l10 10M15 5 5 15"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
