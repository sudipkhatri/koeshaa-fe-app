"use client";

import type { components } from "@keoshaa/api-client";
import Link from "next/link";
import { useState } from "react";

import { useMessages } from "@/lib/locale";

import { AdminButtonLink, ApiTag, Panel } from "./admin-ui";
import { AdminIcon } from "./AdminIcon";
import { AdminPage } from "./AdminPage";
import { flattenPages, useDeliveries, useSchoolLeads } from "./api";
import { BodyRow, ColumnCell, ColumnHead, DataTable, HeadRow, StatusPill } from "./DataTable";
import { formatWait } from "./format";
import { CountCard } from "./OverviewCards";
import { useOrganisations } from "./organisations-api";
import { QueryGate } from "./QueryGate";

type Lead = components["schemas"]["SchoolLeadRead"];
type Delivery = components["schemas"]["DeliveryRead"];
type Translate = ReturnType<typeof useMessages>["translate"];

const DAY_MS = 24 * 60 * 60 * 1000;

export function AdminHomeScreen() {
  const { translate } = useMessages();
  const leads = useSchoolLeads(null);
  const organisations = useOrganisations(null, "");
  const failedDeliveries = useDeliveries("failed", null);
  const openLeads = flattenPages(leads.data).filter(
    (lead) => lead.status === "new" || lead.status === "contacted",
  );
  const schools = flattenPages(organisations.data);
  const [since] = useState(() => Date.now() - DAY_MS);
  const failedToday = flattenPages(failedDeliveries.data).filter(
    (delivery) => new Date(delivery.created_at).getTime() >= since,
  );
  const count = (rows: readonly { status: string }[], status: string) =>
    rows.filter((row) => row.status === status).length;
  const more = (value: number, hasMore: boolean) =>
    hasMore ? translate("admin.countMore", { count: value }) : String(value);

  return (
    <AdminPage
      title={translate("admin.overview")}
      actions={
        <AdminButtonLink href="/admin/organisations">
          {translate("admin.createSchool")}
        </AdminButtonLink>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CountCard
          label={translate("admin.organisations")}
          query={organisations}
          value={more(schools.length, organisations.hasNextPage)}
          detail={translate("admin.schoolsActiveMix", {
            active: count(schools, "active"),
            suspended: count(schools, "suspended"),
          })}
        />
        <CountCard
          label={translate("admin.seatsHeld")}
          value="—"
          detail={translate("admin.seatsBought")}
        >
          <ApiTag />
        </CountCard>
        <CountCard
          label={translate("admin.openLeads")}
          query={leads}
          value={more(openLeads.length, leads.hasNextPage)}
          detail={translate("admin.leadMix", {
            fresh: count(openLeads, "new"),
            contacted: count(openLeads, "contacted"),
          })}
        />
        <CountCard
          label={translate("admin.failedDeliveriesLabel")}
          query={failedDeliveries}
          value={String(failedToday.length)}
          danger={failedToday.length > 0}
          detail={translate("admin.failedLastDay")}
        />
      </div>
      <div className="flex flex-wrap gap-5">
        <Panel className="grow-2 basis-105">
          <div className="flex items-center gap-3 border-b border-admin-rule px-4.5 py-3.5">
            <h2 className="grow text-body font-semibold">{translate("admin.leadsToCall")}</h2>
            <Link
              className="text-caption font-semibold text-primary underline hover:text-primary-pressed"
              href="/admin/school-leads"
            >
              {translate("admin.allLeads")}
            </Link>
          </div>
          <QueryGate
            query={leads}
            isEmpty={openLeads.length === 0}
            emptyTitle="admin.emptyLeads"
            emptyMessage="admin.emptyLeadsBody"
            inset
          >
            <LeadsToCall leads={openLeads} translate={translate} />
          </QueryGate>
        </Panel>
        <Panel className="flex grow basis-70 flex-col gap-3.5 p-4.5">
          <h2 className="text-body font-semibold">{translate("admin.needsALook")}</h2>
          {failedToday.length > 0 ? (
            <Alert
              href="/admin/deliveries"
              tone="danger"
              title={failedTitle(failedToday.length, translate)}
              detail={failedDetail(failedToday, translate)}
            />
          ) : null}
          <Alert
            href="/admin/organisations"
            tone="reward"
            title={translate("admin.seatLimitTitle")}
          />
          <Alert href="/admin/organisations" tone="sky" title={translate("admin.contractsTitle")} />
        </Panel>
      </div>
    </AdminPage>
  );
}

function LeadsToCall({ leads, translate }: { leads: Lead[]; translate: Translate }) {
  const { locale } = useMessages();
  return (
    <div className="-mb-px">
      <DataTable minWidth="min-w-110" bare>
        <HeadRow>
          <ColumnHead>{translate("admin.school")}</ColumnHead>
          <ColumnHead>{translate("admin.status")}</ColumnHead>
          <ColumnHead align="right">{translate("admin.waiting")}</ColumnHead>
        </HeadRow>
        <tbody>
          {leads.map((lead) => (
            <BodyRow key={lead.id}>
              <ColumnCell compact>
                <Link
                  className="font-medium text-primary underline hover:text-primary-pressed"
                  href={`/admin/school-leads/${lead.id}`}
                >
                  {lead.school_name}
                </Link>
                <span className="block text-caption text-admin-soft">{lead.contact_name}</span>
              </ColumnCell>
              <ColumnCell compact>
                <StatusPill tone={lead.status === "contacted" ? "sky" : "primary"}>
                  {translate(`admin.leadStatus.${lead.status}`)}
                </StatusPill>
              </ColumnCell>
              <ColumnCell compact align="right" muted>
                {formatWait(lead.created_at, locale)}
              </ColumnCell>
            </BodyRow>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

const alertTone = {
  danger: "bg-danger-tint text-on-danger-tint",
  reward: "bg-reward-tint text-on-reward-tint",
  sky: "bg-sky-tint text-on-sky-tint",
} as const;

function Alert({
  href,
  tone,
  title,
  detail,
}: {
  href: string;
  tone: keyof typeof alertTone;
  title: string;
  detail?: string;
}) {
  return (
    <Link href={href} className={`flex gap-2.75 rounded-square p-3 ${alertTone[tone]}`}>
      <span className="mt-px">
        <AdminIcon name={tone === "sky" ? "info" : "alert"} />
      </span>
      <span className="flex min-w-0 flex-col items-start gap-1">
        <span className="font-semibold">{title}</span>
        {detail ? <span className="text-caption">{detail}</span> : <ApiTag />}
      </span>
    </Link>
  );
}

function failedTitle(count: number, translate: Translate): string {
  if (count === 1) return translate("admin.failedDelivery");
  return translate("admin.failedDeliveries", { count: String(count) });
}

function failedDetail(rows: Delivery[], translate: Translate): string {
  const channels = [...new Set(rows.map((row) => row.channel))]
    .map((channel) => deliveryChannel(channel, translate))
    .join(", ");
  const attempts = Math.max(...rows.map((row) => row.attempts));
  return translate("admin.failedDeliveriesDetail", { channels, attempts });
}

function deliveryChannel(channel: string, translate: Translate): string {
  if (channel === "in_app" || channel === "email" || channel === "sms" || channel === "webhook") {
    return translate(`admin.deliveryChannel.${channel}`);
  }
  return channel;
}
