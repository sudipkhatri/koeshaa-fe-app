"use client";

import type { components } from "@keoshaa/api-client";
import Link from "next/link";
import { useState } from "react";

import { ChoiceField } from "@/components/ui/TextField";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput, ApiNote } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import {
  BodyRow,
  ColumnCell,
  ColumnHead,
  DataTable,
  HeadRow,
  StatusPill,
  type PillTone,
} from "./DataTable";
import { formatDay, formatPhone } from "./format";
import { useSchoolLeadsPage } from "./leads-api";
import { QueryGate } from "./QueryGate";
import { TablePager, type RowChoice } from "./TablePager";

type LeadStatus = components["schemas"]["LeadStatus"];

const STATUSES: readonly LeadStatus[] = ["new", "contacted", "won", "lost"];

export function leadTone(status: LeadStatus): PillTone {
  if (status === "contacted") return "sky";
  if (status === "won") return "success";
  if (status === "lost") return "quiet";
  return "primary";
}

export function SchoolLeadsScreen() {
  const { locale, translate } = useMessages();
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [rows, setRows] = useState<RowChoice>(20);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const cursor = cursors[cursors.length - 1] ?? null;
  const page = useSchoolLeadsPage(status === "" ? null : status, rows, cursor);
  const leads = page.data?.items ?? [];
  const nextCursor = page.data?.nextCursor ?? null;
  const restart = () => setCursors([null]);

  return (
    <AdminPage title={translate("admin.leads")} gap="gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <AdminTextInput
          className="grow basis-65"
          type="search"
          label={translate("admin.search")}
          placeholder={translate("admin.searchLeads")}
          disabled
        />
        <div className="w-full sm:w-50">
          <ChoiceField
            label={translate("admin.status")}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as LeadStatus | "");
              restart();
            }}
          >
            <option value="">{translate("admin.allStatuses")}</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {translate(`admin.leadStatus.${item}`)}
              </option>
            ))}
          </ChoiceField>
        </div>
        <div className="w-full sm:w-50">
          <ChoiceField label={translate("admin.assignedTo")} value="" disabled>
            <option value="">{translate("admin.anyone")}</option>
            <option value="none">{translate("admin.nobodyYet")}</option>
          </ChoiceField>
        </div>
        <AdminButton size="lg" disabled>
          {translate("admin.search")}
        </AdminButton>
      </div>
      <ApiNote what={translate("admin.leadsSearchWhat")} />
      <QueryGate
        query={page}
        isEmpty={leads.length === 0 && cursors.length === 1}
        emptyTitle="admin.emptyLeads"
        emptyMessage="admin.emptyLeadsBody"
      >
        <DataTable
          footer={
            <TablePager
              shown={leads.length}
              rows={rows}
              onRows={(next) => {
                setRows(next);
                restart();
              }}
              hasPrevious={cursors.length > 1}
              hasNext={nextCursor !== null}
              pending={page.isFetching}
              onPrevious={() => setCursors((stack) => stack.slice(0, -1))}
              onNext={() => setCursors((stack) => [...stack, nextCursor])}
            />
          }
        >
          <HeadRow>
            <ColumnHead sort="none">{translate("admin.school")}</ColumnHead>
            <ColumnHead>{translate("admin.contact")}</ColumnHead>
            <ColumnHead>{translate("admin.phone")}</ColumnHead>
            <ColumnHead sort="none">{translate("admin.status")}</ColumnHead>
            <ColumnHead>{translate("admin.assignedTo")}</ColumnHead>
            <ColumnHead align="right" sort="descending">
              {translate("admin.created")}
            </ColumnHead>
          </HeadRow>
          <tbody>
            {leads.map((lead) => (
              <BodyRow key={lead.id}>
                <ColumnCell>
                  <Link
                    href={`/admin/school-leads/${lead.id}`}
                    className="font-medium text-primary underline hover:text-primary-pressed"
                  >
                    {lead.school_name}
                  </Link>
                </ColumnCell>
                <ColumnCell>{lead.contact_name}</ColumnCell>
                <ColumnCell muted>
                  <span className="tabular-nums">{formatPhone(lead.phone)}</span>
                </ColumnCell>
                <ColumnCell>
                  <StatusPill tone={leadTone(lead.status)}>
                    {translate(`admin.leadStatus.${lead.status}`)}
                  </StatusPill>
                </ColumnCell>
                <ColumnCell muted={!lead.assigned_name}>
                  {lead.assigned_name || translate("admin.unassigned")}
                </ColumnCell>
                <ColumnCell align="right" muted>
                  {formatDay(lead.created_at, locale)}
                </ColumnCell>
              </BodyRow>
            ))}
          </tbody>
        </DataTable>
      </QueryGate>
    </AdminPage>
  );
}
