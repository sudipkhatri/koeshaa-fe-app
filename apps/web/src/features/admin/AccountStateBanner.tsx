"use client";

import type { MessageKey } from "@keoshaa/i18n";

import { useMessages } from "@/lib/locale";

import { ApiTag } from "./admin-ui";
import { daysUntil } from "./format";

export function AccountStateBanner({
  status,
  purgeAfter,
}: {
  status: "paused" | "closing";
  purgeAfter: string | null;
}) {
  if (status === "paused") return <PausedBanner />;
  return <ClosingBanner purgeAfter={purgeAfter} />;
}

function PausedBanner() {
  const { translate } = useMessages();
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-reward bg-reward-tint p-5 text-on-reward-tint">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-body font-semibold">{translate("admin.pausedHeading")}</h2>
        <ApiTag />
      </div>
      <p className="text-caption">{translate("admin.pauseReasonMissing")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <StateList
          title={translate("admin.pauseDoes")}
          items={["admin.pauseItem1", "admin.pauseItem2", "admin.pauseItem3"]}
        />
        <StateList
          title={translate("admin.pauseStill")}
          items={["admin.stillItem1", "admin.stillItem2", "admin.stillItem3"]}
        />
      </div>
    </section>
  );
}

function ClosingBanner({ purgeAfter }: { purgeAfter: string | null }) {
  const { translate } = useMessages();
  const days = purgeAfter ? daysUntil(purgeAfter) : null;
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-admin-danger-line bg-danger-tint p-5 text-on-danger-tint">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-body font-semibold">
          {translate("admin.closingLeft", { days: days === null ? "—" : days })}
        </h2>
        {days === null ? <ApiTag /> : null}
      </div>
      <p className="text-caption">{translate("admin.closingLooksGone")}</p>
      <p className="flex flex-wrap items-center gap-2 text-caption">
        {translate("admin.closingRequesterMissing")}
        <ApiTag />
      </p>
      <StateList
        title={translate("admin.closingDay")}
        items={[
          "admin.closingItem1",
          "admin.closingItem2",
          "admin.closingItem3",
          "admin.closingItem4",
        ]}
      />
    </section>
  );
}

function StateList({ title, items }: { title: string; items: MessageKey[] }) {
  const { translate } = useMessages();
  return (
    <div>
      <h3 className="text-caption font-semibold">{title}</h3>
      <ul className="mt-1.5 list-disc pl-5 text-caption">
        {items.map((item) => (
          <li key={item}>{translate(item)}</li>
        ))}
      </ul>
    </div>
  );
}
