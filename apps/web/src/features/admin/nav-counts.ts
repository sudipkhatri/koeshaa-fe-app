"use client";

import { useMessages } from "@/lib/locale";

import { flattenPages, useDeliveries, useSchoolLeads } from "./api";
import type { AdminHref } from "./nav-items";
import { useSubmittedRequestCount } from "./shell-api";

type Translate = ReturnType<typeof useMessages>["translate"];

export type BadgeTone = "primary" | "danger" | "reward";

export interface NavBadge {
  text: string;
  tone: BadgeTone;
}

export function useNavBadges(translate: Translate) {
  const leads = useSchoolLeads(null);
  const failed = useDeliveries("failed", null);
  const requests = useSubmittedRequestCount();
  const openLeads = flattenPages(leads.data).filter(
    (lead) => lead.status === "new" || lead.status === "contacted",
  ).length;
  const badges: Partial<Record<AdminHref, NavBadge>> = {};
  const leadBadge = badgeText(openLeads, leads.hasNextPage, "primary", translate);
  const deliveryBadge = badgeText(
    flattenPages(failed.data).length,
    failed.hasNextPage,
    "danger",
    translate,
  );
  const requestBadge = badgeText(requests.data ?? 0, false, "reward", translate);
  if (leadBadge) badges["/admin/school-leads"] = leadBadge;
  if (deliveryBadge) badges["/admin/deliveries"] = deliveryBadge;
  if (requestBadge) badges["/admin/change-requests"] = requestBadge;
  return (href: AdminHref): NavBadge | undefined => badges[href];
}

function badgeText(
  count: number,
  hasNextPage: boolean,
  tone: BadgeTone,
  translate: Translate,
): NavBadge | undefined {
  if (!count) return undefined;
  return { text: hasNextPage ? translate("admin.countMore", { count }) : String(count), tone };
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join("")
    .toLocaleUpperCase();
}
