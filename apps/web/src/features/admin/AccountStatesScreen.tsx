"use client";

import { useMessages } from "@/lib/locale";

import { AccountStateBanner } from "./AccountStateBanner";
import { AdminButtonLink } from "./admin-ui";
import { AdminPage } from "./AdminPage";

export function AccountStatesScreen() {
  const { translate } = useMessages();
  return (
    <AdminPage
      title={translate("admin.accountStatesTitle")}
      subtitle={translate("admin.statesIntro")}
      gap="gap-5"
    >
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 grow basis-110 flex-col gap-4">
          <AccountStateBanner status="paused" purgeAfter={null} />
          <AccountStateBanner status="closing" purgeAfter={null} />
        </div>
        <section className="flex w-full min-w-0 flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-5 sm:w-75">
          <h2 className="text-body font-semibold">{translate("admin.rightColumnBecomes")}</h2>
          <AdminButtonLink href="/admin/accounts" tone="primary" size="lg">
            {translate("admin.resumeAccount")}
          </AdminButtonLink>
          <p className="text-caption text-admin-soft">{translate("admin.resumeNote")}</p>
          <AdminButtonLink href="/admin/accounts" tone="primary" size="lg">
            {translate("admin.stopClose")}
          </AdminButtonLink>
          <p className="text-caption text-admin-soft">{translate("admin.statesLive")}</p>
          <p className="text-caption text-admin-soft">{translate("admin.purgeFromDate")}</p>
        </section>
      </div>
    </AdminPage>
  );
}
