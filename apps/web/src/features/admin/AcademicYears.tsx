"use client";

import type { components } from "@keoshaa/api-client";
import { useState } from "react";

import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, ApiNote } from "./admin-ui";
import {
  orderedYears,
  useAcademicYears,
  useMakeCurrentYear,
  yearPlace,
  type YearPlace,
} from "./curriculum-api";
import { formatDay, kathmanduDate } from "./format";
import { ColumnCell, ColumnHead, DataTable, StatusPill, type PillTone } from "./DataTable";
import { QueryGate } from "./QueryGate";
import { YearForm } from "./YearForm";

type Year = components["schemas"]["AcademicYearRead"];

const placeTone: Record<YearPlace, PillTone> = {
  current: "success",
  next: "sky",
  past: "quiet",
};

export function AcademicYears() {
  const { translate } = useMessages();
  const years = useAcademicYears();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const list = orderedYears(years.data ?? []);
  const editing = list.find((year) => year.id === editingId);

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="min-w-0 grow text-body font-semibold">{translate("admin.academicYears")}</h2>
        <AdminButton
          tone="quiet"
          aria-expanded={adding}
          onClick={() => {
            setAdding((open) => !open);
            setEditingId(null);
          }}
        >
          {translate("admin.addYear")}
        </AdminButton>
      </div>
      {adding ? <YearForm onDone={() => setAdding(false)} /> : null}
      {editing ? (
        <YearForm key={editing.id} year={editing} onDone={() => setEditingId(null)} />
      ) : null}
      <QueryGate
        query={years}
        isEmpty={list.length === 0}
        emptyTitle="admin.emptyYears"
        emptyMessage="admin.emptyYearsBody"
      >
        <DataTable minWidth="min-w-190">
          <thead>
            <tr>
              <ColumnHead>{translate("admin.year")}</ColumnHead>
              <ColumnHead>{translate("admin.runs")}</ColumnHead>
              <ColumnHead>{translate("admin.status")}</ColumnHead>
              <ColumnHead>
                <span className="sr-only">{translate("admin.actions")}</span>
              </ColumnHead>
            </tr>
          </thead>
          <tbody>
            {list.map((year) => (
              <YearRow
                key={year.id}
                year={year}
                onEdit={() => {
                  setEditingId(year.id);
                  setAdding(false);
                }}
              />
            ))}
          </tbody>
        </DataTable>
      </QueryGate>
      <p className="text-caption text-admin-soft">{translate("admin.oneCurrentYear")}</p>
      <ApiNote what={translate("admin.yearPlaceNote")} />
    </section>
  );
}

function YearRow({ year, onEdit }: { year: Year; onEdit: () => void }) {
  const { locale, translate } = useMessages();
  const makeCurrent = useMakeCurrentYear();
  const [confirming, setConfirming] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const place = yearPlace(year, kathmanduDate());
  const current = place === "current";

  async function confirm() {
    setFailure(null);
    try {
      await makeCurrent.mutateAsync(year.id);
      setConfirming(false);
    } catch (error) {
      setFailure(errorMessage(error, translate, (seconds) => formatRetryTime(seconds, locale)));
    }
  }

  return (
    <tr
      className={`border-b border-admin-rule last:border-b-0 ${current ? "bg-primary-tint" : ""}`}
    >
      <ColumnCell>
        <span className="font-semibold">{year.label}</span>
      </ColumnCell>
      <ColumnCell>
        <span className="text-caption tabular-nums">
          {translate("admin.runsRange", {
            start: formatDay(year.starts_on, locale),
            end: formatDay(year.ends_on, locale),
          })}
        </span>
      </ColumnCell>
      <ColumnCell>
        <StatusPill tone={placeTone[place]}>{translate(`admin.yearPlace.${place}`)}</StatusPill>
      </ColumnCell>
      <ColumnCell align="right">
        {confirming ? (
          <span className="inline-flex flex-wrap items-center justify-end gap-2">
            <span className="text-caption text-admin-soft">
              {translate("admin.makeCurrentNote", { year: year.label })}
            </span>
            <AdminButton size="sm" pending={makeCurrent.isPending} onClick={() => void confirm()}>
              {translate("admin.makeCurrentNow")}
            </AdminButton>
            <AdminButton tone="quiet" size="sm" onClick={() => setConfirming(false)}>
              {translate("admin.cancel")}
            </AdminButton>
          </span>
        ) : (
          <span className="inline-flex flex-wrap justify-end gap-2">
            {place === "next" ? (
              <AdminButton tone="quiet" size="sm" onClick={() => setConfirming(true)}>
                {translate("admin.makeCurrent")}
              </AdminButton>
            ) : null}
            <AdminButton tone="quiet" size="sm" onClick={onEdit}>
              {translate("admin.editDates")}
            </AdminButton>
          </span>
        )}
        {failure ? (
          <p role="alert" className="text-caption text-admin-danger">
            {failure}
          </p>
        ) : null}
      </ColumnCell>
    </tr>
  );
}
