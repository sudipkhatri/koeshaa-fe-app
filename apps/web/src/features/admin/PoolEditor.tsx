"use client";

import type { components } from "@keoshaa/api-client";
import type { Locale } from "@keoshaa/i18n";
import { useState } from "react";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { AdminButton } from "./admin-ui";
import { StatusPill } from "./DataTable";
import { formatDay } from "./format";
import {
  poolChange,
  usePublishPool,
  usePutPoolItem,
  useRemovePoolItem,
  useUpdatePoolDraft,
  type PoolKind,
  type PoolVersion,
} from "./pool-api";

type Subject = components["schemas"]["SubjectRead"];
type Availability = components["schemas"]["AvailabilityRead"];

function named(subjects: Subject[], ids: string[], locale: Locale): string {
  const labels = ids.map((id) => subjects.find((subject) => subject.id === id)?.name ?? id);
  return new Intl.ListFormat(locale === "ne" ? "ne" : "en", {
    style: "long",
    type: "conjunction",
  }).format(labels);
}

export function PoolEditor({
  draft,
  live,
  subjects,
  availability,
  label,
}: {
  draft: PoolVersion;
  live: PoolVersion | null;
  subjects: Subject[];
  availability: Availability[];
  label: string;
}) {
  const { locale, translate } = useMessages();
  const update = useUpdatePoolDraft(draft.id);
  const put = usePutPoolItem(draft.id);
  const remove = useRemovePoolItem(draft.id);
  const publish = usePublishPool(draft.id);
  const [adding, setAdding] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const busy = update.isPending || put.isPending || remove.isPending || publish.isPending;
  const taken = new Set(draft.items.map((item) => item.subject_id));
  const spare = subjects.filter((subject) => !taken.has(subject.id));
  const change = poolChange(draft, live);

  async function run(action: () => Promise<unknown>) {
    setFailure(null);
    try {
      await action();
    } catch (error) {
      setFailure(errorMessage(error, translate, (seconds) => formatRetryTime(seconds, locale)));
    }
  }

  async function savePick(pick: string) {
    const next = Number(pick);
    if (!Number.isInteger(next) || next < 0 || next === draft.optional_required) return;
    await run(() => update.mutateAsync(next));
  }

  return (
    <section className="rounded-xl border border-primary bg-admin-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-admin-rule px-5 py-4">
        <span className="min-w-0 grow">
          <h2 className="text-button font-semibold">
            {translate("admin.versionLabel", { version: String(draft.version) })}{" "}
            <StatusPill tone="reward">{translate("admin.draftLabel")}</StatusPill>
          </h2>
          <span className="mt-1 block text-caption text-admin-soft">
            {translate("admin.draftStarted", { date: formatDay(draft.created_at, locale) })}
          </span>
        </span>
        {confirming ? (
          <span className="flex flex-col items-end gap-2">
            <span className="text-caption text-admin-soft">
              {translate("admin.publishConfirm", {
                version: String(draft.version),
                label,
              })}
            </span>
            <PublishDiff change={change} subjects={subjects} locale={locale} />
            <span className="flex flex-wrap justify-end gap-2">
              <AdminButton
                size="sm"
                pending={publish.isPending}
                onClick={() => void run(() => publish.mutateAsync())}
              >
                {translate("admin.publishIt")}
              </AdminButton>
              <AdminButton tone="quiet" size="sm" onClick={() => setConfirming(false)}>
                {translate("admin.cancel")}
              </AdminButton>
            </span>
          </span>
        ) : (
          <AdminButton onClick={() => setConfirming(true)}>
            {translate("admin.publishVersion", { version: String(draft.version) })}
          </AdminButton>
        )}
      </div>
      <PoolList
        title={translate("admin.everyoneTakes")}
        kind="compulsory"
        items={draft.items.filter((item) => item.kind === "compulsory")}
        subjects={subjects}
        availability={availability}
        busy={busy}
        onKind={(subjectId, kind) =>
          void run(() => put.mutateAsync({ subject_id: subjectId, kind }))
        }
        onRemove={(subjectId) => void run(() => remove.mutateAsync(subjectId))}
      />
      <div className="border-t border-admin-rule px-5 pt-4.5">
        <div className="mb-2.5 flex flex-wrap items-center gap-3">
          <p className="min-w-0 grow text-micro font-semibold tracking-widest text-admin-soft uppercase">
            {translate("admin.theyChoose")}
          </p>
          <PickField
            key={`${draft.id}:${draft.optional_required}`}
            required={draft.optional_required}
            onSave={(pick) => void savePick(pick)}
          />
        </div>
        <ItemList
          kind="optional"
          items={draft.items.filter((item) => item.kind === "optional")}
          subjects={subjects}
          availability={availability}
          busy={busy}
          onKind={(subjectId, kind) =>
            void run(() => put.mutateAsync({ subject_id: subjectId, kind }))
          }
          onRemove={(subjectId) => void run(() => remove.mutateAsync(subjectId))}
        />
      </div>
      <div className="relative z-20 flex flex-wrap items-end gap-3 rounded-b-xl border-t border-admin-rule bg-admin-page px-5 py-4">
        <ChoiceField
          label={translate("admin.addToPool")}
          placement="above"
          value={adding}
          onChange={(event) => setAdding(event.target.value)}
        >
          <option value="">{translate("admin.addToPool")}</option>
          {spare.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {`${subject.name} · ${subject.code}`}
            </option>
          ))}
        </ChoiceField>
        <AdminButton
          tone="quiet"
          disabled={adding === "" || busy}
          onClick={() => {
            const subjectId = adding;
            setAdding("");
            void run(() => put.mutateAsync({ subject_id: subjectId, kind: "optional" }));
          }}
        >
          {translate("admin.add")}
        </AdminButton>
      </div>
      {failure ? (
        <p role="alert" className="px-5 pb-4 text-caption text-admin-danger">
          {failure}
        </p>
      ) : null}
    </section>
  );
}

