"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@keoshaa/core";
import type { components } from "@keoshaa/api-client";
import type { MessageKey } from "@keoshaa/i18n";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { StateView } from "@/components/ui/StateView";
import { recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { StatusPill } from "./DataTable";
import { OrganisationPeople } from "./OrganisationPeople";
import { OrganisationProfileForm } from "./OrganisationProfileForm";
import { organisationStatusLabel, organisationTone } from "./OrganisationsScreen";
import { OrganisationSide } from "./OrganisationSide";
import {
  organisationIdSchema,
  organisationStatusSchema,
  type OrganisationStatusValues,
} from "./organisation-schemas";
import { useOrganisation, useOrganisationStatus } from "./organisations-api";
import { QueryGate } from "./QueryGate";

type Organisation = components["schemas"]["OrganisationRead"];
type OrganisationStatus = components["schemas"]["OrganisationStatus"];
type SectionId = "profile" | "people" | "contract" | "students";

const STATUSES: readonly OrganisationStatus[] = ["active", "suspended", "closed"];
const SECTIONS: readonly { id: SectionId; label: MessageKey }[] = [
  { id: "profile", label: "admin.profile" },
  { id: "people", label: "admin.people" },
  { id: "contract", label: "admin.contract" },
  { id: "students", label: "admin.students" },
];

export function OrganisationScreen({ organisationId }: { organisationId: string }) {
  const valid = organisationIdSchema.safeParse(organisationId).success;
  const organisation = useOrganisation(organisationId, valid);
  const { translate } = useMessages();
  const back = { href: "/admin/organisations", label: translate("admin.organisations") };
  const missing =
    !valid || (organisation.error instanceof ApiError && organisation.error.status === 404);

  if (missing || !organisation.data) {
    return (
      <AdminPage title={translate("admin.organisations")} back={back}>
        {!missing ? (
          <QueryGate
            query={organisation}
            isEmpty
            emptyTitle="admin.notFoundTitle"
            emptyMessage="admin.notFoundBody"
          >
            {null}
          </QueryGate>
        ) : (
          <StateView
            title={translate("admin.notFoundTitle")}
            message={translate("admin.notFoundBody")}
          />
        )}
      </AdminPage>
    );
  }

  return <SchoolDetail organisation={organisation.data} back={back} />;
}

function SchoolDetail({
  organisation,
  back,
}: {
  organisation: Organisation;
  back: { href: string; label: string };
}) {
  const { translate } = useMessages();
  const [section, setSection] = useState<SectionId>("profile");
  const [changing, setChanging] = useState(false);
  const status = STATUSES.find((item) => item === organisation.status) ?? "active";

  return (
    <AdminPage
      title={organisation.name}
      back={back}
      gap="gap-5"
      badge={
        <StatusPill tone={organisationTone(status)}>
          {organisationStatusLabel(status, translate)}
        </StatusPill>
      }
      actions={
        <AdminButton
          tone="quiet"
          aria-expanded={changing}
          onClick={() => setChanging((open) => !open)}
        >
          {translate("admin.changeStatus")}
        </AdminButton>
      }
      tabs={
        <div
          role="tablist"
          aria-label={translate("admin.schoolSections")}
          className="flex gap-5 overflow-x-auto"
        >
          {SECTIONS.map((item) => {
            const current = item.id === section;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={current}
                aria-controls={item.id}
                onClick={() => {
                  setSection(item.id);
                  document.getElementById(item.id)?.scrollIntoView({ block: "start" });
                }}
                className={`cursor-pointer border-b-2 py-2.5 font-semibold whitespace-nowrap ${current ? "border-primary text-admin-ink" : "border-transparent text-admin-soft"}`}
              >
                {translate(item.label)}
              </button>
            );
          })}
        </div>
      }
    >
      {changing ? (
        <StatusForm
          organisationId={organisation.id}
          current={status}
          onClose={() => setChanging(false)}
        />
      ) : null}
      <div className="flex flex-wrap gap-5">
        <div className="flex min-w-0 grow-2 basis-110 flex-col gap-5">
          <OrganisationProfileForm organisation={organisation} />
          <OrganisationPeople organisationId={organisation.id} />
        </div>
        <div className="flex min-w-0 grow basis-70 flex-col gap-5">
          <OrganisationSide />
        </div>
      </div>
    </AdminPage>
  );
}

function StatusForm({
  organisationId,
  current,
  onClose,
}: {
  organisationId: string;
  current: OrganisationStatus;
  onClose: () => void;
}) {
  const { locale, translate } = useMessages();
  const change = useOrganisationStatus(organisationId);
  const form = useForm<OrganisationStatusValues>({
    resolver: zodResolver(organisationStatusSchema),
    values: { status: current },
  });
  const status = useWatch({ control: form.control, name: "status" });
  const offline = form.formState.errors.root?.type === "offline";

  return (
    <form
      aria-label={translate("admin.changeStatus")}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-admin-border bg-admin-surface p-5"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await change.mutateAsync(values);
          onClose();
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <div className="w-full sm:w-50">
        <ChoiceField label={translate("admin.status")} {...form.register("status")} value={status}>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {translate(`admin.organisationStatus.${item}`)}
            </option>
          ))}
        </ChoiceField>
      </div>
      {form.formState.errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <AdminButton type="submit" size="lg" pending={form.formState.isSubmitting}>
        {translate(offline ? "common.noConnection" : "admin.save")}
      </AdminButton>
      <AdminButton tone="quiet" size="lg" onClick={onClose}>
        {translate("admin.cancel")}
      </AdminButton>
    </form>
  );
}
