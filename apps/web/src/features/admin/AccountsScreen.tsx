"use client";

import type { components } from "@keoshaa/api-client";
import { normaliseIdentifier, normalisePhone } from "@keoshaa/core";
import type { MessageKey } from "@keoshaa/i18n";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { useMessages } from "@/lib/locale";

import { FIND_BY, type FindBy } from "./account-schemas";
import { AccountRow } from "./AccountRow";
import { useAccountsPage, useOpenDuplicateCount } from "./accounts-api";
import { AdminButton, AdminButtonLink, AdminTextInput, ApiTag } from "./admin-ui";
import { AdminIcon } from "./AdminIcon";
import { AdminPage } from "./AdminPage";
import { CreateAccountPanel } from "./CreateAccountPanel";
import { ColumnHead, DataTable, HeadRow } from "./DataTable";
import { QueryGate } from "./QueryGate";
import { TablePager, type RowChoice } from "./TablePager";

type User = components["schemas"]["UserRead"];
type AccountKind = components["schemas"]["AccountKind"];
type IdentifierKind = components["schemas"]["IdentifierKind"];
type SortColumn = "name" | "created";
type Direction = "ascending" | "descending";

const CREATE_ID = "create-account";
const identifierError: Record<Exclude<FindBy, "name">, MessageKey> = {
  phone: "admin.invalidPhone",
  email: "admin.invalidEmail",
  username: "admin.invalidUsername",
  google: "admin.identifierRequired",
};

type Applied = {
  kind: "" | AccountKind;
  name: string | null;
  identifierKind: IdentifierKind | null;
  identifier: string | null;
};

const EMPTY_SEARCH: Applied = { kind: "", name: null, identifierKind: null, identifier: null };

function normalised(findBy: Exclude<FindBy, "name">, raw: string): string | null {
  if (findBy === "google") return raw.trim() || null;
  if (findBy === "phone") return normalisePhone(raw);
  const parsed = normaliseIdentifier(raw);
  return parsed?.kind === findBy ? parsed.value : null;
}

function ordered(users: readonly User[], column: SortColumn, direction: Direction): User[] {
  const sorted = [...users].sort((left, right) => {
    const value = (user: User) => (column === "created" ? user.created_at : user.name);
    return value(left).localeCompare(value(right));
  });
  return direction === "descending" ? sorted.reverse() : sorted;
}

