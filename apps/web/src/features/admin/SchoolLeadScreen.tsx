"use client";

import type { components } from "@keoshaa/api-client";
import { ApiError } from "@keoshaa/core";

import { StateView } from "@/components/ui/StateView";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminButtonLink } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { useSchoolLead, useUpdateSchoolLead } from "./api";
import { StatusPill } from "./DataTable";
import { useCreateSchoolFromLead } from "./lead-detail-api";
import { LeadEnquiry, LeadNextSteps } from "./LeadEnquiry";
import { LeadHandling, LeadHistory } from "./LeadHandling";
import { QueryGate } from "./QueryGate";
import { leadTone } from "./SchoolLeadsScreen";
import { leadIdSchema } from "./schemas";

type SchoolLead = components["schemas"]["SchoolLeadRead"];

export function SchoolLeadScreen({ leadId }: { leadId: string }) {
  const valid = leadIdSchema.safeParse(leadId).success;
  const lead = useSchoolLead(leadId, valid);
  const { translate } = useMessages();
  const back = { href: "/admin/school-leads", label: translate("admin.leads") };
  const missing = !valid || (lead.error instanceof ApiError && lead.error.status === 404);

  if (missing || !lead.data) {
    return (
      <AdminPage title={translate("admin.leads")} back={back} gap="gap-5">
        {!missing ? (
          <QueryGate
            query={lead}
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

  return <LeadDetail lead={lead.data} back={back} />;
}

function LeadDetail({ lead, back }: { lead: SchoolLead; back: { href: string; label: string } }) {
  const { locale, translate } = useMessages();
  const contacted = useUpdateSchoolLead(lead);
  const createSchool = useCreateSchoolFromLead(lead);
  const failure = contacted.error ?? createSchool.error;
  const busy = contacted.isPending || createSchool.isPending;

  return (
    <AdminPage
      title={lead.school_name}
      back={back}
      gap="gap-5"
      badge={
        <StatusPill tone={leadTone(lead.status)}>
          {translate(`admin.leadStatus.${lead.status}`)}
        </StatusPill>
      }
      actions={
        <>
          {lead.status === "new" ? (
            <AdminButton
              tone="quiet"
              disabled={busy}
              pending={contacted.isPending}
              onClick={() => contacted.mutate({ status: "contacted" })}
            >
              {translate("admin.markContacted")}
            </AdminButton>
          ) : null}
          {lead.organisation_id ? (
            <AdminButtonLink href={`/admin/organisations/${lead.organisation_id}`}>
              {translate("admin.openTheSchool")}
            </AdminButtonLink>
          ) : (
            <AdminButton
              disabled={busy}
              pending={createSchool.isPending}
              onClick={() => createSchool.mutate()}
            >
              {translate("admin.createTheSchool")}
            </AdminButton>
          )}
        </>
      }
    >
      {failure ? (
        <p
          role="alert"
          className="rounded-xl border border-admin-danger-line bg-admin-danger-soft px-4 py-3 text-caption text-admin-danger"
        >
          {errorMessage(failure, translate, (seconds) => formatRetryTime(seconds, locale))}
        </p>
      ) : null}
      {createSchool.isSuccess ? (
        <p role="status" className="text-caption text-admin-soft">
          {translate("admin.schoolCreated")}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-5">
        <div className="flex min-w-0 grow-2 basis-110 flex-col gap-5">
          <LeadEnquiry lead={lead} />
          <LeadNextSteps lead={lead} />
        </div>
        <div className="flex min-w-0 grow basis-70 flex-col gap-5">
          <LeadHandling lead={lead} />
          <LeadHistory lead={lead} />
        </div>
      </div>
    </AdminPage>
  );
}
