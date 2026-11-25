"use client";

import type { MessageKey } from "@keoshaa/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { useMessages } from "@/lib/locale";

import { SchoolIcon, type SchoolIconName } from "./SchoolIcons";
import { ApiTag } from "./school-ui";
import { useMe, useMySchools, type MySchool } from "./school-api";

type NavHref = "" | "/students" | "/import" | "/progress" | "/people" | "/details";

const MAIN: readonly { href: NavHref; label: MessageKey; icon: SchoolIconName; count?: boolean }[] =
  [
    { href: "", label: "school.overview", icon: "overview" },
    { href: "/students", label: "school.students", icon: "students", count: true },
    { href: "/import", label: "school.import", icon: "import" },
    { href: "/progress", label: "school.progress", icon: "progress" },
  ];

const SCHOOL: readonly { href: NavHref; label: MessageKey; icon: SchoolIconName }[] = [
  { href: "/people", label: "school.people", icon: "people" },
  { href: "/details", label: "school.details", icon: "details" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

function isCurrent(pathname: string, base: string, href: NavHref): boolean {
  const target = `${base}${href}`;
  if (href === "") return pathname === base || pathname === `${base}/`;
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function SchoolNav({
  organisationId,
  school,
  onSignOut,
  menuOpen,
  onClose,
}: {
  organisationId: string;
  school: MySchool;
  onSignOut: () => void;
  menuOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname() ?? "";
  const { translate } = useMessages();
  const base = `/school/${organisationId}`;
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const link = (item: {
    href: NavHref;
    label: MessageKey;
    icon: SchoolIconName;
    count?: boolean;
  }) => {
    const current = isCurrent(pathname, base, item.href);
    return (
      <Link
        href={`${base}${item.href}`}
        onClick={onClose}
        aria-current={current ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2.25 text-small ${current ? "bg-primary-tint font-semibold text-admin-on-tint" : "text-admin-ink hover:bg-admin-page"}`}
      >
        <SchoolIcon name={item.icon} className={`size-4.5 ${current ? "" : "text-admin-soft"}`} />
        <span className="min-w-0 flex-1 truncate">{translate(item.label)}</span>
        {item.count ? (
          <span className="flex items-center gap-1 text-caption text-admin-soft tabular-nums">
            —
            <ApiTag />
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <nav
      id="school-sidebar"
      aria-label={translate("school.navigation")}
      className={`${menuOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-30 h-dvh w-60 flex-col gap-5.5 border-r border-admin-border bg-admin-surface px-3.5 py-5 text-admin-ink md:flex`}
    >
      <div className="flex items-center gap-2.25 px-2">
        <span
          aria-hidden="true"
          className="flex size-7.5 shrink-0 items-center justify-center rounded-square bg-primary text-body font-bold text-on-primary"
        >
          K
        </span>
        <span className="min-w-0 flex flex-col">
          <span className="truncate text-small font-bold tracking-tight">{school.name}</span>
          <span className="text-tag text-admin-soft">{translate("school.onKeoshaa")}</span>
        </span>
      </div>
      <ul className="flex min-h-0 flex-col gap-0.5 overflow-y-auto">
        {MAIN.map((item) => (
          <li key={item.href || "overview"}>{link(item)}</li>
        ))}
        <li className="mt-3.5 px-2.5 text-tag font-semibold tracking-widest text-admin-faint uppercase">
          {translate("school.thisSchool")}
        </li>
        {SCHOOL.map((item) => (
          <li key={item.href}>{link(item)}</li>
        ))}
      </ul>
      <AccountFooter onSignOut={onSignOut} />
    </nav>
  );
}

function AccountFooter({ onSignOut }: { onSignOut: () => void }) {
  const { translate } = useMessages();
  const me = useMe();
  const name = me.data?.user.name ?? "";
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative mt-auto border-t border-admin-rule pt-4">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-1 text-left hover:bg-admin-page"
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-reward-tint text-caption font-semibold text-on-reward-tint"
        >
          {initials(name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-caption font-semibold">{name}</span>
          <span className="text-micro text-admin-soft">{translate("school.schoolAdmin")}</span>
        </span>
        <span className="sr-only">{translate("school.accountOptions")}</span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute bottom-0 left-full z-40 ml-3 w-52 rounded-xl border border-admin-border bg-admin-surface p-1 shadow-card"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className="flex min-h-12 w-full cursor-pointer items-center rounded-lg px-3 text-left text-small font-semibold md:min-h-9"
          >
            {translate("common.signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Used only to satisfy unused import when organisationId-only routes need membership. */
export function useMembership(organisationId: string): MySchool | null | undefined {
  const mine = useMySchools();
  if (!mine.data) return undefined;
  return mine.data.find((school) => school.organisation_id === organisationId) ?? null;
}
