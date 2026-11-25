"use client";

import { useMessages } from "@/lib/locale";

import { AcademicYears } from "./AcademicYears";
import { AdminButtonLink } from "./admin-ui";
import { AdminIcon } from "./AdminIcon";
import { AdminPage } from "./AdminPage";
import { useGradeLevels, useStreams } from "./curriculum-api";
import { ColumnCell, ColumnHead, DataTable } from "./DataTable";
import { QueryGate } from "./QueryGate";

export function CurriculumScreen() {
  const { translate } = useMessages();
  return (
    <AdminPage
      title={translate("admin.curriculum")}
      subtitle={translate("admin.curriculumSubtitle")}
      actions={
        <>
          <AdminButtonLink href="/admin/subjects" tone="quiet">
            {translate("admin.subjects")}
          </AdminButtonLink>
          <AdminButtonLink href="/admin/pools" tone="quiet">
            {translate("admin.subjectPools")}
          </AdminButtonLink>
        </>
      }
      gap="gap-6"
    >
      <AcademicYears />
      <div className="flex flex-wrap items-start gap-5">
        <GradeLevels />
        <Streams />
      </div>
      <section className="flex gap-3 rounded-xl border border-reward bg-reward-tint p-5 text-on-reward-tint">
        <AdminIcon name="alert" className="mt-0.5 size-5" />
        <div>
          <h2 className="text-body font-semibold">{translate("admin.structureFixed")}</h2>
          <p className="mt-1.5 text-caption">{translate("admin.structureFixedBody")}</p>
        </div>
      </section>
    </AdminPage>
  );
}

function GradeLevels() {
  const { translate } = useMessages();
  const grades = useGradeLevels();
  const list = [...(grades.data ?? [])].sort((left, right) => left.sort_order - right.sort_order);
  return (
    <section className="flex min-w-0 grow basis-110 flex-col gap-2.5">
      <h2 className="text-body font-semibold">{translate("admin.gradeLevels")}</h2>
      <QueryGate
        query={grades}
        isEmpty={list.length === 0}
        emptyTitle="admin.emptyGrades"
        emptyMessage="admin.emptyGradesBody"
      >
        <DataTable minWidth="min-w-110">
          <thead>
            <tr>
              <ColumnHead>{translate("admin.grade")}</ColumnHead>
              <ColumnHead>{translate("admin.streams")}</ColumnHead>
              <ColumnHead>{translate("admin.finalExam")}</ColumnHead>
            </tr>
          </thead>
          <tbody>
            {list.map((grade) => (
              <tr key={grade.id} className="border-b border-admin-rule last:border-b-0">
                <ColumnCell>
                  <span className="font-semibold">{grade.name}</span>
                </ColumnCell>
                <ColumnCell>
                  <span
                    className={grade.has_streams ? "font-semibold text-primary" : "text-admin-soft"}
                  >
                    {translate(grade.has_streams ? "admin.streamYes" : "admin.streamNo")}
                  </span>
                </ColumnCell>
                <ColumnCell>{grade.final_exam_name || "—"}</ColumnCell>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </QueryGate>
    </section>
  );
}

function Streams() {
  const { translate } = useMessages();
  const streams = useStreams();
  const list = streams.data ?? [];
  return (
    <section className="flex w-full min-w-0 flex-col gap-2.5 sm:w-75">
      <h2 className="text-body font-semibold">{translate("admin.streams")}</h2>
      <QueryGate
        query={streams}
        isEmpty={list.length === 0}
        emptyTitle="admin.emptyStreams"
        emptyMessage="admin.emptyStreamsBody"
      >
        <ul className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
          {list.map((stream) => (
            <li
              key={stream.id}
              className="flex items-center justify-between gap-3 border-b border-admin-rule px-4.5 py-2.75 last:border-b-0"
            >
              <span className="font-semibold">{stream.name}</span>
              <span className="text-caption text-admin-soft">{stream.code}</span>
            </li>
          ))}
        </ul>
      </QueryGate>
    </section>
  );
}
