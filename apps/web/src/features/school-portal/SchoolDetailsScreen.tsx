"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import type { MessageKey } from "@keoshaa/i18n";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { formatDay, formatPhone } from "@/features/admin/format";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { SchoolPage } from "./SchoolPage";
import { schoolDetailsSchema, type SchoolDetailsValues } from "./schemas";
import { useMySchools, useOrganisation, useUpdateOrganisation } from "./school-api";
import { Panel, SchoolButton, SchoolTextInput } from "./school-ui";

type Organisation = components["schemas"]["OrganisationRead"];

function statusLabel(status: string, translate: (key: MessageKey) => string): string {
  if (status === "active") return translate("school.statusActive");
  if (status === "suspended") return translate("school.statusSuspended");
  if (status === "closed") return translate("school.statusClosed");
  return status;
}

function detailsValues(organisation: Organisation): SchoolDetailsValues {
  const address = organisation.address;
  return {
    name: organisation.name,
    province: address?.province ?? "",
    district: address?.district ?? "",
    municipality: address?.municipality ?? "",
    ward: address?.ward ?? "",
    contact_phone: organisation.contact_phone ? formatPhone(organisation.contact_phone) : "",
    pan_number: organisation.pan_number ?? "",
    vat_registered: organisation.vat_registered,
  };
}