function PublishDiff({
  change,
  subjects,
  locale,
}: {
  change: ReturnType<typeof poolChange>;
  subjects: Subject[];
  locale: Locale;
}) {
  const { translate } = useMessages();
  const samePick = change.pickFrom === null || change.pickFrom === change.pickTo;
  const quiet =
    change.added.length === 0 &&
    change.removed.length === 0 &&
    change.moved.length === 0 &&
    samePick;
  if (quiet)
    return <p className="text-caption text-admin-soft">{translate("admin.nothingChanged")}</p>;
  return (
    <span className="flex flex-col items-end gap-1 text-caption text-admin-soft">
      {change.added.length > 0 ? (
        <span>
          {translate("admin.addedSubjects", { names: named(subjects, change.added, locale) })}
        </span>
      ) : null}
      {change.removed.length > 0 ? (
        <span>
          {translate("admin.removedSubjects", { names: named(subjects, change.removed, locale) })}
        </span>
      ) : null}
      {change.moved.length > 0 ? (
        <span>
          {translate("admin.movedSubjects", { names: named(subjects, change.moved, locale) })}
        </span>
      ) : null}
      {!samePick && change.pickFrom !== null ? (
        <span>
          {translate("admin.pickChanged", {
            from: String(change.pickFrom),
            to: String(change.pickTo),
          })}
        </span>
      ) : null}
    </span>
  );
}

function PickField({ required, onSave }: { required: number; onSave: (pick: string) => void }) {
  const { translate } = useMessages();
  const [pick, setPick] = useState(String(required));
  return (
    <label className="inline-flex items-center gap-2 text-caption">
      {translate("admin.mustPick")}
      <input
        type="number"
        min={0}
        value={pick}
        onChange={(event) => setPick(event.target.value)}
        onBlur={() => onSave(pick)}
        className="w-16 rounded-lg border border-admin-border bg-admin-surface px-2 text-center text-small text-admin-ink md:h-8"
      />
    </label>
  );
}

function PoolList({
  title,
  ...rest
}: {
  title: string;
  kind: PoolKind;
  items: PoolVersion["items"];
  subjects: Subject[];
  availability: Availability[];
  busy: boolean;
  onKind: (subjectId: string, kind: PoolKind) => void;
  onRemove: (subjectId: string) => void;
}) {
  return (
    <div className="px-5 pt-4.5">
      <p className="mb-2.5 text-micro font-semibold tracking-widest text-admin-soft uppercase">
        {title}
      </p>
      <ItemList {...rest} />
    </div>
  );
}

function ItemList({
  kind,
  items,
  subjects,
  availability,
  busy,
  onKind,
  onRemove,
}: {
  kind: PoolKind;
  items: PoolVersion["items"];
  subjects: Subject[];
  availability: Availability[];
  busy: boolean;
  onKind: (subjectId: string, kind: PoolKind) => void;
  onRemove: (subjectId: string) => void;
}) {
  const { locale, translate } = useMessages();
  if (items.length === 0) return <p className="pb-3 text-caption text-admin-soft">—</p>;
  return (
    <ul>
      {items.map((item) => {
        const subject = subjects.find((entry) => entry.id === item.subject_id);
        const ready = availability.find((entry) => entry.subject_id === item.subject_id);
        const other: PoolKind = kind === "compulsory" ? "optional" : "compulsory";
        return (
          <li
            key={item.subject_id}
            className="flex flex-wrap items-center gap-2.5 border-b border-admin-rule py-2.75 last:border-b-0"
          >
            <span className="min-w-0 grow font-semibold">
              {subject?.name ?? item.subject_id}{" "}
              <span className="text-caption font-normal text-admin-soft">
                {subject?.code ?? ""}
              </span>
            </span>
            <ReadyPill ready={ready ?? null} locale={locale} />
            <AdminButton
              tone="quiet"
              size="sm"
              disabled={busy}
              onClick={() => onKind(item.subject_id, other)}
            >
              {translate(other === "optional" ? "admin.makeOptional" : "admin.makeCompulsory")}
            </AdminButton>
            <AdminButton
              tone="dangerQuiet"
              size="sm"
              disabled={busy}
              onClick={() => onRemove(item.subject_id)}
            >
              {translate("admin.remove")}
            </AdminButton>
          </li>
        );
      })}
    </ul>
  );
}

function ReadyPill({ ready, locale }: { ready: Availability | null; locale: Locale }) {
  const { translate } = useMessages();
  if (!ready) return <span className="text-caption text-admin-soft">—</span>;
  const soon = ready.status === "coming_soon" && ready.expected_on;
  const label = soon
    ? translate("admin.availabilityFrom", { date: formatDay(ready.expected_on ?? "", locale) })
    : translate(
        ready.status === "partial"
          ? "admin.availabilityPartial"
          : ready.status === "coming_soon"
            ? "admin.availabilitySoon"
            : "admin.availabilityAvailable",
      );
  const tone =
    ready.status === "partial" ? "reward" : ready.status === "coming_soon" ? "sky" : "success";
  return <StatusPill tone={tone}>{label}</StatusPill>;
}
