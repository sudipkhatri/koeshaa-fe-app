"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { errorMessage, formatRetryTime } from "@/lib/errors";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { formatDay } from "@/features/admin/format";

import { SchoolPage } from "./SchoolPage";
import {
  canDoLabel,
  lookupAccount,
  useAddMember,
  useMe,
  useMembersPage,
  useMySchools,
  useRemoveMember,
  type Member,
} from "./school-api";
import { ApiTag, Panel, SchoolButton, SchoolTextInput } from "./school-ui";

const addSchema = z.object({
  account: z.string().trim().min(1, { error: "school.accountInvalid" }),
  title: z.string().trim().max(80),
});

type AddValues = z.infer<typeof addSchema>;

export function SchoolPeopleScreen({ organisationId }: { organisationId: string }) {
  const { translate } = useMessages();
  const mine = useMySchools();
  const school = mine.data?.find((item) => item.organisation_id === organisationId);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const cursor = cursorStack[cursorStack.length - 1] ?? null;
  const members = useMembersPage(organisationId, cursor, true);
  const rows = members.data?.items ?? [];
  const [adding, setAdding] = useState(false);

  return (
    <SchoolPage
      title={translate("school.people")}
      subtitle={translate("school.peopleSubtitle", { name: school?.name ?? "—" })}
      badge={
        <span className="rounded-full bg-success-tint px-2.5 py-0.75 text-tag font-semibold text-on-success-tint">
          {translate("school.apiReady")}
        </span>
      }
      actions={
        <SchoolButton tone="primary" size="lg" onClick={() => setAdding((open) => !open)}>
          {translate("school.addSomeone")}
        </SchoolButton>
      }
    >
      <div className="rounded-xl bg-primary-tint px-4 py-3.5 text-caption text-on-primary-tint">
        {translate("school.peopleIntro")}
      </div>

      <Panel>
        {adding ? (
          <AddPerson
            organisationId={organisationId}
            onAdded={() => {
              setAdding(false);
              setCursorStack([null]);
            }}
          />
        ) : null}
        {members.isPending ? (
          <p className="px-4.5 py-6 text-caption text-admin-soft">{translate("ui.loading")}</p>
        ) : members.isError ? (
          <p role="alert" className="px-4.5 py-6 text-caption text-admin-danger">
            {translate("state.errorMessage")}
          </p>
        ) : rows.length === 0 ? (
          <div className="px-4.5 py-6">
            <p className="font-semibold">{translate("school.emptyPeopleTitle")}</p>
            <p className="text-caption text-admin-soft">{translate("school.emptyPeopleBody")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 border-collapse text-left">
              <thead>
                <tr className="bg-admin-subtle">
                  <th className="px-4.5 py-2.5 text-micro font-semibold tracking-wider text-admin-soft uppercase">
                    {translate("school.name")}
                  </th>
                  <th className="px-4.5 py-2.5 text-micro font-semibold tracking-wider text-admin-soft uppercase">
                    {translate("school.titleLabel")}
                  </th>
                  <th className="px-4.5 py-2.5 text-micro font-semibold tracking-wider text-admin-soft uppercase">
                    <span className="inline-flex items-center gap-1.5">
                      {translate("school.canDo")}
                      <ApiTag />
                    </span>
                  </th>
                  <th className="px-4.5 py-2.5 text-micro font-semibold tracking-wider text-admin-soft uppercase">
                    {translate("school.since")}
                  </th>
                  <th className="px-4.5 py-2.5">
                    <span className="sr-only">{translate("school.remove")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((member) => (
                  <MemberRow
                    key={member.user_id}
                    organisationId={organisationId}
                    member={member}
                    onRemoved={() => setCursorStack([null])}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-admin-rule bg-admin-subtle px-4.5 py-3">
          <p className="text-caption text-admin-soft">
            {translate("school.showing", { count: String(rows.length) })}
          </p>
          <div className="ml-auto flex gap-1.5">
            <SchoolButton
              tone="quiet"
              size="sm"
              disabled={cursorStack.length <= 1 || members.isFetching}
              onClick={() => setCursorStack((stack) => stack.slice(0, -1))}
            >
              {translate("school.previous")}
            </SchoolButton>
            <SchoolButton
              tone="quiet"
              size="sm"
              disabled={!members.data?.nextCursor || members.isFetching}
              onClick={() => {
                const next = members.data?.nextCursor;
                if (next) setCursorStack((stack) => [...stack, next]);
              }}
            >
              {translate("school.next")}
            </SchoolButton>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="border-b border-admin-rule px-5 py-4">
          <h2 className="text-body font-semibold">{translate("school.addingTitle")}</h2>
          <p className="text-caption text-admin-soft">{translate("school.addingBody")}</p>
        </div>
        <div className="bg-admin-note px-5 py-3.5 text-caption text-on-reward-tint">
          {translate("school.noInvite")}
        </div>
      </Panel>

      <Panel className="flex flex-col gap-2 px-5 py-4">
        <p className="text-micro font-semibold tracking-widest text-admin-soft uppercase">
          {translate("school.peopleReal")}
        </p>
        <p className="text-caption text-on-reward-tint">{translate("school.canDoNote")}</p>
      </Panel>
    </SchoolPage>
  );
}

function MemberRow({
  organisationId,
  member,
  onRemoved,
}: {
  organisationId: string;
  member: Member;
  onRemoved: () => void;
}) {
  const { locale, translate } = useMessages();
  const me = useMe();
  const remove = useRemoveMember(organisationId);
  const isYou = me.data?.user.id === member.user_id;
  const canDo = canDoLabel(member.roles);
  const canDoText =
    canDo === "everything"
      ? translate("school.canDoEverything")
      : canDo === "readOnly"
        ? translate("school.canDoReadOnly")
        : member.roles.join(", ");

  return (
    <tr className="border-b border-admin-rule last:border-b-0">
      <td className="px-4.5 py-3.25">
        <span className="inline-flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid size-7.5 place-items-center rounded-full bg-primary-tint text-tag font-semibold text-admin-on-tint"
          >
            {member.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part.charAt(0))
              .join("")
              .toUpperCase() || "?"}
          </span>
          <span className="font-semibold">{member.name}</span>
          {isYou ? (
            <span className="rounded-full bg-primary-tint px-2 py-px text-tag font-semibold text-admin-on-tint">
              {translate("school.you")}
            </span>
          ) : null}
        </span>
      </td>
      <td className="px-4.5 py-3.25 text-caption">{member.title || translate("school.notSet")}</td>
      <td className="px-4.5 py-3.25 text-caption text-admin-soft">{canDoText}</td>
      <td className="px-4.5 py-3.25 text-caption tabular-nums">
        {formatDay(member.joined_at, locale)}
      </td>
      <td className="px-4.5 py-3.25 text-right">
        {isYou ? (
          <span className="text-caption text-admin-soft">—</span>
        ) : (
          <SchoolButton
            tone="danger"
            size="sm"
            pending={remove.isPending}
            onClick={() => void remove.mutateAsync(member.user_id).then(onRemoved, () => undefined)}
          >
            {translate("school.remove")}
          </SchoolButton>
        )}
        {remove.isError ? (
          <p role="alert" className="text-micro text-admin-danger">
            {errorMessage(remove.error, translate, (seconds) => formatRetryTime(seconds, locale))}
          </p>
        ) : null}
      </td>
    </tr>
  );
}

function AddPerson({ organisationId, onAdded }: { organisationId: string; onAdded: () => void }) {
  const { locale, translate } = useMessages();
  const add = useAddMember(organisationId);
  const form = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { account: "", title: "" },
  });
  const errors = form.formState.errors;

  return (
    <form
      className="flex flex-col gap-3 border-b border-admin-rule px-5 py-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const found = await lookupAccount(values.account);
          if ("error" in found) {
            form.setError("account", {
              message: translate(
                found.error === "invalid" ? "school.accountInvalid" : "school.noAccount",
              ),
            });
            return;
          }
          await add.mutateAsync({ user_id: found.id, title: values.title });
          form.reset();
          onAdded();
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <div className="flex flex-wrap items-end gap-3">
        <SchoolTextInput
          className="min-w-0 grow basis-65"
          label={translate("school.findAccount")}
          error={fieldText(errors.account?.message, translate)}
          {...form.register("account")}
        />
        <SchoolTextInput
          className="min-w-0 grow basis-50"
          label={translate("school.titleLabel")}
          placeholder={translate("school.titlePlaceholder")}
          maxLength={80}
          {...form.register("title")}
        />
        <SchoolButton type="submit" size="lg" pending={form.formState.isSubmitting}>
          {translate(errors.root?.type === "offline" ? "common.noConnection" : "school.findAndAdd")}
        </SchoolButton>
      </div>
      {errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errors.root.message}
        </p>
      ) : null}
    </form>
  );
}