export function SchoolDetailsScreen({ organisationId }: { organisationId: string }) {
  const { translate } = useMessages();
  const organisation = useOrganisation(organisationId, true);
  const mine = useMySchools();

  if (organisation.isPending) {
    return (
      <SchoolPage title={translate("school.details")}>
        <p className="text-caption text-admin-soft">{translate("ui.loading")}</p>
      </SchoolPage>
    );
  }
  if (organisation.isError || !organisation.data) {
    return (
      <SchoolPage title={translate("school.details")}>
        <p role="alert" className="text-caption text-admin-danger">
          {translate("state.errorMessage")}
        </p>
      </SchoolPage>
    );
  }

  const org = organisation.data;
  return (
    <SchoolPage
      title={translate("school.details")}
      subtitle={translate("school.detailsSubtitle", { name: org.name })}
      badge={
        <span className="rounded-full bg-success-tint px-2.5 py-0.75 text-tag font-semibold text-on-success-tint">
          {translate("school.apiReady")}
        </span>
      }
    >
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex min-w-0 grow basis-full flex-col gap-5 lg:basis-2/3">
          <DetailsForm organisation={org} />
          <TaxForm organisation={org} />
        </div>
        <div className="flex min-w-0 grow basis-full flex-col gap-4 lg:max-w-xs lg:basis-1/3">
          <Panel className="p-4.5">
            <h2 className="mb-3 text-small font-semibold">{translate("school.setByKeoshaa")}</h2>
            <dl className="flex flex-col gap-2.75">
              <div className="flex justify-between gap-3 text-caption">
                <dt className="text-admin-soft">{translate("school.kind")}</dt>
                <dd className="m-0 font-semibold">{translate("school.kindSchool")}</dd>
              </div>
              <div className="flex justify-between gap-3 text-caption">
                <dt className="text-admin-soft">{translate("school.status")}</dt>
                <dd className="m-0">
                  <span className="rounded-full bg-success-tint px-2.25 py-0.5 text-tag font-semibold text-on-success-tint">
                    {statusLabel(org.status, translate)}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-caption">
                <dt className="text-admin-soft">{translate("school.onSince")}</dt>
                <dd className="m-0 tabular-nums">
                  <Since createdAt={org.created_at} />
                </dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-admin-rule pt-3 text-caption text-admin-soft">
              {translate("school.setByNote")}
            </p>
          </Panel>

          <Panel className="p-4.5">
            <h2 className="mb-1 text-small font-semibold">
              {translate("school.schoolsYouHandle")}
            </h2>
            <p className="mb-3 text-caption text-admin-soft">
              {translate("school.schoolsYouHandleBody", {
                count: String(mine.data?.length ?? 0),
              })}
            </p>
            <ul className="flex flex-col gap-2">
              {(mine.data ?? []).map((item) => {
                const current = item.organisation_id === organisationId;
                const roleHint =
                  item.role === "school_admin"
                    ? translate("school.openNow")
                    : translate("school.readOnly");
                return (
                  <li key={item.organisation_id}>
                    {current ? (
                      <div className="rounded-square border border-primary bg-primary-tint px-3.25 py-2.75">
                        <span className="block text-caption font-semibold text-admin-on-tint">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-tag text-admin-on-tint">
                          {(item.title || item.role) + " · " + roleHint}
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-square border border-admin-border px-3.25 py-2.75">
                        <Link
                          href={`/school/${item.organisation_id}`}
                          className="block text-caption font-semibold text-primary underline hover:text-primary-pressed"
                        >
                          {item.name}
                        </Link>
                        <span className="mt-0.5 block text-tag text-admin-soft">
                          {(item.title || item.role) + " · " + roleHint}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </SchoolPage>
  );
}

function Since({ createdAt }: { createdAt: string }) {
  const { locale } = useMessages();
  return <>{formatDay(createdAt, locale)}</>;
}

function DetailsForm({ organisation }: { organisation: Organisation }) {
  const { locale, translate } = useMessages();
  const update = useUpdateOrganisation(organisation.id);
  const form = useForm<SchoolDetailsValues>({
    resolver: zodResolver(schoolDetailsSchema),
    values: detailsValues(organisation),
  });
  const errors = form.formState.errors;
  const text = (message: string | undefined) => fieldText(message, translate);

  return (
    <Panel>
      <div className="border-b border-admin-rule px-5 py-4">
        <h2 className="text-body font-semibold">{translate("school.theSchool")}</h2>
      </div>
      <form
        className="flex flex-col gap-3.5 px-5 py-4.5"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await update.mutateAsync(values);
          } catch (error) {
            recordFormFailure(error, form.setError, translate, locale);
          }
        })}
      >
        <SchoolTextInput
          label={translate("school.name")}
          hint={translate("school.nameHint")}
          maxLength={200}
          error={text(errors.name?.message)}
          {...form.register("name")}
        />
        <SchoolTextInput
          type="tel"
          label={translate("school.contactPhone")}
          error={text(errors.contact_phone?.message)}
          {...form.register("contact_phone")}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SchoolTextInput
            label={translate("school.street")}
            maxLength={100}
            {...form.register("municipality")}
          />
          <SchoolTextInput
            label={translate("school.city")}
            maxLength={100}
            {...form.register("district")}
          />
          <SchoolTextInput
            label={translate("school.province")}
            maxLength={100}
            {...form.register("province")}
          />
        </div>
        <SchoolTextInput
          className="sm:max-w-48"
          label={translate("school.ward")}
          maxLength={20}
          {...form.register("ward")}
        />
        {errors.root?.message ? (
          <p role="alert" className="text-caption text-admin-danger">
            {errors.root.message}
          </p>
        ) : null}
        {update.isSuccess && !form.formState.isDirty ? (
          <p role="status" className="text-caption text-admin-soft">
            {translate("school.saved")}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2.5 border-t border-admin-rule bg-admin-subtle -mx-5 -mb-4.5 mt-1 px-5 py-3.5">
          <SchoolButton tone="quiet" size="lg" type="button" onClick={() => form.reset()}>
            {translate("school.discard")}
          </SchoolButton>
          <SchoolButton type="submit" size="lg" pending={form.formState.isSubmitting}>
            {translate(errors.root?.type === "offline" ? "common.noConnection" : "school.save")}
          </SchoolButton>
        </div>
      </form>
    </Panel>
  );
}

function TaxForm({ organisation }: { organisation: Organisation }) {
  const { locale, translate } = useMessages();
  const update = useUpdateOrganisation(organisation.id);
  const form = useForm<SchoolDetailsValues>({
    resolver: zodResolver(schoolDetailsSchema),
    values: detailsValues(organisation),
  });
  const errors = form.formState.errors;

  return (
    <Panel>
      <div className="border-b border-admin-rule px-5 py-4">
        <h2 className="text-body font-semibold">{translate("school.tax")}</h2>
        <p className="text-caption text-admin-soft">{translate("school.taxBody")}</p>
      </div>
      <form
        className="flex flex-wrap items-start gap-4 px-5 py-4.5"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await update.mutateAsync(values);
          } catch (error) {
            recordFormFailure(error, form.setError, translate, locale);
          }
        })}
      >
        <SchoolTextInput
          className="min-w-0 grow basis-full sm:basis-1/2"
          inputMode="numeric"
          label={translate("school.pan")}
          error={fieldText(errors.pan_number?.message, translate)}
          {...form.register("pan_number")}
        />
        <label className="flex min-w-0 grow basis-full items-start gap-2.5 pt-6 sm:basis-1/2">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-primary"
            {...form.register("vat_registered")}
          />
          <span className="min-w-0">
            <span className="block text-caption font-semibold">
              {translate("school.vatRegistered")}
            </span>
            <span className="block text-tag text-admin-soft">{translate("school.vatHint")}</span>
          </span>
        </label>
        <div className="w-full">
          <SchoolButton type="submit" size="lg" pending={form.formState.isSubmitting}>
            {translate("school.save")}
          </SchoolButton>
        </div>
      </form>
    </Panel>
  );
}
