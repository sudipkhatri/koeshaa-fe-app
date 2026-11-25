"use client";

import type { MessageKey } from "@keoshaa/i18n";
import Link from "next/link";

import { useMessages } from "@/lib/locale";

import { SchoolPage } from "./SchoolPage";
import { ApiNote } from "./school-ui";

export function SchoolStubScreen({
  organisationId,
  titleKey,
  noteKey,
}: {
  organisationId: string;
  titleKey: MessageKey;
  noteKey: MessageKey;
}) {
  const { translate } = useMessages();
  return (
    <SchoolPage
      title={translate(titleKey)}
      actions={
        <Link
          href={`/school/${organisationId}/import`}
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4.5 font-semibold text-on-primary md:h-10 md:min-h-0"
        >
          {translate("school.addStudents")}
        </Link>
      }
    >
      <ApiNote what={translate(noteKey)} />
    </SchoolPage>
  );
}
