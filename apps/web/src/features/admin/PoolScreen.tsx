"use client";

import type { components } from "@keoshaa/api-client";
import type { Locale } from "@keoshaa/i18n";
import { useState } from "react";

import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { AdminIcon } from "./AdminIcon";
import { AdminButton, ApiNote } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { useGradeLevels, useStreams } from "./curriculum-api";
import { StatusPill } from "./DataTable";
import { formatDay } from "./format";
import { useAdminUser } from "./account-detail-api";
import { PoolEditor } from "./PoolEditor";
import {
  draftVersion,
  liveVersion,
  useCreatePoolVersion,
  usePoolVersions,
  type PoolVersion,
} from "./pool-api";
import { QueryGate } from "./QueryGate";
import { useAvailability, useSubjectCatalog } from "./subjects-api";

type Grade = components["schemas"]["GradeLevelRead"];
type Stream = components["schemas"]["StreamRead"];

interface Pair {
  value: string;
  gradeId: string;
  streamId: string | null;
  label: string;
}

function pairs(
  grades: Grade[],
  streams: Stream[],
  translate: (key: "admin.poolPair", params: { grade: string; stream: string }) => string,
): Pair[] {
  const ordered = [...grades].sort((left, right) => left.sort_order - right.sort_order);
  const next: Pair[] = [];
  for (const grade of ordered) {
    if (!grade.has_streams) {
      next.push({ value: `${grade.id}:`, gradeId: grade.id, streamId: null, label: grade.name });
      continue;
    }
    for (const stream of streams) {
      next.push({
        value: `${grade.id}:${stream.id}`,
        gradeId: grade.id,
        streamId: stream.id,
        label: translate("admin.poolPair", { grade: grade.name, stream: stream.name }),
      });
    }
  }
  return next;
}

export function PoolScreen() {
  const { locale, translate } = useMessages();
  const grades = useGradeLevels();
  const streams = useStreams();
  const options = pairs(grades.data ?? [], streams.data ?? [], translate);
  const [choice, setChoice] = useState<string | null>(null);
  const selected = options.find((option) => option.value === choice) ?? options[0];
  const gradeId = selected?.gradeId ?? "";
  const streamKey = selected?.streamId ?? "";
  const versions = usePoolVersions(gradeId, streamKey);
  const catalog = useSubjectCatalog(gradeId, streamKey);
  const availability = useAvailability(gradeId);
  const create = useCreatePoolVersion();
  const [failure, setFailure] = useState<string | null>(null);
  const draft = versions.data ? draftVersion(versions.data) : null;
  const live = versions.data ? liveVersion(versions.data) : null;
  const earlier = (versions.data ?? [])
    .filter((version) => version.published_at !== null)
    .sort((left, right) => right.version - left.version);

  async function start() {
    if (!selected) return;
    setFailure(null);
    try {
      await create.mutateAsync({
        gradeId: selected.gradeId,
        streamId: selected.streamId,
        optionalRequired: live?.optional_required ?? 0,
        items: live?.items ?? [],
      });
    } catch (error) {
      setFailure(errorMessage(error, translate, (seconds) => formatRetryTime(seconds, locale)));
    }
  }

  return (
    <AdminPage
      title={translate("admin.poolTitle", {
        label: selected?.label ?? translate("admin.subjectPools"),
      })}
      back={{ href: "/admin/curriculum", label: translate("admin.curriculum") }}
      actions={
        <select
          aria-label={translate("admin.poolPairLabel")}
          value={selected?.value ?? ""}
          onChange={(event) => setChoice(event.target.value)}
          className="min-h-12 cursor-pointer rounded-lg border border-admin-border bg-admin-surface px-2.5 text-small text-admin-ink md:h-9 md:min-h-0"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      }
    >
      <QueryGate
        query={grades.isSuccess ? streams : grades}
        isEmpty={grades.isSuccess && streams.isSuccess && options.length === 0}
        emptyTitle="admin.emptyGrades"
        emptyMessage="admin.emptyGradesBody"
      >
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex min-w-0 grow basis-110 flex-col gap-5">
            <section className="flex gap-3 rounded-xl bg-primary-tint p-4 text-admin-on-tint">
              <AdminIcon name="info" className="mt-0.5 size-5" />
              <p>{translate("admin.poolIntro")}</p>
            </section>
            <QueryGate
              query={versions}
              isEmpty={versions.isSuccess && (versions.data?.length ?? 0) === 0 && !draft}
              emptyTitle="admin.emptyPools"
              emptyMessage="admin.emptyPoolsBody"
            >
              {draft ? (
                <PoolEditor
                  draft={draft}
                  live={live}
                  subjects={catalog.data ?? []}
                  availability={availability.data ?? []}
                  label={selected?.label ?? ""}
                />
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-caption text-admin-soft">{translate("admin.noDraftNote")}</p>
                  <AdminButton pending={create.isPending} onClick={() => void start()}>
                    {translate("admin.startVersion")}
                  </AdminButton>
                </div>
              )}
              {earlier.length > 0 ? (
                <Earlier versions={earlier} liveId={live?.id ?? null} locale={locale} />
              ) : null}
            </QueryGate>
            {versions.isSuccess && (versions.data?.length ?? 0) === 0 ? (
              <AdminButton
                pending={create.isPending}
                onClick={() => void start()}
                className="self-start"
              >
                {translate("admin.startVersion")}
              </AdminButton>
            ) : null}
            {failure ? (
              <p role="alert" className="text-caption text-admin-danger">
                {failure}
              </p>
            ) : null}
          </div>
          <PoolSide
            shown={draft ?? live}
            subjects={catalog.data ?? []}
            availability={availability.data ?? []}
            label={selected?.label ?? ""}
            locale={locale}
          />
        </div>
      </QueryGate>
    </AdminPage>
  );
}

