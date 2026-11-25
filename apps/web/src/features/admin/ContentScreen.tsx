"use client";

import type { components } from "@keoshaa/api-client";
import Link from "next/link";
import { useState } from "react";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { useMessages } from "@/lib/locale";

import { AdminIcon } from "./AdminIcon";
import { AdminButtonLink, ApiNote } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { courseTone, useCourses, useSubjectReleases, useWaitingEdits } from "./content-api";
import { useAcademicYears, useGradeLevels } from "./curriculum-api";
import { ColumnCell, ColumnHead, DataTable, StatusPill } from "./DataTable";
import { formatDay } from "./format";
import { QueryGate } from "./QueryGate";
import { useSubjectDirectory } from "./subjects-api";
import { TablePager, type RowChoice } from "./TablePager";

type Course = components["schemas"]["CourseRead"];
type Year = components["schemas"]["AcademicYearRead"];

export function ContentScreen() {
  const { translate } = useMessages();
  const years = useAcademicYears();
  const waiting = useWaitingEdits();
  const [yearChoice, setYearChoice] = useState<string | null>(null);
  const current = years.data?.find((year) => year.is_current) ?? years.data?.[0];
  const yearId = yearChoice ?? current?.id ?? "";

  return (
    <AdminPage
      title={translate("admin.content")}
      subtitle={translate("admin.contentSubtitle")}
      actions={
        <>
          <AdminButtonLink href="/admin/content/changes" tone="quiet" size="sm">
            {translate("admin.pendingEdits")}
            {waiting.data !== undefined ? (
              <span className="rounded-full bg-reward-tint px-1.5 text-tag font-semibold text-on-reward-tint">
                {waiting.data ?? "—"}
              </span>
            ) : null}
          </AdminButtonLink>
          <AdminButtonLink href="/admin/content/new" size="sm">
            <AdminIcon name="plus" className="size-4" />
            {translate("admin.addContent")}
          </AdminButtonLink>
        </>
      }
    >
      <QueryGate
        query={years}
        isEmpty={years.isSuccess && (years.data?.length ?? 0) === 0}
        emptyTitle="admin.emptyYears"
        emptyMessage="admin.emptyYearsBody"
      >
        <YearFilter years={years.data ?? []} yearId={yearId} onYear={setYearChoice} />
        <CourseTable yearId={yearId} />
        <section className="flex flex-col gap-2 rounded-xl border border-admin-border bg-admin-surface px-5 py-4">
          <h2 className="text-micro font-semibold tracking-widest text-admin-soft uppercase">
            {translate("admin.contentPagesTitle")}
          </h2>
          <p>{translate("admin.contentPagesBody")}</p>
          <ApiNote what={translate("admin.contentNamesNote")} />
        </section>
      </QueryGate>
    </AdminPage>
  );
}

function YearFilter({
  years,
  yearId,
  onYear,
}: {
  years: Year[];
  yearId: string;
  onYear: (yearId: string) => void;
}) {
  const { translate } = useMessages();
  return (
    <div className="flex flex-wrap items-end gap-3.5 rounded-xl border border-admin-border bg-admin-surface px-4.5 py-3.5">
      <ChoiceField
        label={translate("admin.contentYear")}
        value={yearId}
        onChange={(event) => onYear(event.target.value)}
      >
        {years.map((year) => (
          <option key={year.id} value={year.id}>
            {year.is_current ? translate("admin.yearCurrent", { label: year.label }) : year.label}
          </option>
        ))}
      </ChoiceField>
      <p className="mb-2 min-w-0 grow basis-70 text-caption text-admin-soft">
        {translate("admin.contentYearNote")}
      </p>
    </div>
  );
}

