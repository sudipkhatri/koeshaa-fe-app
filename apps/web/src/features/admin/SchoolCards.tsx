"use client";

import { ApiError } from "@keoshaa/core";
import Link from "next/link";

import { useMessages } from "@/lib/locale";

import { ApiTag } from "./admin-ui";
import { useMySchools } from "./organisations-api";
import { QueryGate } from "./QueryGate";

const AVATAR_TONES = [
  "bg-primary-tint text-admin-on-tint",
  "bg-sky-tint text-on-sky-tint",
  "bg-reward-tint text-on-reward-tint",
] as const;

export function SchoolCards() {
  const { translate } = useMessages();
  const mine = useMySchools();
  if (mine.error instanceof ApiError && mine.error.status === 403) return null;
  const schools = mine.data ?? [];
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-body font-semibold">{translate("admin.yourSchools")}</h2>
      <QueryGate
        query={mine}
        isEmpty={schools.length === 0}
        emptyTitle="admin.emptyMySchools"
        emptyMessage="admin.emptyMySchoolsBody"
      >
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((school, index) => (
            <li key={school.organisation_id} className="min-w-0">
              <Link
                href={`/admin/organisations/${school.organisation_id}`}
                className="flex h-full flex-col gap-2.5 rounded-xl border border-admin-border bg-admin-surface px-4.5 py-4 text-admin-ink hover:border-admin-dashed"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`flex size-8.5 shrink-0 items-center justify-center rounded-lg font-bold ${AVATAR_TONES[index % AVATAR_TONES.length]}`}
                  >
                    {school.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 truncate font-semibold">{school.name}</span>
                </span>
                <span className="flex flex-col gap-1.25">
                  <span className="flex justify-between text-caption text-admin-soft">
                    <span>{translate("admin.seatsHeld")}</span>
                    <span className="font-semibold text-admin-ink tabular-nums">— / —</span>
                  </span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-admin-rule" />
                  <ApiTag />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </QueryGate>
    </section>
  );
}
