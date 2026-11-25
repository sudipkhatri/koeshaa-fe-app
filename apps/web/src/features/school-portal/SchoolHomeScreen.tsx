"use client";

import type { MessageKey } from "@keoshaa/i18n";
import Link from "next/link";

import { useMessages } from "@/lib/locale";

import { SchoolPage } from "./SchoolPage";
import { ApiNote, ApiTag, Panel, SchoolButton } from "./school-ui";

const COUNT_CARDS: readonly { label: MessageKey; hint: MessageKey | null }[] = [
  { label: "school.studentsListed", hint: "school.classesRange" },
  { label: "school.signedIn", hint: null },
  { label: "school.studiedWeek", hint: null },
  { label: "school.quietDays", hint: null },
];

export function SchoolHomeScreen({ organisationId }: { organisationId: string }) {
  const { translate } = useMessages();
  return (
    <SchoolPage
      title={translate("school.overview")}
      actions={
        <Link
          href={`/school/${organisationId}/import`}
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4.5 font-semibold text-on-primary md:h-10 md:min-h-0"
        >
          {translate("school.addStudents")}
        </Link>
      }
    >
      <ApiNote what={translate("school.overviewNote")} />

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-reward-tint px-4.5 py-4 text-on-reward-tint">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {translate("school.seatsBannerTitle")} <ApiTag />
          </p>
          <p className="mt-0.5 text-caption">{translate("school.seatsBannerBody")}</p>
        </div>
        <SchoolButton tone="quiet" size="sm" disabled>
          {translate("school.askForMore")}
        </SchoolButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COUNT_CARDS.map((card) => (
          <Panel key={card.label} className="flex flex-col gap-1 px-4.5 py-4">
            <p className="text-micro font-semibold tracking-wider text-admin-soft uppercase">
              {translate(card.label)}
            </p>
            <p className="flex items-center gap-2 text-headline font-bold tabular-nums">
              —<ApiTag />
            </p>
            {card.hint ? (
              <p className="text-caption text-admin-soft">{translate(card.hint)}</p>
            ) : null}
          </Panel>
        ))}
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <Panel className="min-w-0 grow basis-full lg:basis-2/3">
          <div className="flex items-center gap-3 border-b border-admin-rule px-4.5 py-3.5">
            <h2 className="min-w-0 flex-1 text-body font-semibold">
              {translate("school.weakestTopics")}
            </h2>
            <Link
              href={`/school/${organisationId}/progress`}
              className="text-caption font-semibold text-primary underline hover:text-primary-pressed"
            >
              {translate("school.allProgress")}
            </Link>
          </div>
          <div className="px-4.5 py-4.5">
            <ApiNote what={translate("school.topicsEmpty")} />
          </div>
        </Panel>

        <div className="flex min-w-0 grow basis-full flex-col gap-5 lg:basis-1/3">
          <Panel className="flex flex-col gap-3.5 p-4.5">
            <h2 className="text-body font-semibold">{translate("school.seats")}</h2>
            <div className="flex justify-between text-caption text-admin-soft">
              <span>{translate("school.held")}</span>
              <span className="flex items-center gap-1.5 font-bold text-admin-ink tabular-nums">
                — <span className="font-normal text-admin-soft">{translate("school.of")}</span> —
                <ApiTag />
              </span>
            </div>
            <span className="block h-2 overflow-hidden rounded-full bg-admin-rule" />
            <dl className="flex flex-col gap-2.5 border-t border-admin-rule pt-3">
              <div className="flex justify-between gap-3 text-caption">
                <dt className="text-admin-soft">{translate("school.academicYear")}</dt>
                <dd className="m-0 flex items-center gap-1.5 font-medium">
                  —<ApiTag />
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-caption">
                <dt className="text-admin-soft">{translate("school.contractEnds")}</dt>
                <dd className="m-0 flex items-center gap-1.5 font-medium">
                  —<ApiTag />
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel className="flex flex-col gap-3 p-4.5">
            <h2 className="text-body font-semibold">{translate("school.toDo")}</h2>
            <ApiNote what={translate("school.toDoEmpty")} />
          </Panel>
        </div>
      </div>
    </SchoolPage>
  );
}
