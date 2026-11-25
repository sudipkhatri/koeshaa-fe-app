"use client";

import type { components } from "@keoshaa/api-client";
import type { MessageKey } from "@keoshaa/i18n";
import { useMemo, useState } from "react";

import { useMessages } from "@/lib/locale";

import { AdminButton } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { flattenPages, useDeleteWebhook, useUpdateWebhook, useWebhooks } from "./api";
import {
  BodyRow,
  ColumnCell,
  ColumnHead,
  DataTable,
  HeadRow,
  StatusPill,
  type PillTone,
} from "./DataTable";
import { LoadMore, QueryGate } from "./QueryGate";
import { ADD_WEBHOOK_ID, AddWebhook, SigningSecret } from "./WebhookForm";

type Webhook = components["schemas"]["WebhookRead"];
type SortColumn = "name" | "format" | "state";
type Direction = "ascending" | "descending";

const formatTone: Record<string, PillTone> = {
  slack: "sky",
  teams: "primary",
  generic: "quiet",
};

function formatKey(format: string): MessageKey | null {
  if (format === "generic" || format === "slack" || format === "teams") {
    return `admin.webhookFormat.${format}`;
  }
  return null;
}

function shownUrl(url: string): string {
  try {
    return `${new URL(url).host}/•••`;
  } catch {
    return url;
  }
}

function ordered(
  webhooks: readonly Webhook[],
  column: SortColumn,
  direction: Direction,
): Webhook[] {
  const sorted = [...webhooks].sort((left, right) => {
    const value = (webhook: Webhook) =>
      column === "state" ? (webhook.active ? "0" : "1") : webhook[column];
    return value(left).localeCompare(value(right));
  });
  return direction === "descending" ? sorted.reverse() : sorted;
}

export function WebhooksScreen() {
  const { translate } = useMessages();
  const webhooks = useWebhooks();
  const [secret, setSecret] = useState<string | null>(null);
  const [sort, setSort] = useState<{ column: SortColumn; direction: Direction }>({
    column: "name",
    direction: "ascending",
  });
  const rows = useMemo(
    () => ordered(flattenPages(webhooks.data), sort.column, sort.direction),
    [sort, webhooks.data],
  );

  function toggleSort(column: SortColumn) {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === "ascending" ? "descending" : "ascending" }
        : { column, direction: "ascending" },
    );
  }

  return (
    <AdminPage
      title={translate("admin.webhooks")}
      gap="gap-4"
      actions={
        <AdminButton onClick={() => document.getElementById(ADD_WEBHOOK_ID)?.scrollIntoView()}>
          {translate("admin.addWebhook")}
        </AdminButton>
      }
    >
      {secret ? (
        <SigningSecret key={secret} secret={secret} onDone={() => setSecret(null)} />
      ) : null}
      <QueryGate
        query={webhooks}
        isEmpty={rows.length === 0}
        emptyTitle="admin.emptyWebhooks"
        emptyMessage="admin.emptyWebhooksBody"
      >
        <DataTable
          footer={
            <LoadMore
              hasNextPage={webhooks.hasNextPage}
              pending={webhooks.isFetchingNextPage}
              onLoad={() => void webhooks.fetchNextPage()}
            />
          }
        >
          <HeadRow>
            <ColumnHead
              sort={sort.column === "name" ? sort.direction : "none"}
              onSort={() => toggleSort("name")}
            >
              {translate("admin.name")}
            </ColumnHead>
            <ColumnHead>{translate("admin.url")}</ColumnHead>
            <ColumnHead
              sort={sort.column === "format" ? sort.direction : "none"}
              onSort={() => toggleSort("format")}
            >
              {translate("admin.format")}
            </ColumnHead>
            <ColumnHead>{translate("admin.events")}</ColumnHead>
            <ColumnHead
              sort={sort.column === "state" ? sort.direction : "none"}
              onSort={() => toggleSort("state")}
            >
              {translate("admin.state")}
            </ColumnHead>
            <ColumnHead align="right">
              <span className="sr-only">{translate("admin.remove")}</span>
            </ColumnHead>
          </HeadRow>
          <tbody>
            {rows.map((webhook) => (
              <WebhookRow key={webhook.id} webhook={webhook} />
            ))}
          </tbody>
        </DataTable>
      </QueryGate>
      <AddWebhook onCreated={setSecret} />
    </AdminPage>
  );
}

function WebhookRow({ webhook }: { webhook: Webhook }) {
  const { translate } = useMessages();
  const update = useUpdateWebhook();
  const remove = useDeleteWebhook();
  const label = formatKey(webhook.format);
  return (
    <BodyRow>
      <ColumnCell>
        <span className="font-medium">{webhook.name}</span>
      </ColumnCell>
      <ColumnCell muted>
        <span className="text-caption break-all">{shownUrl(webhook.url)}</span>
      </ColumnCell>
      <ColumnCell>
        <StatusPill tone={formatTone[webhook.format] ?? "quiet"}>
          {label ? translate(label) : webhook.format}
        </StatusPill>
      </ColumnCell>
      <ColumnCell muted>{webhook.events.join(", ")}</ColumnCell>
      <ColumnCell>
        <button
          type="button"
          className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={`${translate(webhook.active ? "admin.pause" : "admin.turnOn")} ${webhook.name}`}
          disabled={update.isPending}
          onClick={() => update.mutate({ endpointId: webhook.id, active: !webhook.active })}
        >
          <StatusPill tone={webhook.active ? "success" : "reward"}>
            {translate(webhook.active ? "admin.active" : "admin.inactive")}
          </StatusPill>
        </button>
      </ColumnCell>
      <ColumnCell align="right">
        <AdminButton
          tone="dangerQuiet"
          size="sm"
          pending={remove.isPending}
          onClick={() => remove.mutate(webhook.id)}
        >
          {translate("admin.remove")}
        </AdminButton>
      </ColumnCell>
    </BodyRow>
  );
}
