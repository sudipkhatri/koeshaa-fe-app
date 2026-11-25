"use client";

import type { components } from "@keoshaa/api-client";
import Link from "next/link";
import { useState } from "react";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput, ApiNote } from "./admin-ui";

const FORM_ID = "add-question";

export function ReviewBox({
  schools,
  schoolId,
  onSchool,
}: {
  schools: components["schemas"]["MySchoolRead"][];
  schoolId: string;
  onSchool: (schoolId: string) => void;
}) {
  const { translate } = useMessages();
  const [checkedBy, setCheckedBy] = useState("");
  const [reference, setReference] = useState("");
  return (
    <section className="overflow-hidden rounded-xl border border-reward bg-admin-surface">
      <div className="bg-reward-tint px-5 py-4">
        <h2 className="text-body font-semibold">{translate("admin.alreadyReviewed")}</h2>
        <p className="mt-1.5 text-caption text-on-reward-tint">
          {translate("admin.alreadyReviewedBody")}
        </p>
      </div>
      <div className="flex flex-col gap-3 px-5 py-4">
        {schools.length > 1 ? (
          <ChoiceField
            label={translate("admin.school")}
            value={schoolId}
            onChange={(event) => onSchool(event.target.value)}
          >
            {schools.map((school) => (
              <option key={school.organisation_id} value={school.organisation_id}>
                {school.name}
              </option>
            ))}
          </ChoiceField>
        ) : null}
        <AdminTextInput
          label={translate("admin.checkedBy")}
          value={checkedBy}
          onChange={(event) => setCheckedBy(event.target.value)}
        />
        <AdminTextInput
          label={translate("admin.reference")}
          hint={translate("admin.referenceHint")}
          value={reference}
          onChange={(event) => setReference(event.target.value)}
        />
        <ApiNote what={translate("admin.reviewFieldsNote")} />
      </div>
    </section>
  );
}

export function WhatSavingDoes({
  version,
  pending,
  offline,
}: {
  version: number | undefined;
  pending: boolean;
  offline: boolean;
}) {
  const { translate } = useMessages();
  const versionText = version === undefined ? "—" : String(version);
  const label =
    version === undefined
      ? translate("admin.addTheQuestion")
      : translate("admin.addToVersion", { version: versionText });
  return (
    <section className="rounded-xl border border-admin-border bg-admin-surface px-5 py-4">
      <h2 className="mb-2.5 text-body font-semibold">{translate("admin.whatSavingDoes")}</h2>
      <ol className="flex list-decimal flex-col gap-2 pl-4.5 text-caption">
        <li>{translate("admin.saveStepCreate")}</li>
        <li>{translate("admin.saveStepRelease", { version: versionText })}</li>
        <li>{translate("admin.saveStepReview")}</li>
        <li>
          {translate("admin.saveStepPublishBefore")}{" "}
          <Link href="/admin/releases" className="font-semibold text-primary">
            {translate("admin.releases")}
          </Link>
          {translate("admin.saveStepPublishAfter")}
        </li>
      </ol>
      <p className="mt-3.5 rounded-xl bg-reward-tint px-3.5 py-3 text-caption text-on-reward-tint">
        {translate("admin.saveStepOpen")}
      </p>
      <div className="mt-4 flex gap-2.5">
        <Link
          href="/admin/content"
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-admin-border px-4 font-semibold md:min-h-10"
        >
          {translate("admin.cancel")}
        </Link>
        <AdminButton
          type="submit"
          form={FORM_ID}
          className="grow"
          pending={pending}
          disabled={pending}
        >
          {offline ? translate("common.noConnection") : label}
        </AdminButton>
      </div>
    </section>
  );
}
