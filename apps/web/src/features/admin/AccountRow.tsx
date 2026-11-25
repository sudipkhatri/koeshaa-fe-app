"use client";

import type { components } from "@keoshaa/api-client";
import type { Locale } from "@keoshaa/i18n";
import Link from "next/link";

import { useMessages } from "@/lib/locale";

import { BodyRow, ColumnCell, StatusPill, type PillTone } from "./DataTable";
import { daysUntil, formatDay, formatPhone } from "./format";

type User = components["schemas"]["UserRead"];
type IdentifierKind = components["schemas"]["IdentifierKind"];

const SIGN_IN_ORDER = ["phone", "email", "username", "google"] as const;
const kindTone: Record<string, PillTone> = { staff: "primary", member: "quiet" };
const statusTone: Record<string, PillTone> = {
  active: "success",
  paused: "reward",
  closing: "danger",
  closed: "quiet",
};

function signIn(user: User, prefer: IdentifierKind | null) {
  const preferred = prefer ? user.identifiers.find((item) => item.kind === prefer) : undefined;
  return (
    preferred ??
    SIGN_IN_ORDER.map((kind) => user.identifiers.find((item) => item.kind === kind)).find(Boolean)
  );
}

export function AccountRow({
  user,
  prefer,
  locale,
}: {
  user: User;
  prefer: IdentifierKind | null;
  locale: Locale;
}) {
  const { translate } = useMessages();
  const identifier = signIn(user, prefer);
  const muted = user.status === "closing" || user.status === "closed";
  const days = user.purge_after ? daysUntil(user.purge_after) : null;
  const knownKind = user.account_kind === "member" || user.account_kind === "staff";
  const knownStatus =
    user.status === "active" ||
    user.status === "paused" ||
    user.status === "closing" ||
    user.status === "closed";
  return (
    <BodyRow>
      <ColumnCell>
        <Link
          href={`/admin/accounts/${user.id}`}
          className={
            muted
              ? "text-admin-soft underline"
              : "font-medium text-primary underline hover:text-primary-pressed"
          }
        >
          {user.name}
        </Link>
      </ColumnCell>
      <ColumnCell muted>
        {identifier ? (
          <span className={identifier.kind === "phone" ? "tabular-nums" : "text-caption"}>
            {identifier.kind === "phone" ? formatPhone(identifier.value) : identifier.value}
          </span>
        ) : (
          translate("admin.unassigned")
        )}
      </ColumnCell>
      <ColumnCell>
        <StatusPill tone={kindTone[user.account_kind] ?? "quiet"}>
          {knownKind ? translate(`admin.userKind.${user.account_kind}`) : user.account_kind}
        </StatusPill>
      </ColumnCell>
      <ColumnCell muted>{translate("admin.unassigned")}</ColumnCell>
      <ColumnCell>
        <StatusPill tone={statusTone[user.status] ?? "quiet"}>
          {user.status === "closing" && days !== null
            ? translate("admin.closingLeft", { days })
            : knownStatus
              ? translate(`admin.userStatus.${user.status}`)
              : user.status}
        </StatusPill>
      </ColumnCell>
      <ColumnCell align="right" muted>
        {formatDay(user.created_at, locale)}
      </ColumnCell>
    </BodyRow>
  );
}
