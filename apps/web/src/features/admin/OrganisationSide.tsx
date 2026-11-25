"use client";

import { useMessages } from "@/lib/locale";

import { AdminButton, ApiNote, ApiTag } from "./admin-ui";

export function OrganisationSide() {
  const { translate } = useMessages();
  return (
    <>
      <section
        id="contract"
        className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="grow text-body font-semibold">{translate("admin.contract")}</h2>
          <ApiTag />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-caption text-admin-soft">{translate("admin.seatsHeld")}</span>
            <span className="text-heading font-bold tabular-nums">
              —{" "}
              <span className="text-small font-normal text-admin-soft">
                {translate("admin.seatsOf")}
              </span>
            </span>
          </div>
          <span className="block h-2 overflow-hidden rounded-full bg-admin-rule" />
        </div>
        <ApiNote what={translate("admin.contractWhat")} />
        <dl className="flex flex-col gap-3 border-t border-admin-rule pt-3.5">
          {(
            [
              ["admin.academicYear", "—"],
              ["admin.pricePerSeat", "—"],
              ["admin.invoice", "—"],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-caption text-admin-soft">{translate(label)}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <AdminButton tone="quiet" size="lg" disabled>
          {translate("admin.addSeats")}
        </AdminButton>
      </section>
      <section
        id="students"
        className="flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-surface p-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="grow text-body font-semibold">{translate("admin.students")}</h2>
          <ApiTag />
        </div>
        <p className="text-caption text-admin-soft">{translate("admin.studentsBody")}</p>
        <dl className="flex flex-col gap-2.5">
          {(
            [
              ["admin.listed", "—"],
              ["admin.signedInOnce", "—"],
              ["admin.lastImport", "—"],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-caption text-admin-soft">{translate(label)}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-caption font-semibold text-admin-soft">
          {translate("admin.openSchoolView")}
        </p>
        <ApiNote what={translate("admin.studentsWhat")} />
      </section>
    </>
  );
}
