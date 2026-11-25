"use client";

import type { components } from "@keoshaa/api-client";
import { useMemo, useState } from "react";

import { ChoiceField } from "@/components/ui/TextField";
import { useMessages } from "@/lib/locale";

import { AdminButton, ApiNote, ApiTag } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import {
  BodyRow,
  ColumnCell,
  ColumnHead,
  DataTable,
  HeadRow,
  StatusPill,
  type PillTone,
} from "./DataTable";
import { useDeliveriesPage } from "./deliveries-api";
import { formatTime } from "./format";
import { QueryGate } from "./QueryGate";
import { TablePager, type RowChoice } from "./TablePager";

type Delivery = components["schemas"]["DeliveryRead"];
type DeliveryStatus = components["schemas"]["DeliveryStatus"];
type Channel = components["schemas"]["Channel"];
type SortColumn = "kind" | "channel" | "status" | "attempts" | "when";
type Direction = "ascending" | "descending";

const STATUSES: readonly DeliveryStatus[] = [
  "pending",
  "sending",
  "retry",
  "sent",
  "failed",
  "skipped",
];
const CHANNELS: readonly Channel[] = ["in_app", "email", "sms", "webhook"];

const statusTone: Record<string, PillTone> = {
  failed: "danger",
  sent: "success",
  retry: "reward",
  sending: "primary",
  pending: "quiet",
  skipped: "quiet",
};

const channelTone: Record<string, PillTone> = {
  email: "sky",
  webhook: "primary",
  sms: "quiet",
  in_app: "quiet",
};

function knownStatus(status: string): status is DeliveryStatus {
  return STATUSES.some((item) => item === status);
}

function knownChannel(channel: string): channel is Channel {
  return CHANNELS.some((item) => item === channel);
}

function ordered(
  deliveries: readonly Delivery[],
  column: SortColumn,
  direction: Direction,
): Delivery[] {
  const sorted = [...deliveries].sort((left, right) => {
    if (column === "attempts") return left.attempts - right.attempts;
    const value = (delivery: Delivery) =>
      column === "when" ? delivery.updated_at : delivery[column];
    return value(left).localeCompare(value(right));
  });
  return direction === "descending" ? sorted.reverse() : sorted;
}