function Earlier({
  versions,
  liveId,
  locale,
}: {
  versions: PoolVersion[];
  liveId: string | null;
  locale: Locale;
}) {
  const { translate } = useMessages();
  return (
    <section className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <div className="border-b border-admin-rule px-5 py-3.5">
        <h2 className="text-body font-semibold">{translate("admin.earlierVersions")}</h2>
      </div>
      <ul>
        {versions.map((version) => (
          <li
            key={version.id}
            className={`flex flex-wrap items-center gap-3 border-b border-admin-rule px-5 py-3 last:border-b-0 ${version.id === liveId ? "bg-primary-tint" : ""}`}
          >
            <span className="min-w-0 grow">
              <strong className="font-semibold">
                {translate("admin.versionLabel", { version: String(version.version) })}
              </strong>
              {version.id === liveId ? (
                <span className="ml-2">
                  <StatusPill tone="success">{translate("admin.liveLabel")}</StatusPill>
                </span>
              ) : null}
              <HistoryLine version={version} locale={locale} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HistoryLine({ version, locale }: { version: PoolVersion; locale: Locale }) {
  const { translate } = useMessages();
  const person = useAdminUser(version.published_by ?? "", Boolean(version.published_by));
  const summary = translate("admin.poolSummary", {
    compulsory: String(version.items.filter((item) => item.kind === "compulsory").length),
    optional: String(version.items.filter((item) => item.kind === "optional").length),
    pick: String(version.optional_required),
  });
  const date = version.published_at ? formatDay(version.published_at, locale) : "—";
  const name = person.data?.name;
  return (
    <span className="mt-1 block text-caption text-admin-soft">
      {name
        ? translate("admin.publishedBy", { date, name, summary })
        : translate("admin.publishedOn", { date, summary })}
    </span>
  );
}

function PoolSide({
  shown,
  subjects,
  availability,
  label,
  locale,
}: {
  shown: PoolVersion | null;
  subjects: components["schemas"]["SubjectRead"][];
  availability: components["schemas"]["AvailabilityRead"][];
  label: string;
  locale: Locale;
}) {
  const { translate } = useMessages();
  const compulsory = shown?.items.filter((item) => item.kind === "compulsory") ?? [];
  const optional = shown?.items.filter((item) => item.kind === "optional") ?? [];
  const names = (items: PoolVersion["items"]) =>
    new Intl.ListFormat(locale === "ne" ? "ne" : "en", {
      style: "long",
      type: "conjunction",
    }).format(
      items.map(
        (item) =>
          subjects.find((subject) => subject.id === item.subject_id)?.name ?? item.subject_id,
      ),
    );
  const arriving = (shown?.items ?? []).flatMap((item) => {
    const ready = availability.find((entry) => entry.subject_id === item.subject_id);
    if (ready?.status !== "coming_soon" || !ready.expected_on) return [];
    const name =
      subjects.find((subject) => subject.id === item.subject_id)?.name ?? item.subject_id;
    return [translate("admin.arrivingOn", { name, date: formatDay(ready.expected_on, locale) })];
  });
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:w-75">
      <section className="rounded-xl border border-admin-border bg-admin-surface p-5">
        <h2 className="text-small font-semibold">{translate("admin.studentSees")}</h2>
        {shown ? (
          <>
            <p className="mt-2.5 text-caption text-admin-soft">
              {translate(shown.published_at ? "admin.studentSeesLive" : "admin.studentSeesIntro", {
                version: translate("admin.versionLabel", { version: String(shown.version) }),
                label,
              })}
            </p>
            <ul className="mt-3 list-disc pl-4.5 text-caption">
              {compulsory.length > 0 ? (
                <li>{translate("admin.alreadyChosen", { names: names(compulsory) })}</li>
              ) : null}
              {optional.length > 0 ? (
                <li>
                  {translate("admin.anyOf", {
                    count: String(shown.optional_required),
                    names: names(optional),
                  })}
                </li>
              ) : null}
              {arriving.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2.5 text-caption text-admin-soft">—</p>
        )}
        <p className="mt-3 border-t border-admin-rule pt-3 text-caption text-admin-soft">
          {translate("admin.pickRefused")}
        </p>
      </section>
      <section className="rounded-xl border border-reward bg-admin-surface p-5">
        <h2 className="text-small font-semibold">{translate("admin.publishWarnTitle")}</h2>
        <p className="mt-2 text-caption text-on-reward-tint">{translate("admin.publishWarn")}</p>
      </section>
      <ApiNote what={translate("admin.poolInferred")} />
    </div>
  );
}
