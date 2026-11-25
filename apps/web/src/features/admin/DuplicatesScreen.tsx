"use client";

import { useState } from "react";

import { useMessages } from "@/lib/locale";

import { useOpenDuplicateCount } from "./accounts-api";
import { AdminIcon } from "./AdminIcon";
import { AdminPage } from "./AdminPage";
import { DuplicateCard } from "./duplicate-card";
import { useDuplicatesPage } from "./duplicates-api";
import { QueryGate } from "./QueryGate";
import { TablePager, type RowChoice } from "./TablePager";

export function DuplicatesScreen() {
  const { translate } = useMessages();
  const [rows, setRows] = useState<RowChoice>(20);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [openId, setOpenId] = useState<string | null>(null);
  const cursor = cursors[cursors.length - 1] ?? null;
  const page = useDuplicatesPage(rows, cursor);
  const count = useOpenDuplicateCount();
  const items = page.data?.items ?? [];
  const nextCursor = page.data?.nextCursor ?? null;
  const firstId = items[0]?.id ?? null;
  const expandedId = openId && items.some((item) => item.id === openId) ? openId : firstId;
  const badgeCount = count.data;
  const restart = () => {
    setCursors([null]);
    setOpenId(null);
  };

  return (
    <AdminPage
      title={translate("admin.possibleDuplicates")}
      back={{ href: "/admin/accounts", label: translate("admin.accounts") }}
      badge={
        badgeCount && badgeCount.count > 0 ? (
          <span className="rounded-full bg-reward-tint px-2.5 py-0.75 text-tag font-semibold text-on-reward-tint">
            {translate("admin.openDuplicates", {
              count: badgeCount.hasMore
                ? translate("admin.countMore", { count: String(badgeCount.count) })
                : String(badgeCount.count),
            })}
          </span>
        ) : null
      }
    >
      <div className="flex gap-3 rounded-xl bg-primary-tint px-4 py-3.5 text-on-primary-tint">
        <AdminIcon name="info" className="mt-0.5 size-5 shrink-0" />
        <p>
          {translate("admin.duplicatesIntroBefore")}
          <strong className="font-semibold">{translate("admin.samePerson")}</strong>
          {translate("admin.duplicatesIntroAfter")}
        </p>
      </div>

      <QueryGate
        query={page}
        isEmpty={page.isSuccess && items.length === 0 && cursors.length === 1}
        emptyTitle="admin.emptyDuplicates"
        emptyMessage="admin.emptyDuplicatesBody"
      >
        <div className="flex flex-col gap-5">
          {items.map((duplicate) => (
            <DuplicateCard
              key={duplicate.id}
              duplicate={duplicate}
              expanded={duplicate.id === expandedId}
              onReview={() => setOpenId(duplicate.id)}
            />
          ))}
          <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
            <TablePager
              shown={items.length}
              rows={rows}
              pending={page.isFetching}
              hasPrevious={cursors.length > 1}
              hasNext={nextCursor !== null}
              onRows={(next) => {
                setRows(next);
                restart();
              }}
              onPrevious={() => {
                setCursors((stack) => stack.slice(0, -1));
                setOpenId(null);
              }}
              onNext={() => {
                setCursors((stack) => [...stack, nextCursor]);
                setOpenId(null);
              }}
            />
          </div>
        </div>
      </QueryGate>

      <p className="text-caption text-admin-soft">{translate("admin.duplicatesMatchNote")}</p>

      <section className="flex flex-col gap-2 rounded-xl border border-admin-border bg-admin-surface px-5 py-4">
        <h2 className="text-micro font-semibold tracking-widest text-admin-soft uppercase">
          {translate("admin.duplicatesMissingTitle")}
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-4.5 text-caption text-on-reward-tint">
          <li>{translate("admin.duplicatesMissingEnrolment")}</li>
          <li>{translate("admin.duplicatesMissingActive")}</li>
        </ul>
      </section>
    </AdminPage>
  );
}
