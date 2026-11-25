"use client";

import type { MessageKey } from "@keoshaa/i18n";
import { NetworkError } from "@keoshaa/core";
import Link from "next/link";
import { useId, useState } from "react";

import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { useAdminUser } from "./account-detail-api";
import { AdminIcon } from "./AdminIcon";
import { AdminButton, ApiNote, ApiTag, FieldLabel } from "./admin-ui";
import {
  isChangeType,
  isReasonCode,
  nameInitials,
  proposedFields,
  requestTone,
  useDecideChangeRequest,
  type ChangeRequest,
} from "./change-requests-api";
import { useGradeLevels, useStreams } from "./curriculum-api";
import { StatusPill } from "./DataTable";
import { formatDay } from "./format";
import { useSubjectDirectory } from "./subjects-api";

const typeLabel: Record<string, MessageKey> = {
  change_class: "admin.requestTypeClass",
  change_stream: "admin.requestTypeStream",
  change_optionals: "admin.requestTypeOptionals",
};

const reasonLabel: Record<string, MessageKey> = {
  wrong_class: "admin.reasonWrongClass",
  wrong_stream: "admin.reasonWrongStream",
  wrong_optionals: "admin.reasonWrongOptionals",
  school_change: "admin.reasonSchoolChange",
  other: "admin.reasonOther",
};

const statusLabel: Record<string, MessageKey> = {
  submitted: "admin.changeWaiting",
  approved: "admin.changeApproved",
  refused: "admin.requestRefused",
};

