"use client";

import type { components } from "@keoshaa/api-client";

import { useMessages } from "@/lib/locale";

import { AccountStateBanner } from "./AccountStateBanner";
import { AccountConsents } from "./AccountConsents";
import { AccountDetails } from "./AccountDetails";
import { AccountFamily } from "./AccountFamily";
import { AccountIdentifiers } from "./AccountIdentifiers";
import { AccountSupport } from "./AccountSupport";
import { useAdminUser } from "./account-detail-api";
import { ApiTag } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { initials } from "./nav-counts";
import { QueryGate } from "./QueryGate";
import { StatusPill, type PillTone } from "./DataTable";

type User = components["schemas"]["UserRead"];

const statusTone: Record<User["status"], PillTone> = {
  active: "success",
  paused: "reward",
  closing: "danger",
  closed: "quiet",
};

export function AccountScreen({ userId }: { userId: string }) {
  const { translate } = useMessages();
  const user = useAdminUser(userId);
  const account = user.data;
  const back = { href: "/admin/accounts", label: translate("admin.accounts") };
  const under =
    account?.under_13 === true
      ? translate("admin.answerYes")
      : account?.under_13 === false
        ? translate("admin.answerNo")
        : "—";

  return (
    <AdminPage
      title={account?.name ?? translate("admin.account")}
      back={back}
      leading={
        account ? (
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-caption font-semibold text-admin-on-tint"
          >
            {initials(account.name)}
          </span>
        ) : null
      }
      subtitle={
        account ? (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {translate(`admin.userKind.${account.account_kind}`)}
            <span aria-hidden>·</span>
            <span>—</span>
            <ApiTag />
            <span aria-hidden>·</span>
            {translate("admin.under13", { answer: under })}
          </span>
        ) : null
      }
      badge={
        account ? (
          <>
            <StatusPill tone={account.account_kind === "staff" ? "primary" : "quiet"}>
              {translate(`admin.userKind.${account.account_kind}`)}
            </StatusPill>
            <StatusPill tone={statusTone[account.status]}>
              {translate(`admin.userStatus.${account.status}`)}
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
        {account ? (
          <div className="flex flex-wrap items-start gap-5">
            {account.status === "paused" || account.status === "closing" ? (
              <div className="basis-full">
                <AccountStateBanner status={account.status} purgeAfter={account.purge_after} />
              </div>
            ) : null}
            <div className="flex min-w-0 grow basis-110 flex-col gap-5">
              <AccountDetails user={account} />
              <AccountIdentifiers user={account} />
              <AccountFamily userId={account.id} />
              <AccountConsents userId={account.id} />
            </div>
            <div className="flex w-full min-w-0 flex-col gap-5 sm:w-75">
              <AccountSupport user={account} />
            </div>
          </div>
        ) : null}
      </QueryGate>
    </AdminPage>
  );
}
