"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import { useForm } from "react-hook-form";

import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput } from "./admin-ui";
import { formatPhone } from "./format";
import { organisationFormSchema, type OrganisationFormValues } from "./organisation-schemas";
import { useUpdateOrganisation } from "./organisations-api";

type Organisation = components["schemas"]["OrganisationRead"];

function knownKind(kind: string): OrganisationFormValues["kind"] {
  if (kind === "platform" || kind === "tutor_practice") return kind;
  return "school";
}

function profileValues(organisation: Organisation): OrganisationFormValues {
  const address = organisation.address;
  return {
    name: organisation.name,
    kind: knownKind(organisation.kind),
    province: address?.province ?? "",
    district: address?.district ?? "",
    municipality: address?.municipality ?? "",
    ward: address?.ward ?? "",
    contact_phone: organisation.contact_phone ? formatPhone(organisation.contact_phone) : "",
    pan_number: organisation.pan_number ?? "",
    vat_registered: organisation.vat_registered,
  };
}

export function OrganisationProfileForm({ organisation }: { organisation: Organisation }) {
  const { locale, translate } = useMessages();
  const update = useUpdateOrganisation(organisation.id);
  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationFormSchema),
    values: profileValues(organisation),
  });
  const errors = form.formState.errors;
  const text = (message: string | undefined) => fieldText(message, translate);
  const offline = errors.root?.type === "offline";

  return (
    <section
      id="profile"
      aria-labelledby="profile-title"
      className="flex flex-col gap-4.5 rounded-xl border border-admin-border bg-admin-surface px-6 py-5.5"
    >
      <h2 id="profile-title" className="text-body font-semibold">
        {translate("admin.profile")}
      </h2>
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await update.mutateAsync(values);
          } catch (error) {
            recordFormFailure(error, form.setError, translate, locale);
          }
        })}
      >
        <AdminTextInput
          label={translate("admin.name")}
          maxLength={200}
          error={text(errors.name?.message)}
          {...form.register("name")}
        />
        <AdminTextInput
          type="tel"
          label={translate("admin.contactPhone")}
          error={text(errors.contact_phone?.message)}
          {...form.register("contact_phone")}
        />
        <AdminTextInput
          label={translate("admin.province")}
          maxLength={100}
          error={text(errors.province?.message)}
          {...form.register("province")}
        />
        <AdminTextInput
          label={translate("admin.district")}
          maxLength={100}
          error={text(errors.district?.message)}
          {...form.register("district")}
        />
        <AdminTextInput
          label={translate("admin.municipality")}
          maxLength={100}
          {...form.register("municipality")}
        />
        <AdminTextInput label={translate("admin.ward")} maxLength={20} {...form.register("ward")} />
        <AdminTextInput
          inputMode="numeric"
          label={translate("admin.pan")}
          hint={translate("admin.panHint")}
          error={text(errors.pan_number?.message)}
          {...form.register("pan_number")}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-micro font-semibold tracking-widest text-admin-soft uppercase">
            {translate("admin.billing")}
          </span>
          <label className="flex min-h-12 items-center gap-2.5 rounded-square border border-admin-border px-3 md:min-h-10">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              {...form.register("vat_registered")}
            />
            <span>{translate("admin.vatBills")}</span>
          </label>
        </div>
        {errors.root?.message ? (
          <p role="alert" className="text-caption text-admin-danger sm:col-span-2">
            {errors.root.message}
          </p>
        ) : null}
        {update.isSuccess && !form.formState.isDirty ? (
          <p role="status" className="text-caption text-admin-soft sm:col-span-2">
            {translate("admin.saved")}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2.5 sm:col-span-2">
          <AdminButton type="submit" size="lg" pending={form.formState.isSubmitting}>
            {translate(offline ? "common.noConnection" : "admin.save")}
          </AdminButton>
          <AdminButton tone="quiet" size="lg" onClick={() => form.reset()}>
            {translate("admin.cancel")}
          </AdminButton>
        </div>
      </form>
    </section>
  );
}