function CourseTable({ yearId }: { yearId: string }) {
  const { translate } = useMessages();
  const [rows, setRows] = useState<RowChoice>(20);
  const [offset, setOffset] = useState(0);
  const courses = useCourses(yearId, rows, offset);
  const subjects = useSubjectDirectory();
  const grades = useGradeLevels();
  const items = courses.data?.items ?? [];
  const total = courses.data?.total ?? 0;
  const start = items.length === 0 ? 0 : offset + 1;
  const end = offset + items.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / rows);
  const pageIndex = Math.floor(offset / rows);

  return (
    <QueryGate
      query={courses}
      isEmpty={courses.isSuccess && items.length === 0}
      emptyTitle="admin.emptyContent"
      emptyMessage="admin.emptyContentBody"
    >
      <DataTable
        minWidth="min-w-235"
        footer={
          <TablePager
            shown={items.length}
            rows={rows}
            pending={courses.isFetching}
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
        }
      >
        <thead>
          <tr>
            <ColumnHead>{translate("admin.subject")}</ColumnHead>
            <ColumnHead>{translate("admin.showingColumn")}</ColumnHead>
            <ColumnHead>{translate("admin.status")}</ColumnHead>
            <ColumnHead>{translate("admin.whoSeesIt")}</ColumnHead>
            <ColumnHead>{translate("admin.runs")}</ColumnHead>
            <ColumnHead>
              <span className="sr-only">{translate("admin.actions")}</span>
            </ColumnHead>
          </tr>
        </thead>
        <tbody>
          {items.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              subject={subjects.data?.find((item) => item.id === course.subject_id)}
              gradeName={
                grades.data?.find(
                  (grade) =>
                    grade.id ===
                    subjects.data?.find((item) => item.id === course.subject_id)?.grade_level_id,
                )?.name
              }
            />
          ))}
        </tbody>
      </DataTable>
    </QueryGate>
  );
}

function CourseRow({
  course,
  subject,
  gradeName,
}: {
  course: Course;
  subject: components["schemas"]["SubjectRead"] | undefined;
  gradeName: string | undefined;
}) {
  const { locale, translate } = useMessages();
  const releases = useSubjectReleases(course.subject_id);
  const release = releases.data?.find((item) => item.id === course.content_release_id);
  const statusKey =
    course.status.toLowerCase() === "live"
      ? "admin.contentLive"
      : course.status.toLowerCase() === "scheduled"
        ? "admin.contentScheduled"
        : course.status.toLowerCase() === "draft"
          ? "admin.contentDraft"
          : null;
  const visibility = course.visibility.toLowerCase();
  const audience =
    visibility === "everyone"
      ? "admin.seesEveryone"
      : visibility === "staff" || visibility === "staff_only"
        ? "admin.seesStaff"
        : null;
  const range =
    course.starts_on && course.ends_on
      ? translate("admin.runsRange", {
          start: formatDay(course.starts_on, locale),
          end: formatDay(course.ends_on, locale),
        })
      : null;
  const title = subject
    ? gradeName
      ? `${subject.name} · ${gradeName}`
      : subject.name
    : course.subject_id;
  return (
    <tr className="border-b border-admin-rule last:border-b-0">
      <ColumnCell>
        <span className="font-semibold">{title}</span>
      </ColumnCell>
      <ColumnCell>
        {release ? (
          <Link href="/admin/releases" className="font-semibold text-primary">
            {translate("admin.versionLabel", { version: String(release.version) })}
          </Link>
        ) : (
          "—"
        )}
        <span className="block text-caption text-admin-soft">
          {!releases.isSuccess
            ? "—"
            : release?.published_at
              ? translate("admin.contentPublished", {
                  date: formatDay(release.published_at, locale),
                })
              : translate("admin.neverPublished")}
        </span>
      </ColumnCell>
      <ColumnCell>
        <StatusPill tone={courseTone(course.status)}>
          {statusKey ? translate(statusKey) : course.status}
        </StatusPill>
      </ColumnCell>
      <ColumnCell>
        <span className="text-caption">{audience ? translate(audience) : course.visibility}</span>
      </ColumnCell>
      <ColumnCell>
        <span className={range ? "text-caption tabular-nums" : "text-caption text-admin-soft"}>
          {range ?? translate("admin.notSet")}
        </span>
      </ColumnCell>
      <ColumnCell align="right">
        <Link href="/admin/releases" className="text-caption font-semibold text-primary">
          {translate("admin.changeVersion")}
        </Link>
      </ColumnCell>
    </tr>
  );
}
