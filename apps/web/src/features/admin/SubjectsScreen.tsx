"use client";

import type { components } from "@keoshaa/api-client";
import { useState } from "react";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { useMessages } from "@/lib/locale";

import { AdminIcon } from "./AdminIcon";
import { AdminButton, ApiNote } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { useGradeLevels, useStreams } from "./curriculum-api";
import { ColumnCell, ColumnHead, DataTable, StatusPill } from "./DataTable";
import { formatDay } from "./format";
import { membership, usePublishedPools } from "./pool-api";
import { QueryGate } from "./QueryGate";
import { SubjectForm } from "./SubjectForm";
import { useAvailability, useSubjects } from "./subjects-api";
import { TablePager, type RowChoice } from "./TablePager";

type Grade = components["schemas"]["GradeLevelRead"];
type Stream = components["schemas"]["StreamRead"];
type Subject = components["schemas"]["SubjectRead"];

function preferredGrade(grades: Grade[] | undefined): string {
  if (!grades?.length) return "";
  const streamed = grades.filter((grade) => grade.has_streams);
  const list = [...(streamed.length ? streamed : grades)].sort(
    (left, right) => left.sort_order - right.sort_order,
  );
  return list[0]?.id ?? "";
}

function preferredStream(
  gradeId: string,
  grades: Grade[] | undefined,
  streams: Stream[] | undefined,
) {
  if (gradeId === "all") return "all";
  const grade = grades?.find((item) => item.id === gradeId);
  if (!grade?.has_streams) return "";
  return streams?.[0]?.id ?? "";
}

export function SubjectsScreen() {
  const { locale, translate } = useMessages();
  const grades = useGradeLevels();
  const streams = useStreams();
  const [gradeChoice, setGradeChoice] = useState<string | null>(null);
  const [streamChoice, setStreamChoice] = useState<string | null>(null);
  const [rows, setRows] = useState<RowChoice>(20);
  const [offset, setOffset] = useState(0);
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const gradeId = gradeChoice ?? preferredGrade(grades.data);
  const streamId = streamChoice ?? preferredStream(gradeId, grades.data, streams.data);
  const subjects = useSubjects(gradeId, streamId, rows, offset);
  const availability = useAvailability(gradeId);
  const pools = usePublishedPools(gradeId, streamId);
  const grade = grades.data?.find((item) => item.id === gradeId);
  const showStream = gradeId === "all" || Boolean(grade?.has_streams);
  const items = [...(subjects.data?.items ?? [])].sort(
    (left, right) => left.curriculum_order - right.curriculum_order,
  );
  const total = subjects.data?.total ?? 0;
  const start = items.length === 0 ? 0 : offset + 1;
  const end = offset + items.length;
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <AdminPage
      title={translate("admin.subjects")}
      back={{ href: "/admin/curriculum", label: translate("admin.curriculum") }}
      actions={
        <AdminButton aria-expanded={adding} onClick={() => setAdding((open) => !open)}>
          <AdminIcon name="plus" className="size-4" />
          {translate("admin.addSubject")}
        </AdminButton>
      }
    >
      <section className="flex gap-3 rounded-xl border border-reward bg-reward-tint p-4 text-on-reward-tint">
        <AdminIcon name="alert" className="mt-0.5 size-5" />
        <p>{translate("admin.subjectPermanent")}</p>
      </section>
      {adding && grades.data && streams.data ? (
        <SubjectForm
          grades={[...grades.data].sort((left, right) => left.sort_order - right.sort_order)}
          streams={streams.data}
          gradeId={gradeId}
          streamId={streamId}
          onDone={() => setAdding(false)}
        />
      ) : null}
      <SubjectFilters
        grades={grades.data ?? []}
        streams={streams.data ?? []}
        gradeId={gradeId}
        streamId={streamId}
        showStream={showStream}
        onGrade={(next) => {
          setGradeChoice(next);
          setStreamChoice(null);
          setOffset(0);
          setSelectedId(null);
        }}
        onStream={(next) => {
          setStreamChoice(next);
          setOffset(0);
        }}
      />
      <QueryGate
        query={subjects}
        isEmpty={subjects.isSuccess && items.length === 0}
        emptyTitle="admin.emptySubjects"
        emptyMessage="admin.emptySubjectsBody"
      >
        <DataTable
          minWidth="min-w-205"
          footer={
            <TablePager
              shown={items.length}
              rows={rows}
              pending={subjects.isFetching}
              hasPrevious={offset > 0}
              hasNext={end < total}
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
          }
        >
          <thead>
            <tr>
              <ColumnHead>{translate("admin.order")}</ColumnHead>
              <ColumnHead>{translate("admin.subject")}</ColumnHead>
              <ColumnHead>{translate("admin.code")}</ColumnHead>
              <ColumnHead>{translate("admin.inThePool")}</ColumnHead>
              <ColumnHead>{translate("admin.readyForStudents")}</ColumnHead>
              <ColumnHead>
                <span className="sr-only">{translate("admin.actions")}</span>
              </ColumnHead>
            </tr>
          </thead>
          <tbody>
            {items.map((subject) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                kind={pools.isSuccess ? (membership(pools.data, subject) ?? "none") : "unknown"}
                availability={
                  availability.data?.find(
                    (item) =>
                      item.subject_id === subject.id &&
                      item.grade_level_id === subject.grade_level_id,
                  ) ?? null
                }
                locale={locale}
                onChange={() => setSelectedId(subject.id)}
              />
            ))}
          </tbody>
        </DataTable>
      </QueryGate>
      {selected ? (
        <AvailabilityEditor
          key={`${selected.id}:${availability.data?.find((item) => item.subject_id === selected.id)?.status ?? ""}:${availability.data?.find((item) => item.subject_id === selected.id)?.expected_on ?? ""}`}
          subject={selected}
          availability={availability.data?.find((item) => item.subject_id === selected.id) ?? null}
        />
      ) : (
        <p className="text-caption text-admin-soft">{translate("admin.chooseReadiness")}</p>
      )}
      <ApiNote what={translate("admin.subjectFixedNote")} />
    </AdminPage>
  );
}

