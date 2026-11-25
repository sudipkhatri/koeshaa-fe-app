"use client";

import type { MessageKey } from "@keoshaa/i18n";
import { NetworkError } from "@keoshaa/core";
import { useState } from "react";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { useAdminUser } from "./account-detail-api";
import { AdminIcon } from "./AdminIcon";
import { AdminButton, AdminTextInput, ApiNote, ApiTag } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import {
  changeTone,
  proposedLines,
  useChanges,
  useDecideChange,
  type Change,
  type ChangeKindFilter,
  type ChangeStatusFilter,
} from "./content-changes-api";
import { StatusPill } from "./DataTable";
import { formatDay } from "./format";
import { QueryGate } from "./QueryGate";
import { TablePager, type RowChoice } from "./TablePager";

const statusLabel: Record<ChangeStatusFilter, MessageKey> = {
  waiting: "admin.changeWaiting",
  approved: "admin.changeApproved",
  rejected: "admin.changeRejected",
  applied: "admin.changeApplied",
  any: "admin.anyStatus",
};

const kindLabel: Record<ChangeKindFilter, MessageKey> = {
  any: "admin.anyKind",
  chapter: "admin.chapter",
  topic: "admin.topic",
  concept: "admin.concept",
  question: "admin.questionItem",
};

export function ContentChangesScreen() {
  const { translate } = useMessages();
  const [status, setStatus] = useState<ChangeStatusFilter>("waiting");
  const [kind, setKind] = useState<ChangeKindFilter>("any");
  const [rows, setRows] = useState<RowChoice>(20);
  const [offset, setOffset] = useState(0);
  const changes = useChanges(status, kind, rows, offset);
  const waiting = useChanges("waiting", "any", 1, 0);
  const items = changes.data?.items ?? [];
  const total = changes.data?.total ?? 0;
  const waitingTotal = waiting.data?.total;
  const start = items.length === 0 ? 0 : offset + 1;
  const end = offset + items.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / rows);
  const pageIndex = Math.floor(offset / rows);

  return (
    <AdminPage
      title={translate("admin.edits")}
      back={{ href: "/admin/content", label: translate("admin.content") }}
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
        <p>
          {translate("admin.editsIntroBefore")}
          <strong className="font-semibold">{translate("admin.editsIntroApply")}</strong>
          {translate("admin.editsIntroMid")}
          <strong className="font-semibold">{translate("admin.editsIntroHold")}</strong>
          {translate("admin.editsIntroAfter")}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3.5 rounded-xl border border-admin-border bg-admin-surface px-4.5 py-3.5">
        <ChoiceField
          label={translate("admin.status")}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ChangeStatusFilter);
            setOffset(0);
          }}
        >
          {(Object.keys(statusLabel) as ChangeStatusFilter[]).map((value) => (
            <option key={value} value={value}>
              {translate(statusLabel[value])}
            </option>
          ))}
        </ChoiceField>
        <ChoiceField
          label={translate("admin.kindOfItem")}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as ChangeKindFilter);
            setOffset(0);
          }}
        >
          {(Object.keys(kindLabel) as ChangeKindFilter[]).map((value) => (
            <option key={value} value={value}>
              {translate(kindLabel[value])}
            </option>
          ))}
        </ChoiceField>
        <p className="mb-2 min-w-0 grow basis-70 text-caption text-admin-soft">
          {translate("admin.editsFilterNote")}
        </p>
      </div>

      <QueryGate
        query={changes}
        isEmpty={changes.isSuccess && items.length === 0}
        emptyTitle="admin.emptyEdits"
        emptyMessage="admin.emptyEditsBody"
      >
        <div className="flex flex-col gap-5">
          {items.map((change) => (
            <ChangeCard key={change.id} change={change} />
          ))}
          <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
            <TablePager
              shown={items.length}
              rows={rows}
              pending={changes.isFetching}
              hasPrevious={offset > 0}
              hasNext={end < total}
              pageIndex={pageIndex}
              pageCount={pageCount}
              onPage={(page) => setOffset(page * rows)}
              onRows={(next) => {
                setRows(next);
                setOffset(0);
              }}
              onPrevious={() => setOffset((current) => Math.max(0, current - rows))}
              onNext={() => setOffset((current) => current + rows)}
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
          {translate("admin.editsMissingTitle")}
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-4.5 text-caption text-on-reward-tint">
          <li>{translate("admin.editsMissingNow")}</li>
          <li>{translate("admin.editsMissingNames")}</li>
          <li>{translate("admin.editsMissingReject")}</li>
        </ul>
      </section>
    </AdminPage>
  );
}

