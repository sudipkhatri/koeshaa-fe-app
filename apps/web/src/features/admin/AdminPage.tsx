"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { LocaleSwitch } from "@/components/ui/LocaleSwitch";
import { useMessages } from "@/lib/locale";

import { useAdminShell } from "./admin-shell";
import { AdminIcon } from "./AdminIcon";

/** One admin page: the white title bar from the boards, then the content column. */
export function AdminPage({
  title,
  back,
  leading,
  subtitle,
  badge,
  actions,
  tabs,
  gap = "gap-6",
  children,
}: {
  title: ReactNode;
  back?: { href: string; label: string };
  leading?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  gap?: "gap-4" | "gap-5" | "gap-6";
  children: ReactNode;
}) {
  const { translate } = useMessages();
  const { menuOpen, toggleMenu } = useAdminShell();
  return (
    <>
      <header
        className={`sticky top-0 z-10 flex flex-col gap-2.5 border-b border-admin-border bg-admin-surface px-4 sm:px-7 ${tabs ? "pb-0" : "pb-4"} ${back ? "pt-3.5" : "pt-4"}`}
      >
        {back ? (
          <Link
            href={back.href}
            className="inline-flex items-center gap-1.5 self-start text-caption font-semibold text-primary hover:text-primary-pressed"
          >
            <AdminIcon name="chevronLeft" className="size-3.75" strokeWidth={1.8} />
            {back.label}
          </Link>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-12 cursor-pointer items-center rounded-lg px-3 font-semibold md:hidden"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
            onClick={toggleMenu}
          >
            {translate(menuOpen ? "landing.closeMenu" : "landing.openMenu")}
          </button>
          {leading || subtitle ? (
            <div className="flex min-w-0 grow items-center gap-3">
              {leading}
              <div className="min-w-0">
                <h1 className="text-heading font-semibold">{title}</h1>
                {subtitle ? <div className="text-caption text-admin-soft">{subtitle}</div> : null}
              </div>
            </div>
          ) : (
            <h1 className="min-w-0 grow text-heading font-semibold">{title}</h1>
          )}
          {badge}
          <LocaleSwitch variant="admin" />
          {actions}
        </div>
        {tabs}
      </header>
      <main className="px-4 pt-6 pb-10 sm:px-7">
        <div className={`flex max-w-295 flex-col ${gap}`}>{children}</div>
      </main>
    </>
  );
}
