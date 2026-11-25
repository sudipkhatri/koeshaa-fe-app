"use client";

import type { components } from "@keoshaa/api-client";
import Link from "next/link";

import { useMessages } from "@/lib/locale";

import { useAdminUser, useEndGuardianship, useGuardianships } from "./account-detail-api";
import { AdminButton } from "./admin-ui";
import { BodyRow, ColumnCell, ColumnHead, DataTable, HeadRow, StatusPill } from "./DataTable";
import { formatDay, formatPhone } from "./format";
import { QueryGate } from "./QueryGate";

type LinkRow = components["schemas"]["GuardianshipRead"];

export function AccountFamily({ userId }: { userId: string }) {
  const { translate } = useMessages();
  const links = useGuardianships(userId);
  const rows = links.data ?? [];

  return (
    <section className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <div className="border-b border-admin-rule px-6 py-4">
        <h2 className="text-body font-semibold">{translate("admin.family")}</h2>
        <p className="text-caption text-admin-soft">{translate("admin.familyNote")}</p>
      </div>
      <QueryGate
        query={links}
        isEmpty={rows.length === 0}
        emptyTitle="admin.emptyFamily"
        emptyMessage="admin.emptyFamilyBody"
        inset
      >
        <DataTable bare minWidth="min-w-160" roomy>
          <HeadRow>
            <ColumnHead>{translate("admin.parent")}</ColumnHead>
            <ColumnHead>{translate("admin.relationship")}</ColumnHead>
            <ColumnHead>{translate("admin.state")}</ColumnHead>
            <ColumnHead align="right">
              <span className="sr-only">{translate("admin.actions")}</span>
            </ColumnHead>
          </HeadRow>
          <tbody>
            {rows.map((row) => (
              <FamilyRow key={row.id} userId={userId} row={row} />
            ))}
          </tbody>
        </DataTable>
      </QueryGate>
    </section>
  );
}

function FamilyRow({ userId, row }: { userId: string; row: LinkRow }) {
  const { locale, translate } = useMessages();
  const end = useEndGuardianship(userId);
  const open = row.state === "active" || row.state === "pending";
  return (
    <BodyRow>
      <ColumnCell>
        {row.parent_id ? (
          <ParentLink id={row.parent_id} />
        ) : (
          <span className="text-admin-soft tabular-nums">
            {row.invited_phone ? formatPhone(row.invited_phone) : "—"}
          </span>
        )}
      </ColumnCell>
      <ColumnCell muted>{translate(`admin.relationshipOption.${row.relationship}`)}</ColumnCell>
      <ColumnCell>
        <StatusPill
          tone={row.state === "active" ? "success" : row.state === "pending" ? "reward" : "quiet"}
        >
          {row.state === "pending" && row.expires_at
            ? translate("admin.pendingExpires", { date: formatDay(row.expires_at, locale) })
            : translate(`admin.guardianshipState.${row.state}`)}
        </StatusPill>
      </ColumnCell>
      <ColumnCell align="right">
        {open ? (
          <AdminButton
            type="button"
            tone="dangerQuiet"
            size="sm"
            pending={end.isPending && end.variables === row.id}
            onClick={() => void end.mutate(row.id)}
          >
            {translate("admin.endLink")}
          </AdminButton>
        ) : null}
      </ColumnCell>
    </BodyRow>
  );
}

function ParentLink({ id }: { id: string }) {
  const parent = useAdminUser(id);
  return (
    <Link
      href={`/admin/accounts/${id}`}
      className="font-medium text-primary underline hover:text-primary-pressed"
    >
      {parent.data?.name ?? id}
    </Link>
  );
}