function SubjectFilters({
  grades,
  streams,
  gradeId,
  streamId,
  showStream,
  onGrade,
  onStream,
}: {
  grades: Grade[];
  streams: Stream[];
  gradeId: string;
  streamId: string;
  showStream: boolean;
  onGrade: (gradeId: string) => void;
  onStream: (streamId: string) => void;
}) {
  const { translate } = useMessages();
  const ordered = [...grades].sort((left, right) => left.sort_order - right.sort_order);
  return (
    <div className="flex flex-wrap items-end gap-3.5 rounded-xl border border-admin-border bg-admin-surface px-4.5 py-3.5">
      <ChoiceField
        label={translate("admin.grade")}
        value={gradeId}
        onChange={(event) => onGrade(event.target.value)}
      >
        <option value="all">{translate("admin.allGrades")}</option>
        {ordered.map((grade) => (
          <option key={grade.id} value={grade.id}>
            {grade.name}
          </option>
        ))}
      </ChoiceField>
      {showStream ? (
        <ChoiceField
          label={translate("admin.stream")}
          value={streamId}
          onChange={(event) => onStream(event.target.value)}
        >
          <option value="all">{translate("admin.allStreams")}</option>
          {streams.map((stream) => (
            <option key={stream.id} value={stream.id}>
              {stream.name}
            </option>
          ))}
        </ChoiceField>
      ) : null}
      <p className="mb-2 min-w-0 grow basis-70 text-caption text-admin-soft">
        {translate("admin.subjectFiltersNote")}
      </p>
    </div>
  );
}

function SubjectRow({
  subject,
  kind,
  availability,
  locale,
  onChange,
}: {
  subject: Subject;
  kind: "compulsory" | "optional" | "none" | "unknown";
  availability: components["schemas"]["AvailabilityRead"] | null;
  locale: "en" | "ne";
  onChange: () => void;
}) {
  const { translate } = useMessages();
  const readiness =
    availability?.status === "coming_soon" && availability.expected_on
      ? translate("admin.availabilityFrom", { date: formatDay(availability.expected_on, locale) })
      : availability
        ? translate(
            availability.status === "partial"
              ? "admin.availabilityPartial"
              : availability.status === "coming_soon"
                ? "admin.availabilitySoon"
                : "admin.availabilityAvailable",
          )
        : "—";
  const tone =
    availability?.status === "partial"
      ? "reward"
      : availability?.status === "coming_soon"
        ? "sky"
        : "success";
  return (
    <tr className="border-b border-admin-rule last:border-b-0">
      <ColumnCell>
        <span className="text-caption text-admin-soft tabular-nums">
          {subject.curriculum_order}
        </span>
      </ColumnCell>
      <ColumnCell>
        <span className="font-semibold">{subject.name}</span>
      </ColumnCell>
      <ColumnCell>
        <span className="text-caption text-admin-soft">{subject.code}</span>
      </ColumnCell>
      <ColumnCell>
        <span
          className={
            kind === "none" || kind === "unknown" ? "text-caption text-admin-soft" : "text-caption"
          }
        >
          {kind === "unknown"
            ? "—"
            : translate(
                kind === "compulsory"
                  ? "admin.poolCompulsory"
                  : kind === "optional"
                    ? "admin.poolOptional"
                    : "admin.notInPool",
              )}
        </span>
      </ColumnCell>
      <ColumnCell>
        {availability ? <StatusPill tone={tone}>{readiness}</StatusPill> : "—"}
      </ColumnCell>
      <ColumnCell align="right">
        <AdminButton tone="quiet" size="sm" onClick={onChange}>
          {translate("admin.change")}
        </AdminButton>
      </ColumnCell>
    </tr>
  );
}
