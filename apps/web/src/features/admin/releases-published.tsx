"use client";

import { NetworkError } from "@keoshaa/core";
import { useState } from "react";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { useAdminUser } from "./account-detail-api";
import { AdminButton, ApiTag } from "./admin-ui";
import { ColumnCell, ColumnHead, DataTable, StatusPill } from "./DataTable";
import { formatDay } from "./format";
import { usePinCourse, type Course, type Release } from "./releases-api";
import { TablePager, type RowChoice } from "./TablePager";

export function PublishedTable({
  subjectId,
  releases,
  courses,
  coursesReady,
}: {
  subjectId: string;
  releases: Release[];
  courses: Course[];
  coursesReady: boolean;
}) {
  const { translate } = useMessages();
  const [rows, setRows] = useState<RowChoice>(20);
  const [offset, setOffset] = useState(0);
  const slice = releases.slice(offset, offset + rows);
  const total = releases.length;
  const start = slice.length === 0 ? 0 : offset + 1;
  const end = offset + slice.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / rows);
  const pageIndex = Math.floor(offset / rows);
  const pinnedIds = new Set(courses.map((course) => course.content_release_id));

  if (total === 0) {
    return (
      <section className="rounded-xl border border-admin-border bg-admin-surface px-5 py-8 text-center">
        <h2 className="text-body font-semibold">{translate("admin.emptyPublished")}</h2>
        <p className="mt-1 text-caption text-admin-soft">{translate("admin.emptyPublishedBody")}</p>
      </section>
    );
  }

  return (
    <DataTable
      minWidth="min-w-190"
      footer={
        <TablePager
          shown={slice.length}
          rows={rows}
          pending={false}
          hasPrevious={offset > 0}
          hasNext={end < total}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPage={(next) => setOffset(next * rows)}
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
          <ColumnHead>{translate("admin.version")}</ColumnHead>
          <ColumnHead>{translate("admin.releasePublishedCol")}</ColumnHead>
          <ColumnHead>{translate("admin.by")}</ColumnHead>
          <ColumnHead>{translate("admin.releaseNotes")}</ColumnHead>
          <ColumnHead>
            <span className="sr-only">{translate("admin.actions")}</span>
          </ColumnHead>
        </tr>
      </thead>
      <tbody>
        {slice.map((release) => (
          <PublishedRow
            key={release.id}
            release={release}
            subjectId={subjectId}
            courses={courses}
            coursesReady={coursesReady}
            pinned={pinnedIds.has(release.id)}
          />
        ))}
      </tbody>
    </DataTable>
  );
}

function PublishedRow({
  release,
  subjectId,
  courses,
  coursesReady,
  pinned,
}: {
  release: Release;
  subjectId: string;
  courses: Course[];
  coursesReady: boolean;
  pinned: boolean;
}) {
  const { locale, translate } = useMessages();
  const publisher = useAdminUser(release.published_by ?? "", Boolean(release.published_by));
  const pin = usePinCourse();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const chosen = courses.find((course) => course.id === courseId) ?? courses[0];

  return (
    <tr className={`border-b border-admin-rule last:border-b-0 ${pinned ? "bg-primary-tint" : ""}`}>
      <ColumnCell>
        <span className="font-semibold">
          {translate("admin.versionLabel", { version: String(release.version) })}
        </span>
        {pinned ? (
          <span className="ml-1.5">
            <StatusPill tone="success">{translate("admin.releasePinned")}</StatusPill>
          </span>
        ) : null}
      </ColumnCell>
      <ColumnCell>
        <span className="text-caption tabular-nums">
          {release.published_at ? formatDay(release.published_at, locale) : "—"}
        </span>
      </ColumnCell>
      <ColumnCell>
        <span className="text-caption">{publisher.data?.name ?? "—"}</span>
      </ColumnCell>
      <ColumnCell>
        <span className="text-caption text-admin-soft">{release.notes?.trim() || "—"}</span>
      </ColumnCell>
      <ColumnCell align="right">
        {pinned ? (
          <span className="text-caption text-admin-soft">{translate("admin.inUse")}</span>
        ) : !coursesReady ? (
          "—"
        ) : courses.length === 0 ? (
          <span className="inline-flex items-center gap-2 text-caption text-admin-soft">
            {translate("admin.noCourseToPin")}
            <ApiTag />
          </span>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {courses.length > 1 ? (
              <ChoiceField
                label={translate("admin.pinCourse")}
                value={chosen?.id ?? ""}
                onChange={(event) => setCourseId(event.target.value)}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.id.slice(-8)}
                  </option>
                ))}
              </ChoiceField>
            ) : null}
            <AdminButton
              tone="quiet"
              size="sm"
              pending={pin.isPending}
              disabled={pin.isPending || !chosen}
              onClick={() => {
                if (!chosen) return;
                setError("");
                setOffline(false);
                void pin
                  .mutateAsync({
                    courseId: chosen.id,
                    contentReleaseId: release.id,
                    subjectId,
                  })
                  .catch((failure) => {
                    setOffline(failure instanceof NetworkError);
                    setError(
                      errorMessage(failure, translate, (seconds) =>
                        formatRetryTime(seconds, locale),
                      ),
                    );
                  });
              }}
            >
              {translate(offline ? "common.noConnection" : "admin.pinThis")}
            </AdminButton>
            {error ? <p className="text-micro text-admin-danger">{error}</p> : null}
          </div>
        )}
      </ColumnCell>
    </tr>
  );
}
