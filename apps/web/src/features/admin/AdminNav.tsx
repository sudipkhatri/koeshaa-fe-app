"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect } from "react";

import { useMessages } from "@/lib/locale";

import { AdminAccount } from "./AdminAccount";
import { AdminIcon } from "./AdminIcon";
import { useAdminShell } from "./admin-shell";
import { useNavBadges, type BadgeTone, type NavBadge } from "./nav-counts";
import { isCurrent, NAV_GROUPS, OVERVIEW, type NavItem } from "./nav-items";

const badgeTone: Record<BadgeTone, string> = {
  primary: "bg-primary text-on-primary",
  danger: "bg-danger-tint text-on-danger-tint",
  reward: "bg-reward-tint text-on-reward-tint",
};

export function CurrentAdminNav({
  onClose,
  onSignOut,
}: {
  onClose: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname() ?? "";
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);
  return <AdminNav pathname={pathname} onClose={onClose} onSignOut={onSignOut} />;
}

export function AdminNav({
  pathname,
  onClose,
  onSignOut,
}: {
  pathname: string;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const { translate } = useMessages();
  const { menuOpen, collapsed, toggleCollapsed } = useAdminShell();
  const badges = useNavBadges(translate);
  const rail = collapsed && !menuOpen;
  const width = collapsed ? "w-60 md:w-16" : "w-60";
  const link = (item: NavItem) => (
    <NavLink
      item={item}
      label={translate(item.label)}
      current={isCurrent(pathname, item.href)}
      badge={badges(item.href)}
      rail={rail}
      onNavigate={onClose}
    />
  );
  return (
    <nav
      id="admin-sidebar"
      aria-label={translate("admin.navigation")}
      className={`${menuOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-30 h-dvh ${width} flex-col border-r border-admin-border bg-admin-surface text-admin-ink md:flex ${rail ? "items-center gap-5 px-2 py-5" : "gap-5.5 px-3.5 py-5"}`}
    >
      {rail ? (
        <>
          <Brand compact />
          <button
            type="button"
            aria-label={translate("admin.expandMenu")}
            aria-expanded={false}
            onClick={toggleCollapsed}
            className="hidden h-7 w-8 cursor-pointer items-center justify-center rounded-md border border-admin-border bg-admin-surface text-admin-soft md:flex"
          >
            <AdminIcon name="expand" className="size-3.75" strokeWidth={1.7} />
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2.25 px-2">
          <Brand compact={false} />
          <span className="ml-auto rounded-full bg-primary-tint px-2 py-0.5 text-tag font-semibold text-admin-on-tint">
            {translate("admin.title")}
          </span>
          <button
            type="button"
            aria-label={translate("admin.collapseMenu")}
            aria-expanded={true}
            onClick={toggleCollapsed}
            className="hidden size-6.5 shrink-0 cursor-pointer items-center justify-center rounded-md text-admin-soft hover:bg-admin-page md:flex"
          >
            <AdminIcon name="collapse" className="size-3.75" strokeWidth={1.7} />
          </button>
        </div>
      )}
      <ul
        className={`flex min-h-0 flex-col overflow-y-auto ${rail ? "items-center gap-1" : "-mx-1 gap-0.5 px-1"}`}
      >
        <li>{link(OVERVIEW)}</li>
        {NAV_GROUPS.map((group) => (
          <Fragment key={group.label}>
            {rail ? (
              <li aria-hidden="true" className="my-2 h-px w-6.5 shrink-0 bg-admin-rule" />
            ) : (
              <li className="mt-3.5 mb-1 px-2.5 text-tag font-semibold tracking-widest text-admin-faint uppercase">
                {translate(group.label)}
              </li>
            )}
            {group.items.map((item) => (
              <li key={item.href} className={rail ? "relative" : undefined}>
                {link(item)}
              </li>
            ))}
          </Fragment>
        ))}
      </ul>
      <AdminAccount compact={rail} onSignOut={onSignOut} />
    </nav>
  );
}

function Brand({ compact }: { compact: boolean }) {
  const { translate } = useMessages();
  return (
    <>
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-lg bg-primary text-button font-bold text-on-primary ${compact ? "size-8" : "size-7.5"}`}
      >
        K
      </span>
      <span className={compact ? "sr-only" : "text-body font-bold tracking-tight"}>
        {translate("app.name")}
      </span>
    </>
  );
}

function NavLink({
  item,
  label,
  current,
  badge,
  rail,
  onNavigate,
}: {
  item: NavItem;
  label: string;
  current: boolean;
  badge: NavBadge | undefined;
  rail: boolean;
  onNavigate: () => void;
}) {
  const state = current
    ? "bg-primary-tint font-semibold text-admin-on-tint"
    : `${rail ? "text-admin-soft" : "text-admin-ink"} hover:bg-admin-page`;
  if (rail) {
    return (
      <>
        <Link
          href={item.href}
          title={label}
          aria-label={label}
          aria-current={current ? "page" : undefined}
          onClick={onNavigate}
          className={`flex h-9.5 w-10 items-center justify-center rounded-lg ${state}`}
        >
          <AdminIcon name={item.icon} className="size-4.75" />
        </Link>
        {badge ? (
          <span
            className={`absolute top-0.5 right-px h-3.75 min-w-3.75 rounded-full px-0.75 text-center text-badge leading-3.75 font-bold ${badgeTone[badge.tone]}`}
          >
            {badge.text}
          </span>
        ) : null}
      </>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
      className={`flex min-h-12 items-center gap-2.5 rounded-lg px-2.5 py-2.25 whitespace-nowrap md:min-h-0 ${state}`}
    >
      <span className={current ? "text-admin-on-tint" : "text-admin-soft"}>
        <AdminIcon name={item.icon} />
      </span>
      {label}
      {badge ? (
        <span
          className={`ml-auto rounded-full px-1.75 py-px text-tag font-semibold ${badgeTone[badge.tone]}`}
        >
          {badge.text}
        </span>
      ) : null}
    </Link>
  );
}
