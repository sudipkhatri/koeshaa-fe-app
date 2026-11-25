"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { MessageKey } from "@keoshaa/i18n";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput } from "./admin-ui";
import { flattenPages } from "./api";
import { BodyRow, ColumnCell, ColumnHead, DataTable, HeadRow, StatusPill } from "./DataTable";
import { formatDay } from "./format";
import { LoadMore, QueryGate } from "./QueryGate";
import {
  lookupAccount,
  useAddMember,
  useMembers,
  useRemoveMember,
  type Member,
} from "./organisations-api";

const ROLES = ["school_admin", "school_staff"] as const;

const addSchema = z.object({
  account: z.string().trim().min(1, { error: "admin.accountInvalid" }),
  role: z.enum(ROLES),
  title: z.string().trim().max(80),
});

type AddValues = z.infer<typeof addSchema>;

function roleLabel(role: string, translate: (key: MessageKey) => string): string {
  if (role === "school_admin" || role === "school_staff") {
    return translate(`admin.memberRole.${role}`);
  }
  return role;
}

export function OrganisationPeople({ organisationId }: { organisationId: string }) {
  const { translate } = useMessages();
  const [adding, setAdding] = useState(false);
  const members = useMembers(organisationId, true);
  const rows = flattenPages(members.data);

  return (
    <section
      id="people"
      className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-admin-rule px-6 py-4">
        <h2 className="grow text-body font-semibold">{translate("admin.people")}</h2>
        <AdminButton tone="quiet" aria-expanded={adding} onClick={() => setAdding((open) => !open)}>
          {translate("admin.addPerson")}
        </AdminButton>
      </div>
      {adding ? (
        <AddPerson organisationId={organisationId} onAdded={() => setAdding(false)} />
      ) : null}
      <QueryGate
        query={members}
        isEmpty={rows.length === 0}
        emptyTitle="admin.emptyPeople"
        emptyMessage="admin.emptyPeopleBody"
        inset
      >
        <DataTable bare roomy minWidth="min-w-140">
          <HeadRow>
            <ColumnHead sort="none">{translate("admin.name")}</ColumnHead>
            <ColumnHead>{translate("admin.role")}</ColumnHead>
            <ColumnHead>{translate("admin.titleLabel")}</ColumnHead>
            <ColumnHead align="right" sort="descending">
              {translate("admin.joined")}
            </ColumnHead>
          </HeadRow>
          <tbody>
            {rows.map((member) => (
              <MemberRow key={member.user_id} organisationId={organisationId} member={member} />
            ))}
          </tbody>
        </DataTable>
        <LoadMore
          hasNextPage={members.hasNextPage}
          pending={members.isFetchingNextPage}
          onLoad={() => void members.fetchNextPage()}
        />
      </QueryGate>
      <p className="px-6 pt-3 pb-4 text-caption text-admin-soft">{translate("admin.peopleNote")}</p>
    </section>
  );
}

function MemberRow({ organisationId, member }: { organisationId: string; member: Member }) {
  const { locale, translate } = useMessages();
  const remove = useRemoveMember(organisationId);
  return (
    <BodyRow>
      <ColumnCell>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{member.name}</span>
          <AdminButton
            tone="quiet"
            size="sm"
            pending={remove.isPending}
            onClick={() => remove.mutate(member.user_id)}
          >
            {translate("admin.remove")}
          </AdminButton>
        </span>
        {remove.error ? (
          <p role="alert" className="text-micro text-admin-danger">
            {errorMessage(remove.error, translate, (seconds) => formatRetryTime(seconds, locale))}
          </p>
        ) : null}
      </ColumnCell>
      <ColumnCell>
        <span className="flex flex-wrap gap-1">
          {member.roles.map((role) => (
            <StatusPill key={role} tone={role === "school_admin" ? "primary" : "quiet"}>
              {roleLabel(role, translate)}
            </StatusPill>
          ))}
        </span>
      </ColumnCell>
      <ColumnCell muted>{member.title || translate("admin.unassigned")}</ColumnCell>
      <ColumnCell align="right" muted>
        {formatDay(member.joined_at, locale)}
      </ColumnCell>
    </BodyRow>
  );
}

function AddPerson({ organisationId, onAdded }: { organisationId: string; onAdded: () => void }) {
  const { locale, translate } = useMessages();
  const add = useAddMember(organisationId);
  const form = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { account: "", role: "school_staff", title: "" },
  });
  const role = useWatch({ control: form.control, name: "role" });
  const errors = form.formState.errors;

  return (
    <form
      className="flex flex-col gap-3 border-b border-admin-rule px-6 py-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const found = await lookupAccount(values.account);
          if ("error" in found) {
            form.setError("account", {
              message: translate(
                found.error === "invalid" ? "admin.accountInvalid" : "admin.noAccount",
              ),
            });
            return;
          }
          await add.mutateAsync({ user_id: found.id, role: values.role, title: values.title });
          form.reset();
          onAdded();
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <p className="text-caption text-admin-soft">{translate("admin.findAccountBody")}</p>
      <div className="flex flex-wrap items-end gap-3">
        <AdminTextInput
          className="grow basis-65"
          label={translate("admin.findAccount")}
          error={fieldText(errors.account?.message, translate)}
          {...form.register("account")}
        />
        <div className="w-full sm:w-50">
          <ChoiceField label={translate("admin.role")} {...form.register("role")} value={role}>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {translate(`admin.memberRole.${item}`)}
              </option>
            ))}
          </ChoiceField>
        </div>
        <AdminTextInput
          className="grow basis-50"
          label={translate("admin.titleLabel")}
          maxLength={80}
          {...form.register("title")}
        />
        <AdminButton type="submit" size="lg" pending={form.formState.isSubmitting}>
          {translate(errors.root?.type === "offline" ? "common.noConnection" : "admin.findAndAdd")}
        </AdminButton>
      </div>
      {errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errors.root.message}
        </p>
      ) : null}
    </form>
  );
}
