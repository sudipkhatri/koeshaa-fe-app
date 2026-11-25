"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import { NetworkError } from "@keoshaa/core";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { applyFieldErrors, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, ApiTag } from "./admin-ui";
import { useUpdateSchoolLead } from "./api";
import { formatWhen } from "./format";
import { DetailSection } from "./LeadEnquiry";
import { useAccountName, useStaffChoices, type StaffChoice } from "./lead-detail-api";
import { leadUpdateSchema, type LeadUpdateValues } from "./schemas";

type SchoolLead = components["schemas"]["SchoolLeadRead"];
type LeadStatus = components["schemas"]["LeadStatus"];
const STATUSES: readonly LeadStatus[] = ["new", "contacted", "won", "lost"];

function useAssigneeChoices(
  assignedTo: string | null,
  assignedName: string | null,
): {
  choices: StaffChoice[];
  failed: boolean;
} {
  const staff = useStaffChoices();
  const listed = staff.data ?? [];
  const missing = assignedTo !== null && !listed.some((person) => person.id === assignedTo);
  const name = useAccountName(assignedTo, missing && !staff.isPending && !assignedName);
  if (!missing || assignedTo === null) return { choices: listed, failed: staff.isError };
  return {
    choices: [...listed, { id: assignedTo, name: assignedName ?? name.data ?? assignedTo }],
    failed: staff.isError,
  };
}

export function LeadHandling({ lead }: { lead: SchoolLead }) {
  const { locale, translate } = useMessages();
  const update = useUpdateSchoolLead(lead);
  const assignees = useAssigneeChoices(lead.assigned_to ?? null, lead.assigned_name ?? null);
  const form = useForm<LeadUpdateValues>({
    resolver: zodResolver(leadUpdateSchema),
    values: { status: lead.status, assigned_to: lead.assigned_to ?? "" },
    resetOptions: { keepDirtyValues: true },
  });
  const status = useWatch({ control: form.control, name: "status" });
  const assignedTo = useWatch({ control: form.control, name: "assigned_to" });
  const offline = form.formState.errors.root?.type === "offline";

  return (
    <DetailSection title={translate("admin.handling")}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const saved = await update.mutateAsync(values);
            form.reset({ status: saved.status, assigned_to: saved.assigned_to ?? "" });
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
        <ChoiceField
          label={translate("admin.status")}
          error={fieldText(form.formState.errors.status?.message, translate)}
          {...form.register("status")}
          value={status}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {translate(`admin.leadStatus.${status}`)}
            </option>
          ))}
        </ChoiceField>
        <ChoiceField
          label={translate("admin.assignedTo")}
          error={fieldText(form.formState.errors.assigned_to?.message, translate)}
          {...form.register("assigned_to")}
          value={assignedTo}
        >
          <option value="">{translate("admin.nobodyYet")}</option>
          {assignees.choices.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </ChoiceField>
        {assignees.failed ? (
          <p className="text-caption text-admin-soft">{translate("admin.staffNamesFailed")}</p>
        ) : null}
        {form.formState.errors.root?.message ? (
          <p role="alert" className="text-caption text-admin-danger">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        {update.isSuccess && !form.formState.isDirty ? (
          <p role="status" className="text-caption text-admin-soft">
            {translate("admin.saved")}
          </p>
        ) : null}
        <AdminButton type="submit" size="lg" pending={form.formState.isSubmitting}>
          {translate(offline ? "common.noConnection" : "admin.save")}
        </AdminButton>
      </form>
    </DetailSection>
  );
}

export function LeadHistory({ lead }: { lead: SchoolLead }) {
  const { locale, translate } = useMessages();
  const changed = lead.updated_at !== lead.created_at;
  return (
    <DetailSection title={translate("admin.historyTitle")} aside={<ApiTag />}>
      <ul className="flex flex-col gap-3">
        <li className="flex flex-col gap-0.5">
          <span className="text-caption">{translate("admin.historyCreated")}</span>
          <span className="text-micro text-admin-soft tabular-nums">
            {formatWhen(lead.created_at, locale)}
          </span>
        </li>
        <li className="flex flex-col gap-0.5 border-t border-admin-rule pt-3">
          {changed ? (
            <>
              <span className="text-caption">{translate("admin.historyChanged")}</span>
              <span className="text-micro text-admin-soft tabular-nums">
                {formatWhen(lead.updated_at, locale)}
              </span>
            </>
          ) : (
            <span className="text-caption text-admin-soft">
              {translate("admin.historyNothing")}
            </span>
          )}
        </li>
      </ul>
    </DetailSection>
  );
}
