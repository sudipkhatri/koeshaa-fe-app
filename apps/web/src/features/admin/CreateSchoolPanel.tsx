"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import { NetworkError } from "@keoshaa/core";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { applyFieldErrors, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput } from "./admin-ui";
import { organisationFormSchema, type OrganisationFormValues } from "./organisation-schemas";
import { useCreateOrganisation } from "./organisations-api";

type Organisation = components["schemas"]["OrganisationRead"];
type OrganisationKind = components["schemas"]["OrganisationKind"];
export const ORGANISATION_KINDS: readonly OrganisationKind[] = [
  "school",
  "platform",
  "tutor_practice",
];

const EMPTY: OrganisationFormValues = {
  name: "",
  kind: "school",
  province: "",
  district: "",
  municipality: "",
  ward: "",
  contact_phone: "",
  pan_number: "",
  vat_registered: false,
};

export function CreateSchoolPanel({
  id,
  onCreated,
  onCancel,
}: {
  id: string;
  onCreated: (organisation: Organisation) => void;
  onCancel: () => void;
}) {
  const { locale, translate } = useMessages();
  const create = useCreateOrganisation();
  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationFormSchema),
    defaultValues: EMPTY,
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const errors = form.formState.errors;
  const offline = errors.root?.type === "offline";
  const text = (message: string | undefined) => fieldText(message, translate);

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4.5 rounded-xl border border-admin-border bg-admin-surface px-6 py-5.5"
    >
      <h2 id={`${id}-title`} className="text-body font-semibold">
        {translate("admin.createSchool")}
      </h2>
      <form
        className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            onCreated(await create.mutateAsync(values));
          } catch (error) {
            applyFieldErrors(error, form.setError, translate);
            form.setError("root", {
              type: error instanceof NetworkError ? "offline" : "server",
              message: errorMessage(error, translate, (seconds) =>
                formatRetryTime(seconds, locale),
              ),
            });
          }
        })}
      >
        <AdminTextInput
          className="sm:col-span-2"
          label={translate("admin.name")}
          maxLength={200}
          error={text(errors.name?.message)}
          {...form.register("name")}
        />
        <ChoiceField label={translate("admin.kind")} {...form.register("kind")} value={kind}>
          {ORGANISATION_KINDS.map((item) => (
            <option key={item} value={item}>
              {translate(`admin.organisationKind.${item}`)}
            </option>
          ))}
        </ChoiceField>
        <AdminTextInput
          type="tel"
          label={translate("admin.contactPhone")}
          error={text(errors.contact_phone?.message)}
          {...form.register("contact_phone")}
        />
        <AdminTextInput label={translate("admin.province")} {...form.register("province")} />
        <AdminTextInput label={translate("admin.district")} {...form.register("district")} />
        <AdminTextInput
          label={translate("admin.municipality")}
          {...form.register("municipality")}
        />
        <AdminTextInput label={translate("admin.ward")} {...form.register("ward")} />
        <AdminTextInput
          inputMode="numeric"
          label={translate("admin.pan")}
          hint={translate("admin.panHint")}
          error={text(errors.pan_number?.message)}
          {...form.register("pan_number")}
        />
        <label className="inline-flex min-h-12 items-center gap-2 self-end md:min-h-10">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            {...form.register("vat_registered")}
          />
          {translate("admin.vatRegistered")}
        </label>
        {errors.root?.message ? (
          <p role="alert" className="text-caption text-admin-danger sm:col-span-2">
            {errors.root.message}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <AdminButton type="submit" size="lg" pending={form.formState.isSubmitting}>
            {translate(offline ? "common.noConnection" : "admin.createSchool")}
          </AdminButton>
          <AdminButton tone="quiet" size="lg" onClick={onCancel}>
            {translate("admin.cancel")}
          </AdminButton>
        </div>
      </form>
    </section>
  );
}