export function AccountsScreen() {
  const { locale, translate } = useMessages();
  const duplicates = useOpenDuplicateCount();
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<User | null>(null);
  const [findBy, setFindBy] = useState<FindBy>("phone");
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"" | AccountKind>("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [applied, setApplied] = useState<Applied>(EMPTY_SEARCH);
  const [rows, setRows] = useState<RowChoice>(20);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [sort, setSort] = useState<{ column: SortColumn; direction: Direction }>({
    column: "created",
    direction: "descending",
  });
  const cursor = cursors[cursors.length - 1] ?? null;
  const page = useAccountsPage(
    applied.kind === "" ? null : applied.kind,
    applied.name,
    applied.identifierKind,
    applied.identifier,
    rows,
    cursor,
  );
  const users = page.data?.items;
  const nextCursor = page.data?.nextCursor ?? null;
  const shown = useMemo(() => ordered(users ?? [], sort.column, sort.direction), [users, sort]);
  const searching = applied.name !== null || applied.identifier !== null;
  const duplicateCount = duplicates.data;

  function apply(event: { preventDefault: () => void }) {
    event.preventDefault();
    const trimmed = text.trim();
    if (trimmed && findBy !== "name") {
      const identifier = normalised(findBy, trimmed);
      if (!identifier) {
        setError(identifierError[findBy]);
        return;
      }
      setError(null);
      setApplied({ kind, name: null, identifierKind: findBy, identifier });
    } else {
      setError(null);
      setApplied({
        kind,
        name: findBy === "name" && trimmed ? trimmed : null,
        identifierKind: null,
        identifier: null,
      });
    }
    setCursors([null]);
  }

  function toggleSort(column: SortColumn) {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === "ascending" ? "descending" : "ascending" }
        : { column, direction: column === "created" ? "descending" : "ascending" },
    );
  }

  return (
    <AdminPage
      title={translate("admin.accounts")}
      gap="gap-4"
      actions={
        <>
          <AdminButtonLink href="/admin/duplicates" tone="quiet">
            {translate("admin.duplicates")}
            {duplicateCount && duplicateCount.count > 0 ? (
              <span className="inline-flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full bg-reward-tint px-1 text-tag font-bold text-on-reward-tint">
                {duplicateCount.hasMore
                  ? translate("admin.countMore", { count: duplicateCount.count })
                  : duplicateCount.count}
              </span>
            ) : null}
          </AdminButtonLink>
          <AdminButton
            aria-expanded={creating}
            aria-controls={creating ? CREATE_ID : undefined}
            onClick={() => setCreating((open) => !open)}
          >
            {translate("admin.createAccount")}
          </AdminButton>
        </>
      }
    >
      {creating ? (
        <CreateAccountPanel
          id={CREATE_ID}
          onCancel={() => setCreating(false)}
          onCreated={(user) => {
            setCreating(false);
            setCreated(user);
          }}
        />
      ) : null}
      {created ? (
        <p role="status" className="text-caption text-admin-soft">
          <Link
            href={`/admin/accounts/${created.id}`}
            className="font-semibold text-primary underline hover:text-primary-pressed"
          >
            {translate("admin.accountCreated", { name: created.name })}
          </Link>
        </p>
      ) : null}
      <div className="flex gap-3 rounded-xl bg-primary-tint px-4 py-3.5 text-admin-on-tint">
        <AdminIcon name="info" className="mt-px size-5 shrink-0" />
        <p>{translate("admin.accountSearchHow")}</p>
      </div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={apply}>
        <div className="w-full sm:w-47.5">
          <ChoiceField
            label={translate("admin.findBy")}
            value={findBy}
            onChange={(event) => setFindBy(event.target.value as FindBy)}
          >
            {FIND_BY.map((item) => (
              <option key={item} value={item}>
                {translate(`admin.findByOption.${item}`)}
              </option>
            ))}
          </ChoiceField>
        </div>
        <AdminTextInput
          className="grow basis-65"
          type="search"
          label={translate(
            findBy === "phone" ? "admin.phoneNumber" : `admin.findByOption.${findBy}`,
          )}
          value={text}
          error={error ? translate(error) : undefined}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="w-full sm:w-45">
          <ChoiceField
            label={translate("admin.accountKind")}
            value={kind}
            onChange={(event) => setKind(event.target.value as "" | AccountKind)}
          >
            <option value="">{translate("admin.anyone")}</option>
            <option value="member">{translate("admin.userKind.member")}</option>
            <option value="staff">{translate("admin.userKind.staff")}</option>
          </ChoiceField>
        </div>
        <AdminButton type="submit" size="lg">
          {translate("admin.search")}
        </AdminButton>
      </form>
      <QueryGate
        query={page}
        isEmpty={shown.length === 0 && cursors.length === 1}
        emptyTitle="admin.emptyAccounts"
        emptyMessage={searching ? "admin.emptyAccountsSearch" : "admin.emptyAccountsBody"}
      >
        <DataTable
          minWidth="min-w-235"
          footer={
            <TablePager
              shown={shown.length}
              rows={rows}
              onRows={(next) => {
                setRows(next);
                setCursors([null]);
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
            <ColumnHead
              sort={sort.column === "name" ? sort.direction : "none"}
              onSort={() => toggleSort("name")}
            >
              {translate("admin.name")}
            </ColumnHead>
            <ColumnHead>{translate("admin.signsInWith")}</ColumnHead>
            <ColumnHead>{translate("admin.kind")}</ColumnHead>
            <ColumnHead>
              <span className="inline-flex items-center gap-2">
                {translate("admin.capacity")}
                <ApiTag />
              </span>
            </ColumnHead>
            <ColumnHead>{translate("admin.status")}</ColumnHead>
            <ColumnHead
              align="right"
              sort={sort.column === "created" ? sort.direction : "none"}
              onSort={() => toggleSort("created")}
            >
              {translate("admin.created")}
            </ColumnHead>
          </HeadRow>
          <tbody>
            {shown.map((user) => (
              <AccountRow
                key={user.id}
                user={user}
                prefer={applied.identifierKind}
                locale={locale}
              />
            ))}
          </tbody>
        </DataTable>
      </QueryGate>
      <p className="text-caption text-admin-soft">
        {translate("admin.capacityNote")}{" "}
        <strong className="font-semibold text-admin-ink">{translate("admin.kind")}</strong>{" "}
        {translate("admin.capacityNoteStored")}
      </p>
    </AdminPage>
  );
}
