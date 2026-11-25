"use client";

import type { components } from "@keoshaa/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { fieldText, recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput } from "./admin-ui";
import { availabilitySchema, type AvailabilityValues } from "./subject-schemas";
import { useSetAvailability } from "./subjects-api";

type Subject = components["schemas"]["SubjectRead"];
type Availability = components["schemas"]["AvailabilityRead"];

const STATUSES = ["available", "partial", "coming_soon"] as const;

const statusKey = {
  available: "admin.availabilityAvailable",
  partial: "admin.availabilityPartial",
  coming_soon: "admin.availabilitySoon",
} as const;

export function AvailabilityEditor({
  subject,
  availability,
}: {
  subject: Subject;
  availability: Availability | null;
}) {
  const { locale, translate } = useMessages();
  const save = useSetAvailability(subject.grade_level_id, subject.id);
  const form = useForm<AvailabilityValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      status: availability?.status ?? "available",
      expectedOn: availability?.expected_on ?? "",
    },
  });
  const errors = form.formState.errors;
  const [status, setStatus] = useState<AvailabilityValues["status"]>(
    availability?.status ?? "available",
  );

  return (
    <section className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <div className="border-b border-admin-rule px-5 py-4">
        <h2 className="text-body font-semibold">
          {translate("admin.availabilityTitle", { name: subject.name })}
        </h2>
        <p className="mt-1 text-caption text-admin-soft">{translate("admin.availabilityHelp")}</p>
      </div>
      <form
        noValidate
        className="flex flex-wrap items-end gap-3.5 px-5 py-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await save.mutateAsync(values);
          } catch (error) {
            recordFormFailure(error, form.setError, translate, locale);
          }
        })}
      >
        <fieldset className="min-w-0 grow basis-110 border-0 p-0">
          <legend className="pb-2 text-caption font-semibold">{translate("admin.status")}</legend>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((option) => {
              const checked = status === option;
              return (
                <label
                  key={option}
                  className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border px-3 md:min-h-0 md:py-2 ${checked ? "border-primary bg-primary-tint font-semibold" : "border-admin-border"}`}
                >
                  <input
                    type="radio"
                    className="size-4 accent-primary"
                    value={option}
                    {...form.register("status", {
                      onChange: (event) => {
                        const next = event.target.value;
                        if (next === "available" || next === "partial" || next === "coming_soon") {
                          setStatus(next);
                        }
                      },
                    })}
                  />
                  <span className="text-caption">{translate(statusKey[option])}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <AdminTextInput
          label={translate("admin.expectedOn")}
          type="date"
          className="w-full sm:w-45"
          error={fieldText(errors.expectedOn?.message, translate)}
          {...form.register("expectedOn")}
        />
        <AdminButton type="submit" pending={form.formState.isSubmitting}>
          {translate(errors.root?.type === "offline" ? "common.noConnection" : "admin.save")}
        </AdminButton>
        {errors.root?.message ? (
          <p role="alert" className="basis-full text-caption text-admin-danger">
            {errors.root.message}
          </p>
        ) : null}
      </form>
      <div className="border-t border-admin-rule bg-admin-page px-5 py-3">
        <p className="text-caption text-admin-soft">{translate("admin.availabilityFoot")}</p>
      </div>
    </section>
  );
}
