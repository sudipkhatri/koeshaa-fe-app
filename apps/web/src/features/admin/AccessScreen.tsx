"use client";

import type { components } from "@keoshaa/api-client";

import { useMessages } from "@/lib/locale";

import { useAdminUser } from "./account-detail-api";
import { AccessGrants } from "./AccessGrants";
import { AccessRoles } from "./AccessRoles";
import { AdminPage } from "./AdminPage";
import { StatusPill, type PillTone } from "./DataTable";
import { useOrganisation } from "./organisations-api";
import { QueryGate } from "./QueryGate";
import { useUserAccess } from "./rbac-api";

type User = components["schemas"]["UserRead"];

const statusTone: Record<User["status"], PillTone> = {
  active: "success",
  paused: "reward",
  closing: "danger",
  closed: "quiet",
};

const knownStatus = ["active", "paused", "closing", "closed"] as const;

function isKnownStatus(status: string): status is User["status"] {
  return (knownStatus as readonly string[]).includes(status);
}

export function AccessHomeScreen() {
  const { translate } = useMessages();
  return (
    <AdminPage title={translate("admin.access")}>
      <p className="text-caption text-admin-soft">{translate("admin.accessFromAccount")}</p>
    </AdminPage>
  );
}

export function AccessScreen({ userId }: { userId: string }) {
  const { translate } = useMessages();
  const user = useAdminUser(userId);
  const access = useUserAccess(userId);
  const account = user.data;
  const record = access.data;
  const status = record && isKnownStatus(record.status) ? record.status : null;

  return (
    <AdminPage
      title={translate("admin.access")}
      back={{
        href: `/admin/accounts/${userId}`,
        label: account?.name ?? translate("admin.accounts"),
      }}
      badge={
        account && record ? (
          <>
            <StatusPill tone={account.account_kind === "staff" ? "primary" : "quiet"}>
              {translate(`admin.userKind.${account.account_kind}`)}
            </StatusPill>
            <StatusPill tone={status ? statusTone[status] : "quiet"}>
              {status ? translate(`admin.userStatus.${status}`) : record.status}
            </StatusPill>
          </>
        ) : null
      }
      gap="gap-5"
    >
      <QueryGate
        query={user}
        isEmpty={false}
        emptyTitle="admin.emptyAccounts"
        emptyMessage="admin.emptyAccountsBody"
      >
        <QueryGate
          query={access}
          isEmpty={false}
          emptyTitle="admin.emptyRolesHeld"
          emptyMessage="admin.emptyRolesHeldBody"
        >
          {record ? (
            <div className="flex flex-wrap items-start gap-5">
              <div className="flex min-w-0 grow basis-110 flex-col gap-5">
                <AccessRoles userId={userId} assignments={record.roles} />
                <AccessGrants userId={userId} grants={record.direct_permissions} />
                <p className="text-caption text-admin-soft">
                  {translate("admin.permissionNamesNote")}
                </p>
              </div>
              <EffectiveAccess
                platform={record.effective_platform}
                byOrganisation={record.effective_by_organisation}
              />
            </div>
          ) : null}
        </QueryGate>
      </QueryGate>
    </AdminPage>
  );
}

function EffectiveAccess({
  platform,
  byOrganisation,
}: {
  platform: string[];
  byOrganisation: { [key: string]: string[] };
}) {
  const { translate } = useMessages();
  const schools = Object.entries(byOrganisation);
  const empty = platform.length === 0 && schools.length === 0;
  return (
    <section
      aria-label={translate("admin.whatTheyCanDo")}
      className="flex w-full min-w-0 flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-5 sm:w-75"
    >
      <div>
        <h2 className="text-body font-semibold">{translate("admin.whatTheyCanDo")}</h2>
        <p className="text-caption text-admin-soft">{translate("admin.whatTheyCanDoHint")}</p>
      </div>
      {empty ? (
        <p className="text-caption text-admin-soft">{translate("admin.emptyEffective")}</p>
      ) : null}
      {platform.length > 0 ? (
        <PermissionGroup title={translate("admin.everywhere")} names={platform} />
      ) : null}
      {schools.map(([id, names]) => (
        <SchoolGroup key={id} id={id} names={names} />
      ))}
    </section>
  );
}

function SchoolGroup({ id, names }: { id: string; names: string[] }) {
  const org = useOrganisation(id, true);
  return <PermissionGroup title={org.data?.name ?? id} names={names} />;
}

function PermissionGroup({ title, names }: { title: string; names: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-caption font-semibold">{title}</h3>
      <ul className="flex flex-wrap gap-1.5">
        {names.map((name) => (
          <li
            key={name}
            className="rounded-full bg-admin-rule px-2.5 py-0.75 text-caption text-admin-ink"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