function ChangeCard({ change }: { change: Change }) {
  const { locale, translate } = useMessages();
  const author = useAdminUser(change.author_id);
  const decide = useDecideChange();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const status = change.status.toLowerCase();
  const waiting = status === "waiting";
  const applied = status === "applied";
  const entity = change.entity_type as ChangeKindFilter;
  const kindName =
    entity in kindLabel && entity !== "any" ? translate(kindLabel[entity]) : change.entity_type;
  const lines = proposedLines(change.proposed);
  const statusKey =
    status === "waiting"
      ? "admin.changeWaiting"
      : status === "approved"
        ? "admin.changeApproved"
        : status === "rejected"
          ? "admin.changeRejected"
          : status === "applied"
            ? "admin.changeApplied"
            : null;

  async function decideChange(decision: "approved" | "rejected") {
    setError("");
    setOffline(false);
    try {
      await decide.mutateAsync({
        changeId: change.id,
        decision,
        notes: decision === "rejected" ? note.trim() || null : null,
      });
      setRejecting(false);
      setNote("");
    } catch (failure) {
      setOffline(failure instanceof NetworkError);
      setError(errorMessage(failure, translate, (seconds) => formatRetryTime(seconds, locale)));
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5">
        <span className="min-w-0 grow">
          <h2 className="text-body font-semibold">
            {`${kindName} · ${change.entity_id.slice(-8)}`}
          </h2>
          <span className="mt-0.75 block text-caption text-admin-soft">
            {`${author.data?.name ?? "—"} · ${formatDay(change.created_at, locale)}`}
          </span>
        </span>
        <StatusPill tone={changeTone(change.status)}>
          {statusKey ? translate(statusKey) : change.status}
        </StatusPill>
        {applied ? (
          <span className="inline-flex items-center gap-2">
            <AdminButton tone="quiet" size="sm" disabled>
              {translate("admin.seeIt")}
            </AdminButton>
            <ApiTag />
          </span>
        ) : null}
      </div>

      {waiting ? (
        <>
          <div className="flex flex-wrap gap-4 px-5 py-4.5">
            <div className="min-w-0 grow basis-70">
              <p className="mb-2 text-micro font-semibold tracking-widest text-admin-soft uppercase">
                {translate("admin.now")}
              </p>
              <div className="rounded-xl bg-admin-page px-3.5 py-3 text-caption text-admin-soft">
                —
                <div className="mt-2">
                  <ApiNote what={translate("admin.nowMissing")} />
                </div>
              </div>
            </div>
            <div className="min-w-0 grow basis-70">
              <p className="mb-2 text-micro font-semibold tracking-widest text-admin-soft uppercase">
                {translate("admin.proposed")}
              </p>
              <div className="rounded-xl bg-success-tint px-3.5 py-3 text-caption text-on-success-tint">
                {lines.length === 0 ? (
                  "—"
                ) : (
                  <ul className="flex flex-col gap-2">
                    {lines.map((line) => (
                      <li key={line.key}>
                        <span className="text-admin-soft">{line.key}: </span>
                        <span className="text-caption">{line.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-admin-rule bg-admin-page px-5 py-3.5">
            <p className="min-w-0 grow text-caption text-admin-soft">
              {translate("admin.approveWrites")}
            </p>
            {rejecting ? (
              <>
                <AdminTextInput
                  label={translate("admin.rejectNote")}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <AdminButton
                  tone="quiet"
                  disabled={decide.isPending}
                  onClick={() => setRejecting(false)}
                >
                  {translate("admin.cancel")}
                </AdminButton>
                <AdminButton
                  tone="danger"
                  pending={decide.isPending}
                  disabled={decide.isPending}
                  onClick={() => void decideChange("rejected")}
                >
                  {translate(offline ? "common.noConnection" : "admin.reject")}
                </AdminButton>
              </>
            ) : (
              <>
                <AdminButton
                  tone="dangerQuiet"
                  disabled={decide.isPending}
                  onClick={() => setRejecting(true)}
                >
                  {translate("admin.reject")}
                </AdminButton>
                <AdminButton
                  pending={decide.isPending}
                  disabled={decide.isPending}
                  onClick={() => void decideChange("approved")}
                >
                  {translate(offline ? "common.noConnection" : "admin.approve")}
                </AdminButton>
              </>
            )}
            {error ? <p className="w-full text-caption text-admin-danger">{error}</p> : null}
          </div>
        </>
      ) : applied ? (
        <div className="border-t border-admin-rule bg-admin-page px-5 py-3">
          <p className="text-caption text-admin-soft">{translate("admin.appliedNote")}</p>
        </div>
      ) : change.notes ? (
        <div className="border-t border-admin-rule bg-admin-page px-5 py-3">
          <p className="text-caption text-admin-soft">{change.notes}</p>
        </div>
      ) : null}
    </article>
  );
}
