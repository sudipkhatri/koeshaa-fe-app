"use client";

import { NetworkError } from "@keoshaa/core";
import { useId, useState } from "react";

import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { AdminIcon } from "./AdminIcon";
import { AdminButton, ApiNote, ApiTag } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { useSubjectReleases } from "./content-api";
import { useAcademicYears, useGradeLevels } from "./curriculum-api";
import { StatusPill } from "./DataTable";
import { formatDay } from "./format";
import { QueryGate } from "./QueryGate";
import {
  nextVersion,
  openRelease,
  useCreateRelease,
  usePublishRelease,
  useYearCourses,
  type Release,
} from "./releases-api";
import { PublishedTable } from "./releases-published";
import { useSubjectDirectory } from "./subjects-api";

export function ReleasesScreen() {
  const { translate } = useMessages();
  const subjects = useSubjectDirectory();
  const grades = useGradeLevels();
  const years = useAcademicYears();
  const subjectSelectId = useId();
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const list = subjects.data ?? [];
  const chosen = subjectId ?? list[0]?.id ?? "";
  const subject = list.find((item) => item.id === chosen);
  const gradeName = grades.data?.find((grade) => grade.id === subject?.grade_level_id)?.name;
  const subtitle = subject
    ? gradeName
      ? `${subject.name} · ${gradeName}`
      : subject.name
    : undefined;
  const currentYear = years.data?.find((year) => year.is_current) ?? years.data?.[0];
  const courses = useYearCourses(currentYear?.id ?? "");
  const subjectCourses = (courses.data ?? []).filter((course) => course.subject_id === chosen);
  const allReleases = useSubjectReleases(chosen);
  const open = openRelease(allReleases.data ?? []);
  const published = [...(allReleases.data ?? [])]
    .filter((release) => release.published_at !== null)
    .sort((left, right) => right.version - left.version);
  const upcoming = nextVersion(allReleases.data ?? []);

  return (
    <AdminPage
      title={translate("admin.releases")}
      subtitle={subtitle}
      actions={
        <>
          {list.length > 0 ? (
            <select
              id={subjectSelectId}
              aria-label={translate("admin.subject")}
              value={chosen}
              onChange={(event) => setSubjectId(event.target.value)}
              className="min-h-12 cursor-pointer rounded-lg border border-admin-border bg-admin-surface px-2.5 text-caption text-admin-ink md:h-9 md:min-h-0"
            >
              {list.map((item) => {
                const grade = grades.data?.find((entry) => entry.id === item.grade_level_id)?.name;
                return (
                  <option key={item.id} value={item.id}>
                    {grade ? `${item.name} · ${grade}` : item.name}
                  </option>
                );
              })}
            </select>
          ) : null}
          <StartRelease subjectId={chosen} next={upcoming} hasOpen={Boolean(open)} />
        </>
      }
    >
      <QueryGate
        query={subjects}
        isEmpty={subjects.isSuccess && list.length === 0}
        emptyTitle="admin.emptySubjects"
        emptyMessage="admin.emptySubjectsBody"
      >
        <div className="flex gap-3 rounded-xl bg-primary-tint px-4 py-3.5 text-on-primary-tint">
          <AdminIcon name="info" className="mt-0.5 size-5 shrink-0" />
          <p>{translate("admin.releasesIntro")}</p>
        </div>

        <QueryGate
          query={allReleases}
          isEmpty={false}
          emptyTitle="admin.emptyPublished"
          emptyMessage="admin.emptyPublishedBody"
        >
          {open ? (
            <OpenCard release={open} subjectId={chosen} />
          ) : (
            <p className="text-caption text-admin-soft">{translate("admin.noOpenRelease")}</p>
          )}

          <PublishedTable
            subjectId={chosen}
            releases={published}
            courses={subjectCourses}
            coursesReady={courses.isSuccess}
          />
        </QueryGate>

        <section className="flex flex-col gap-2 rounded-xl border border-admin-border bg-admin-surface px-5 py-4">
          <h2 className="text-micro font-semibold tracking-widest text-admin-soft uppercase">
            {translate("admin.releasesMissingTitle")}
          </h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-4.5 text-caption text-on-reward-tint">
            <li>{translate("admin.releasesMissingCounts")}</li>
            <li>{translate("admin.releasesMissingLabels")}</li>
            <li>{translate("admin.releasesMissingPin")}</li>
          </ul>
        </section>
      </QueryGate>
    </AdminPage>
  );
}

