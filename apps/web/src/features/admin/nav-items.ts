import type { MessageKey } from "@keoshaa/i18n";

import type { AdminIconName } from "./AdminIcon";

export type AdminHref =
  | "/admin"
  | "/admin/accounts"
  | "/admin/roles"
  | "/admin/curriculum"
  | "/admin/content"
  | "/admin/releases"
  | "/admin/change-requests"
  | "/admin/school-leads"
  | "/admin/organisations"
  | "/admin/settings"
  | "/admin/webhooks"
  | "/admin/deliveries"
  | "/admin/site-pages";

export interface NavItem {
  href: AdminHref;
  label: MessageKey;
  icon: AdminIconName;
}

export const OVERVIEW: NavItem = { href: "/admin", label: "admin.overview", icon: "overview" };

export const NAV_GROUPS: readonly { label: MessageKey; items: readonly NavItem[] }[] = [
  {
    label: "admin.groupPeople",
    items: [
      { href: "/admin/accounts", label: "admin.accounts", icon: "accounts" },
      { href: "/admin/roles", label: "admin.roles", icon: "roles" },
    ],
  },
  {
    label: "admin.groupLearning",
    items: [
      { href: "/admin/curriculum", label: "admin.curriculum", icon: "curriculum" },
      { href: "/admin/content", label: "admin.content", icon: "content" },
      { href: "/admin/releases", label: "admin.releases", icon: "releases" },
    ],
  },
  {
    label: "admin.groupStudents",
    items: [{ href: "/admin/change-requests", label: "admin.changeRequests", icon: "requests" }],
  },
  {
    label: "admin.groupSchools",
    items: [
      { href: "/admin/school-leads", label: "admin.leads", icon: "leads" },
      { href: "/admin/organisations", label: "admin.organisations", icon: "schools" },
    ],
  },
  {
    label: "admin.groupSystem",
    items: [
      { href: "/admin/settings", label: "admin.settings", icon: "settings" },
      { href: "/admin/webhooks", label: "admin.webhooks", icon: "webhooks" },
      { href: "/admin/deliveries", label: "admin.deliveries", icon: "deliveries" },
      { href: "/admin/site-pages", label: "admin.sitePages", icon: "sitePages" },
    ],
  },
];

export function isCurrent(pathname: string, href: AdminHref): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
