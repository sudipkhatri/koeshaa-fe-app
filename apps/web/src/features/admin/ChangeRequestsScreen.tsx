"use client";

import type { MessageKey } from "@keoshaa/i18n";
import { useState } from "react";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { useMessages } from "@/lib/locale";

import { AdminIcon } from "./AdminIcon";
import { AdminPage } from "./AdminPage";
import { ChangeRequestCard } from "./change-request-card";
import { useChangeRequests, type RequestStatusFilter } from "./change-requests-api";
import { QueryGate } from "./QueryGate";
import { useSubmittedRequestCount } from "./shell-api";
import { TablePager, type RowChoice } from "./TablePager";

const statusLabel: Record<RequestStatusFilter, MessageKey> = {
  submitted: "admin.changeWaiting",
  approved: "admin.changeApproved",
  refused: "admin.requestRefused",
  any: "admin.anyStatus",
};

export function ChangeRequestsScreen() {
  const { translate } = useMessages();
  const [status, setStatus] = useState<RequestStatusFilter>("submitted");
  const [rows, setRows] = useState<RowChoice>(20);
  const [offset, setOffset] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useChangeRequests(status, rows, offset);
  const waiting = useSubmittedRequestCount();
  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const waitingTotal = waiting.data;
  const start = items.length === 0 ? 0 : offset + 1;
  const end = offset + items.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / rows);
  const pageIndex = Math.floor(offset / rows);
  const firstSubmitted = items.find((item) => item.status === "submitted")?.id ?? null;
  const expandedId = openId && items.some((item) => item.id === openId) ? openId : firstSubmitted;

  return (
    <AdminPage
      title={translate("admin.changeRequests")}
      subtitle={translate("admin.requestsSubtitle")}
      badge={
        waitingTotal === undefined ? null : (
          <span className="rounded-full bg-reward-tint px-2.5 py-0.75 text-tag font-semibold text-on-reward-tint">
            {translate("admin.waitingCount", { count: String(waitingTotal) })}
          </span>
        )
      }
    >
      <div className="flex gap-3 rounded-xl bg-primary-tint px-4 py-3.5 text-on-primary-tint">
        <AdminIcon name="info" className="mt-0.5 size-5 shrink-0" />
        <p>{translate("admin.requestsIntro")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3.5 rounded-xl border border-admin-border bg-admin-surface px-4.5 py-3.5">
        <ChoiceField
          label={translate("admin.status")}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as RequestStatusFilter);
            setOffset(0);
            setOpenId(null);
          }}
        >
          {(Object.keys(statusLabel) as RequestStatusFilter[]).map((value) => (
            <option key={value} value={value}>
              {translate(statusLabel[value])}
            </option>
          ))}
        </ChoiceField>
        <p className="mb-2 min-w-0 grow basis-70 text-caption text-admin-soft">
          {translate("admin.requestsFilterNote")}
        </p>
      </div>

      <QueryGate
        query={list}
        isEmpty={list.isSuccess && items.length === 0}
        emptyTitle="admin.emptyRequests"
        emptyMessage="admin.emptyRequestsBody"
      >
        <div className="flex flex-col gap-5">
          {items.map((request) => (
            <ChangeRequestCard
              key={request.id}
              request={request}
              expanded={request.id === expandedId}
              onOpen={() => setOpenId(request.id)}
            />
          ))}
          <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
            <TablePager
              shown={items.length}
              rows={rows}
              pending={list.isFetching}
              hasPrevious={offset > 0}
              hasNext={end < total}
              pageIndex={pageIndex}
              pageCount={pageCount}
              onPage={(page) => {
                setOffset(page * rows);
                setOpenId(null);
              }}
              onRows={(next) => {
                setRows(next);
                setOffset(0);
                setOpenId(null);
              }}
              onPrevious={() => {
                setOffset((current) => Math.max(0, current - rows));
                setOpenId(null);
              }}
              onNext={() => {
                setOffset((current) => current + rows);
                setOpenId(null);
              }}
              summary={
                <p className="text-caption text-admin-soft tabular-nums">
                  {translate("admin.showingRange", {
                    start: String(start),
                    end: String(end),
                    total: String(total),
                  })}
                </p>
              }
            />
          </div>
        </div>
      </QueryGate>

      <section className="flex flex-col gap-2 rounded-xl border border-admin-border bg-admin-surface px-5 py-4">
        <h2 className="text-micro font-semibold tracking-widest text-admin-soft uppercase">
          {translate("admin.requestsMissingTitle")}
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-4.5 text-caption text-on-reward-tint">
          <li>{translate("admin.requestsMissingNow")}</li>
          <li>{translate("admin.requestsMissingNames")}</li>
          <li>{translate("admin.requestsMissingPool")}</li>
          <li>{translate("admin.requestsMissingDecider")}</li>
        </ul>
      </section>
    </AdminPage>
  );
}