function StartRelease({
  subjectId,
  next,
  hasOpen,
}: {
  subjectId: string;
  next: number;
  hasOpen: boolean;
}) {
  const { locale, translate } = useMessages();
  const create = useCreateRelease();
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1">
      <AdminButton
        tone="quiet"
        size="sm"
        pending={create.isPending}
        disabled={create.isPending || subjectId === "" || hasOpen}
        onClick={() => {
          setError("");
          setOffline(false);
          void create.mutateAsync({ subject_id: subjectId, notes: null }).catch((failure) => {
            setOffline(failure instanceof NetworkError);
            setError(
              errorMessage(failure, translate, (seconds) => formatRetryTime(seconds, locale)),
            );
          });
        }}
      >
        <AdminIcon name="plus" className="size-4" />
        {translate(offline ? "common.noConnection" : "admin.startRelease", {
          version: String(next),
        })}
      </AdminButton>
      {hasOpen ? (
        <p className="text-micro text-admin-soft">{translate("admin.openBlocksStart")}</p>
      ) : null}
      {error ? <p className="text-micro text-admin-danger">{error}</p> : null}
    </div>
  );
}

function OpenCard({ release, subjectId }: { release: Release; subjectId: string }) {
  const { locale, translate } = useMessages();
  const publish = usePublishRelease();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  return (
    <section className="overflow-hidden rounded-xl border border-primary bg-admin-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-admin-rule px-5 py-4">
        <span className="min-w-0 grow">
          <h2 className="text-title font-semibold">
            {translate("admin.versionLabel", { version: String(release.version) })}{" "}
            <StatusPill tone="reward">{translate("admin.releaseOpen")}</StatusPill>
          </h2>
          <span className="mt-0.75 block text-caption text-admin-soft">
            {translate("admin.releaseStarted", { date: formatDay(release.created_at, locale) })}
            {" · "}
            <ApiTag />
          </span>
        </span>
        <AdminButton
          pending={publish.isPending}
          disabled={publish.isPending}
          onClick={() => {
            if (!confirming) {
              setConfirming(true);
              return;
            }
            setError("");
            setOffline(false);
            void publish
              .mutateAsync({ releaseId: release.id, subjectId })
              .then(() => setConfirming(false))
              .catch((failure) => {
                setConfirming(false);
                setOffline(failure instanceof NetworkError);
                setError(
                  errorMessage(failure, translate, (seconds) => formatRetryTime(seconds, locale)),
                );
              });
          }}
        >
          {confirming
            ? translate(offline ? "common.noConnection" : "admin.publishIt")
            : translate("admin.publishVersion", { version: String(release.version) })}
        </AdminButton>
      </div>
      <div className="flex flex-wrap gap-6 px-5 py-4">
        <div className="min-w-0 grow basis-70">
          <p className="mb-2.5 text-micro font-semibold tracking-widest text-admin-soft uppercase">
            {translate("admin.whatIsInIt")}
          </p>
          <ul className="flex flex-col gap-1.5 text-caption">
            {(
              [
                "admin.chaptersAdded",
                "admin.topicsAdded",
                "admin.questionsAdded",
                "admin.editsApplied",
              ] as const
            ).map((key) => (
              <li key={key} className="flex justify-between gap-3">
                <span>{translate(key)}</span>
                <strong className="font-semibold tabular-nums">—</strong>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <ApiNote what={translate("admin.releaseCountsNote")} />
          </div>
        </div>
        <div className="min-w-0 grow basis-70">
          <p className="mb-2.5 text-micro font-semibold tracking-widest text-admin-soft uppercase">
            {translate("admin.releaseNotes")}
          </p>
          <p className="mb-3 text-caption">{release.notes?.trim() || "—"}</p>
          <p className="rounded-xl bg-reward-tint px-3.5 py-3 text-caption text-on-reward-tint">
            {translate("admin.publishFinal")}
          </p>
        </div>
      </div>
      {error ? (
        <p className="border-t border-admin-rule px-5 py-3 text-caption text-admin-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
