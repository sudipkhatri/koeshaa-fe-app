"use client";

import type { components } from "@keoshaa/api-client";
import type { MessageKey } from "@keoshaa/i18n";
import Link from "next/link";
import { useState } from "react";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput, ApiNote } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { CreateSchoolPanel, ORGANISATION_KINDS } from "./CreateSchoolPanel";
import {
  BodyRow,
  ColumnCell,
  ColumnHead,
  DataTable,
  HeadRow,
  StatusPill,
  type PillTone,
} from "./DataTable";
import { formatDay } from "./format";
import { useOrganisationsPage } from "./organisations-api";
import { QueryGate } from "./QueryGate";
import { SchoolCards } from "./SchoolCards";
import { TablePager, type RowChoice } from "./TablePager";

type Organisation = components["schemas"]["OrganisationRead"];
type OrganisationKind = components["schemas"]["OrganisationKind"];
type Translate = (key: MessageKey) => string;

const CREATE_PANEL_ID = "create-school";

export function OrganisationsScreen() {
  const { translate } = useMessages();
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Organisation | null>(null);

  return (
    <AdminPage
      title={translate("admin.organisations")}
      actions={
        <AdminButton
          aria-expanded={creating}
          aria-controls={creating ? CREATE_PANEL_ID : undefined}
          onClick={() => setCreating((open) => !open)}
        >
          {translate("admin.createSchool")}
        </AdminButton>
      }
    >
      {creating ? (
        <CreateSchoolPanel
          id={CREATE_PANEL_ID}
          onCancel={() => setCreating(false)}
          onCreated={(organisation) => {
            setCreated(organisation);
            setCreating(false);
          }}
        />
      ) : null}
      {created ? (
        <p role="status" className="text-caption text-admin-soft">
          {translate("admin.schoolCreatedNamed", { name: created.name })}{" "}
          <Link
            href={`/admin/organisations/${created.id}`}
            className="font-semibold text-primary underline hover:text-primary-pressed"
          >
            {translate("admin.openTheSchool")}
          </Link>
        </p>
      ) : null}
      <SchoolCards />
      <AllOrganisations />
    </AdminPage>
  );
}

function AllOrganisations() {
  const { locale, translate } = useMessages();
  const [kind, setKind] = useState<OrganisationKind | "">("school");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<RowChoice>(20);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const cursor = cursors[cursors.length - 1] ?? null;
  const page = useOrganisationsPage(kind === "" ? null : kind, query, rows, cursor);
  const organisations = page.data?.items ?? [];
  const nextCursor = page.data?.nextCursor ?? null;
  const restart = () => setCursors([null]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-body font-semibold">{translate("admin.allOrganisations")}</h2>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(draft.trim());
          restart();
        }}
      >
        <AdminTextInput
          className="grow basis-65"
          type="search"
          maxLength={100}
          label={translate("admin.searchSchools")}
          placeholder={translate("admin.searchSchoolsExample")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="w-full sm:w-50">
          <ChoiceField
            label={translate("admin.kind")}
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as OrganisationKind | "");
              restart();
            }}
          >
            {ORGANISATION_KINDS.map((item) => (
              <option key={item} value={item}>
                {translate(`admin.organisationKind.${item}`)}
              </option>
            ))}
            <option value="">{translate("admin.allKinds")}</option>
          </ChoiceField>
        </div>
        <AdminButton type="submit" size="lg">
          {translate("admin.search")}
        </AdminButton>
      </form>
      <ApiNote what={translate("admin.schoolsSortWhat")} />
      <QueryGate
        query={page}
        isEmpty={organisations.length === 0 && cursors.length === 1}
        emptyTitle="admin.emptyOrganisations"
        emptyMessage="admin.emptyOrganisationsBody"
      >
        <DataTable
          footer={
            <TablePager
              shown={organisations.length}
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
            <ColumnHead sort="none">{translate("admin.name")}</ColumnHead>
            <ColumnHead>{translate("admin.kind")}</ColumnHead>
            <ColumnHead>{translate("admin.district")}</ColumnHead>
            <ColumnHead align="right" sort="none">
              {translate("admin.seats")}
            </ColumnHead>
            <ColumnHead sort="none">{translate("admin.status")}</ColumnHead>
            <ColumnHead align="right" sort="descending">
              {translate("admin.created")}
            </ColumnHead>
          </HeadRow>
          <tbody>
            {organisations.map((organisation) => (
              <BodyRow key={organisation.id}>
                <ColumnCell>
                  <Link
                    href={`/admin/organisations/${organisation.id}`}
                    className="font-medium text-primary underline hover:text-primary-pressed"
                  >
                    {organisation.name}
                  </Link>
                </ColumnCell>
                <ColumnCell muted>{kindLabel(organisation.kind, translate)}</ColumnCell>
                <ColumnCell muted>
                  {organisation.address?.district || translate("admin.unassigned")}
                </ColumnCell>
                <ColumnCell align="right" muted>
                  {translate("admin.unassigned")}
                </ColumnCell>
                <ColumnCell>
                  <StatusPill tone={organisationTone(organisation.status)}>
                    {organisationStatusLabel(organisation.status, translate)}
                  </StatusPill>
                </ColumnCell>
                <ColumnCell align="right" muted>
                  {formatDay(organisation.created_at, locale)}
                </ColumnCell>
              </BodyRow>
            ))}
          </tbody>
        </DataTable>
      </QueryGate>
    </section>
  );
}

export function organisationTone(status: string): PillTone {
  if (status === "suspended") return "reward";
  if (status === "closed") return "quiet";
  return "success";
}

export function organisationStatusLabel(status: string, translate: Translate): string {
  if (status === "active" || status === "suspended" || status === "closed") {
    return translate(`admin.organisationStatus.${status}`);
  }
  return status;
}

function kindLabel(kind: string, translate: Translate): string {
  if (kind === "school" || kind === "platform" || kind === "tutor_practice") {
    return translate(`admin.organisationKind.${kind}`);
  }
  return kind;
}
