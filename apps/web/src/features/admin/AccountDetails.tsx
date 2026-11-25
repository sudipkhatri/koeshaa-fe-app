"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { accountDetailsSchema, type AccountDetailsValues } from "./account-schemas";
import { useUpdateUser } from "./account-detail-api";
import { AdminButton, AdminTextInput, FieldLabel } from "./admin-ui";
import { formatDay } from "./format";

type User = components["schemas"]["UserRead"];
const LOCALES = ["en", "ne"] as const;

export function AccountDetails({ user }: { user: User }) {
  const { locale, translate } = useMessages();
  const update = useUpdateUser(user.id);
  const form = useForm<AccountDetailsValues>({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: {
      name: user.name,
      locale: user.locale,
      dateOfBirth: user.date_of_birth ?? "",
    },
  });
  const pageLocale = useWatch({ control: form.control, name: "locale" });
  const errors = form.formState.errors;
  const locales = LOCALES.includes(user.locale as (typeof LOCALES)[number])
    ? LOCALES
    : ([user.locale, ...LOCALES] as string[]);

  return (
    <section className="flex flex-col gap-4.5 rounded-xl border border-admin-border bg-admin-surface px-6 py-5.5">
      <h2 className="text-body font-semibold">{translate("admin.details")}</h2>
      <form
        noValidate
        className="flex flex-col gap-4.5"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const saved = await update.mutateAsync(values);
            form.reset({
              name: saved.name,
              locale: saved.locale,
              dateOfBirth: saved.date_of_birth ?? "",
            });
          } catch (error) {
            recordFormFailure(error, form.setError, translate, locale);
          }
        })}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminTextInput
            label={translate("admin.name")}
            maxLength={200}
            error={fieldText(errors.name?.message, translate)}
            {...form.register("name")}
          />
          <ChoiceField
            label={translate("admin.language")}
            value={pageLocale}
            onChange={(event) => form.setValue("locale", event.target.value, { shouldDirty: true })}
          >
            {locales.map((item) => (
              <option key={item} value={item}>
                {item === "en"
                  ? translate("auth.english")
                  : item === "ne"
                    ? translate("auth.nepali")
                    : item}
              </option>
            ))}
          </ChoiceField>
          <AdminTextInput
            label={translate("admin.dateOfBirth")}
            type="date"
            hint={
              user.dob_source
                ? translate("admin.dobSource", { source: user.dob_source })
                : translate("admin.dobHint")
            }
            error={fieldText(errors.dateOfBirth?.message, translate)}
            {...form.register("dateOfBirth")}
          />
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={`${user.id}-created`}>{translate("admin.createdBy")}</FieldLabel>
            <p id={`${user.id}-created`} className="flex min-h-10 items-center">
              {translate("admin.createdByLine", {
                source: user.source,
                date: formatDay(user.created_at, locale),
              })}
            </p>
          </div>
        </div>
        {errors.root?.message ? (
          <p role="alert" className="text-caption text-admin-danger">
            {errors.root.message}
          </p>
        ) : null}
        {update.isSuccess ? (
          <p role="status" className="text-caption text-admin-soft">
            {translate("admin.saved")}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2.5">
          <AdminButton type="submit" size="lg" pending={form.formState.isSubmitting}>
            {translate(errors.root?.type === "offline" ? "common.noConnection" : "admin.save")}
          </AdminButton>
          <AdminButton
            type="button"
            tone="quiet"
            size="lg"
            onClick={() =>
              form.reset({
                name: user.name,
                locale: user.locale,
                dateOfBirth: user.date_of_birth ?? "",
              })
            }
          >
            {translate("admin.cancel")}
          </AdminButton>
        </div>
      </form>
    </section>
  );
}