export function ChangeRequestCard({
  request,
  expanded,
  onOpen,
}: {
  request: ChangeRequest;
  expanded: boolean;
  onOpen: () => void;
}) {
  const { locale, translate } = useMessages();
  const student = useAdminUser(request.student_id);
  const decider = useAdminUser(request.decided_by ?? "", Boolean(request.decided_by));
  const grades = useGradeLevels();
  const streams = useStreams();
  const subjects = useSubjectDirectory();
  const decide = useDecideChangeRequest();
  const noteId = useId();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  const name = student.data?.name?.trim() || "—";
  const waiting = request.status === "submitted";
  const typeKey = isChangeType(request.type) ? typeLabel[request.type] : null;
  const reasonKey = isReasonCode(request.reason_code) ? reasonLabel[request.reason_code] : null;
  const statusKey = statusLabel[request.status];
  const proposed = proposedFields(request.proposed);
  const gradeName = grades.data?.find((grade) => grade.id === proposed.gradeLevelId)?.name;
  const streamName = streams.data?.find((stream) => stream.id === proposed.streamId)?.name;
  const optionalNames = proposed.optionalIds.map(
    (id) => subjects.data?.find((subject) => subject.id === id)?.name ?? id.slice(-8),
  );
  const askingTitle =
    gradeName || streamName
      ? [gradeName, streamName].filter(Boolean).join(" · ")
      : translate("admin.requestAskingFallback");
  const askingBody =
    optionalNames.length > 0
      ? translate("admin.requestOptionalsLine", { subjects: optionalNames.join(", ") })
      : "—";

  async function decideRequest(decision: "approved" | "refused") {
    setError("");
    setOffline(false);
    try {
      await decide.mutateAsync({
        requestId: request.id,
        decision,
        note: note.trim() || null,
      });
      setNote("");
    } catch (failure) {
      setOffline(failure instanceof NetworkError);
      setError(errorMessage(failure, translate, (seconds) => formatRetryTime(seconds, locale)));
    }
  }

  if (!waiting || !expanded) {
    return (
      <article
        className={`overflow-hidden rounded-xl border border-admin-border bg-admin-surface ${waiting ? "" : "opacity-90"}`}
      >
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5">
          <Avatar label={name} muted={!waiting} />
          <span className="min-w-0 grow">
            <h2 className="text-body font-semibold">
              {waiting ? (
                <>
                  <StudentLink id={request.student_id} name={name} />
                  {" · "}
                  {typeKey ? translate(typeKey) : request.type}
                </>
              ) : (
                <>
                  {name}
                  {" · "}
                  {typeKey ? translate(typeKey) : request.type}
                </>
              )}
            </h2>
            <span className="mt-0.5 block text-caption text-admin-soft">
              {waiting ? (
                <>
                  {gradeName ? `${gradeName} · ` : null}
                  {translate("admin.requestAsked", {
                    date: formatDay(request.created_at, locale),
                  })}
                  {" · "}
                  <ApiTag />
                </>
              ) : (
                <>
                  {translate("admin.requestDecidedBy", {
                    status: statusKey ? translate(statusKey) : request.status,
                    who: decider.data?.name ?? "—",
                    date: request.decided_at ? formatDay(request.decided_at, locale) : "—",
                  })}
                  {request.decision_note ? ` · “${request.decision_note}”` : null}
                </>
              )}
            </span>
          </span>
          <StatusPill tone={requestTone(request.status)}>
            {statusKey ? translate(statusKey) : request.status}
          </StatusPill>
          {waiting ? (
            <AdminButton tone="quiet" size="sm" onClick={onOpen}>
              {translate("admin.open")}
            </AdminButton>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-admin-rule px-5 py-3.5">
        <Avatar label={name} />
        <span className="min-w-0 grow">
          <h2 className="text-body font-semibold">
            <StudentLink id={request.student_id} name={name} />
            {" · "}
            {typeKey ? translate(typeKey) : request.type}
          </h2>
          <span className="mt-0.5 block text-caption text-admin-soft">
            {gradeName ? `${gradeName} · ` : null}
            {translate("admin.requestAsked", { date: formatDay(request.created_at, locale) })}
            {" · "}
            <ApiTag />
          </span>
        </span>
        <StatusPill tone="reward">{translate("admin.changeWaiting")}</StatusPill>
      </div>

      <div className="flex flex-wrap gap-5 px-5 py-4.5">
        <div className="min-w-0 grow basis-70">
          <p className="mb-2 text-micro font-semibold tracking-widest text-admin-soft uppercase">
            {translate("admin.now")}
          </p>
          <div className="rounded-xl bg-admin-page px-3.5 py-3.5 text-caption text-admin-soft">
            —
            <div className="mt-2">
              <ApiNote what={translate("admin.requestNowMissing")} />
            </div>
          </div>
        </div>
        <div className="min-w-0 grow basis-70">
          <p className="mb-2 text-micro font-semibold tracking-widest text-admin-soft uppercase">
            {translate("admin.requestAskingFor")}
          </p>
          <div className="rounded-xl bg-success-tint px-3.5 py-3.5 text-caption text-on-success-tint">
            <p className="mb-2 font-semibold">{askingTitle}</p>
            <p>{askingBody}</p>
            {!gradeName && !streamName && proposed.optionalIds.length === 0 ? (
              <div className="mt-2">
                <ApiTag />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-5 pb-4.5">
        <p className="mb-2 text-micro font-semibold tracking-widest text-admin-soft uppercase">
          {translate("admin.requestReason")}
        </p>
        <div className="rounded-xl border border-admin-rule px-3.5 py-3.5">
          {reasonKey ? (
            <p className="mb-1.5">
              <span className="inline-flex rounded-full bg-admin-rule px-2.25 py-0.5 text-tag font-semibold text-admin-soft">
                {translate(reasonKey)}
              </span>
            </p>
          ) : null}
          <p className="text-caption">
            {request.reason_text?.trim() ? `“${request.reason_text.trim()}”` : "—"}
          </p>
        </div>
      </div>

      <div className="px-5 pb-4.5">
        <div className="flex gap-2.75 rounded-xl bg-primary-tint px-4 py-3.5 text-on-primary-tint">
          <AdminIcon name="info" className="mt-0.5 size-4.5 shrink-0" strokeWidth={1.8} />
          <div className="min-w-0 text-caption">
            <p className="mb-1 font-semibold">{translate("admin.requestPoolTitle")}</p>
            <p>{translate("admin.requestPoolBody")}</p>
            <div className="mt-2">
              <ApiTag />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4.5">
        <div className="flex gap-2.75 rounded-xl bg-reward-tint px-4 py-3.5 text-on-reward-tint">
          <AdminIcon name="alert" className="mt-0.5 size-4.5 shrink-0" />
          <div className="min-w-0 text-caption">
            <p className="mb-1 font-semibold">{translate("admin.requestLosesTitle")}</p>
            <p>{translate("admin.requestLosesBody")}</p>
            <div className="mt-2">
              <ApiTag />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-admin-rule bg-admin-page px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={noteId}>{translate("admin.note")}</FieldLabel>
          <textarea
            id={noteId}
            rows={2}
            value={note}
            placeholder={translate("admin.requestNoteHint")}
            onChange={(event) => setNote(event.target.value)}
            className="w-full resize-y rounded-lg border border-admin-border bg-admin-surface px-3 py-2.5 text-admin-ink placeholder:text-admin-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="min-w-0 grow text-caption text-admin-soft">
            {translate("admin.requestNoteOptional")}
          </p>
          <AdminButton
            tone="dangerQuiet"
            disabled={decide.isPending}
            onClick={() => void decideRequest("refused")}
          >
            {translate(offline ? "common.noConnection" : "admin.refuse")}
          </AdminButton>
          <AdminButton
            pending={decide.isPending}
            disabled={decide.isPending}
            onClick={() => void decideRequest("approved")}
          >
            {translate(offline ? "common.noConnection" : "admin.approveTheChange")}
          </AdminButton>
        </div>
        {error ? <p className="text-caption text-admin-danger">{error}</p> : null}
      </div>
    </article>
  );
}

function Avatar({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <span
      className={`inline-flex size-8.5 shrink-0 items-center justify-center rounded-full text-caption font-semibold ${muted ? "bg-admin-rule text-admin-soft" : "bg-primary-tint text-on-primary-tint"}`}
    >
      {nameInitials(label === "—" ? "?" : label)}
    </span>
  );
}

function StudentLink({ id, name }: { id: string; name: string }) {
  if (name === "—") return <span>{name}</span>;
  return (
    <Link
      href={`/admin/accounts/${id}`}
      className="text-primary underline hover:text-primary-pressed"
    >
      {name}
    </Link>
  );
}
