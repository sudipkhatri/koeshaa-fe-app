"use client";

import type { ReactNode } from "react";

import { LocaleSwitch } from "@/components/ui/LocaleSwitch";
import { useMessages } from "@/lib/locale";

import { useSchoolShell } from "./SchoolApp";

/** Sticky title bar for a school portal page. */
export function SchoolPage({
  title,
  subtitle,
  badge,
  actions,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { translate } = useMessages();
  const { menuOpen, toggleMenu } = useSchoolShell();
  return (
    <>
      <header className="sticky top-0 z-10 flex flex-col gap-2.5 border-b border-admin-border bg-admin-surface px-4 pt-4 pb-4 sm:px-7">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-12 cursor-pointer items-center rounded-lg px-3 font-semibold md:hidden"
            aria-expanded={menuOpen}
            aria-controls="school-sidebar"
            onClick={toggleMenu}
          >
            {translate(menuOpen ? "landing.closeMenu" : "landing.openMenu")}
          </button>
          {subtitle ? (
            <div className="min-w-0 grow">
              <h1 className="text-heading font-semibold">{title}</h1>
              <div className="text-caption text-admin-soft">{subtitle}</div>
            </div>
          ) : (
            <h1 className="min-w-0 grow text-heading font-semibold">{title}</h1>
          )}
          {badge}
          <LocaleSwitch variant="admin" />
          {actions}
        </div>
      </header>
      <main className="px-4 pt-6 pb-10 sm:px-7">
        <div className="flex max-w-295 flex-col gap-6">{children}</div>
      </main>
    </>
  );
}
