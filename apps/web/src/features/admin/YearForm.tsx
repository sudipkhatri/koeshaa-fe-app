"use client";

import type { components } from "@keoshaa/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { fieldText, recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput } from "./admin-ui";
import { useCreateYear, useUpdateYear } from "./curriculum-api";
import { yearSchema, type YearValues } from "./curriculum-schemas";

type Year = components["schemas"]["AcademicYearRead"];

export function YearForm({ year, onDone }: { year?: Year; onDone: () => void }) {
  const { locale, translate } = useMessages();
  const create = useCreateYear();
  const update = useUpdateYear(year?.id ?? "");
  const form = useForm<YearValues>({
    resolver: zodResolver(yearSchema),
    defaultValues: {
      label: year?.label ?? "",
      startsOn: year?.starts_on ?? "",
      endsOn: year?.ends_on ?? "",
    },
  });
  const errors = form.formState.errors;
  const editing = Boolean(year);

  return (
    <form
      noValidate
      aria-label={translate(editing ? "admin.editDates" : "admin.addYear")}
      className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-5"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          if (year) await update.mutateAsync(values);
          else await create.mutateAsync(values);
          onDone();
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <AdminTextInput
        label={translate("admin.year")}
        error={fieldText(errors.label?.message, translate)}
        {...form.register("label")}
      />
      <div className="flex flex-wrap gap-4">
        <AdminTextInput
          label={translate("admin.startsOn")}
          type="date"
          className="w-full sm:w-45"
          error={fieldText(errors.startsOn?.message, translate)}
          {...form.register("startsOn")}
        />
        <AdminTextInput
          label={translate("admin.endsOn")}
          type="date"
          className="w-full sm:w-45"
          error={fieldText(errors.endsOn?.message, translate)}
          {...form.register("endsOn")}
        />
      </div>
      {errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errors.root.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2.5">
        <AdminButton type="submit" pending={form.formState.isSubmitting}>
          {translate(
            errors.root?.type === "offline"
              ? "common.noConnection"
              : editing
                ? "admin.save"
                : "admin.addYear",
          )}
        </AdminButton>
        <AdminButton type="button" tone="quiet" onClick={onDone}>
          {translate("admin.cancel")}
        </AdminButton>
      </div>
    </form>
  );
}