export function DeliveriesScreen() {
  const { locale, translate } = useMessages();
  const [status, setStatus] = useState<DeliveryStatus | "">("");
  const [channel, setChannel] = useState<Channel | "">("");
  const [rows, setRows] = useState<RowChoice>(20);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [sort, setSort] = useState<{ column: SortColumn; direction: Direction }>({
    column: "when",
    direction: "descending",
  });
  const cursor = cursors[cursors.length - 1] ?? null;
  const page = useDeliveriesPage(
    status === "" ? null : status,
    channel === "" ? null : channel,
    rows,
    cursor,
  );
  const deliveries = page.data?.items;
  const nextCursor = page.data?.nextCursor ?? null;
  const shown = useMemo(
    () => ordered(deliveries ?? [], sort.column, sort.direction),
    [deliveries, sort],
  );
  const restart = () => setCursors([null]);

  function toggleSort(column: SortColumn) {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === "ascending" ? "descending" : "ascending" }
        : { column, direction: column === "when" ? "descending" : "ascending" },
    );
  }

  function directionFor(column: SortColumn): Direction | "none" {
    return sort.column === column ? sort.direction : "none";
  }

  return (
    <AdminPage title={translate("admin.deliveries")} gap="gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={translate("admin.deliveryStatus.sent")} />
        <Stat label={translate("admin.deliveryStatus.pending")} />
        <Stat label={translate("admin.retrying")} tone="text-on-reward-tint" />
        <Stat label={translate("admin.deliveryStatus.failed")} tone="text-admin-danger" />
      </div>
      <ApiNote what={translate("admin.deliveryCountsWhat")} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-50">
          <ChoiceField
            label={translate("admin.status")}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as DeliveryStatus | "");
              restart();
            }}
          >
            <option value="">{translate("admin.allStatuses")}</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {translate(`admin.deliveryStatus.${item}`)}
              </option>
            ))}
          </ChoiceField>
        </div>
        <div className="w-full sm:w-50">
          <ChoiceField
            label={translate("admin.channel")}
            value={channel}
            onChange={(event) => {
              setChannel(event.target.value as Channel | "");
              restart();
            }}
          >
            <option value="">{translate("admin.allChannels")}</option>
            {CHANNELS.map((item) => (
              <option key={item} value={item}>
                {translate(`admin.deliveryChannel.${item}`)}
              </option>
            ))}
          </ChoiceField>
        </div>
        <AdminButton tone="quiet" size="lg" disabled>
          {translate("admin.exportCsv")}
        </AdminButton>
        <ApiTag />
      </div>
      <QueryGate
        query={page}
        isEmpty={shown.length === 0 && cursors.length === 1}
        emptyTitle="admin.emptyDeliveries"
        emptyMessage="admin.emptyDeliveriesBody"
      >
        <DataTable
          minWidth="min-w-260"
          footer={
            <TablePager
              shown={shown.length}
              rows={rows}
              onRows={(next) => {
                setRows(next);
                restart();
              }}
              hasPrevious={cursors.length > 1}
              hasNext={nextCursor !== null}
              pending={page.isFetching}
              onPrevious={() => setCursors((stack) => stack.slice(0, -1))}
              onNext={() => setCursors((stack) => [...stack, nextCursor])}
            />
          }
        >
          <HeadRow>
            <ColumnHead sort={directionFor("kind")} onSort={() => toggleSort("kind")}>
              {translate("admin.kind")}
            </ColumnHead>
            <ColumnHead sort={directionFor("channel")} onSort={() => toggleSort("channel")}>
              {translate("admin.channel")}
            </ColumnHead>
            <ColumnHead>{translate("admin.address")}</ColumnHead>
            <ColumnHead sort={directionFor("status")} onSort={() => toggleSort("status")}>
              {translate("admin.status")}
            </ColumnHead>
            <ColumnHead
              align="right"
              sort={directionFor("attempts")}
              onSort={() => toggleSort("attempts")}
            >
              {translate("admin.tries")}
            </ColumnHead>
            <ColumnHead>{translate("admin.lastError")}</ColumnHead>
            <ColumnHead align="right" sort={directionFor("when")} onSort={() => toggleSort("when")}>
              {translate("admin.changedAt")}
            </ColumnHead>
          </HeadRow>
          <tbody>
            {shown.map((delivery) => (
              <BodyRow key={delivery.id}>
                <ColumnCell>
                  <span className="text-caption">{delivery.kind}</span>
                </ColumnCell>
                <ColumnCell>
                  <StatusPill tone={channelTone[delivery.channel] ?? "quiet"}>
                    {knownChannel(delivery.channel)
                      ? translate(`admin.deliveryChannel.${delivery.channel}`)
                      : delivery.channel}
                  </StatusPill>
                </ColumnCell>
                <ColumnCell muted>
                  <span className="tabular-nums">
                    {delivery.address ?? translate("admin.unassigned")}
                  </span>
                </ColumnCell>
                <ColumnCell>
                  <StatusPill tone={statusTone[delivery.status] ?? "quiet"}>
                    {knownStatus(delivery.status)
                      ? translate(`admin.deliveryStatus.${delivery.status}`)
                      : delivery.status}
                  </StatusPill>
                </ColumnCell>
                <ColumnCell align="right">{delivery.attempts}</ColumnCell>
                <ColumnCell muted={delivery.status !== "failed"}>
                  <span
                    className={
                      delivery.status === "failed"
                        ? "text-caption text-admin-danger"
                        : "text-caption"
                    }
                  >
                    {delivery.last_error ?? translate("admin.unassigned")}
                  </span>
                </ColumnCell>
                <ColumnCell align="right" muted>
                  {formatTime(delivery.updated_at, locale)}
                </ColumnCell>
              </BodyRow>
            ))}
          </tbody>
        </DataTable>
      </QueryGate>
      <p className="text-caption text-admin-soft">{translate("admin.deliveryMaskNote")}</p>
    </AdminPage>
  );
}

function Stat({ label, tone = "text-admin-ink" }: { label: string; tone?: string }) {
  return (
    <article className="flex flex-col gap-0.5 rounded-xl border border-admin-border bg-admin-surface px-4 py-3.5">
      <p className="text-micro font-semibold tracking-wider text-admin-soft uppercase">{label}</p>
      <p className={`text-greeting font-bold tabular-nums ${tone}`}>—</p>
    </article>
  );
}
