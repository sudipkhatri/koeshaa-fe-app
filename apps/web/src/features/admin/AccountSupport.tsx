"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { PAUSE_REASONS, pauseSchema, type PauseValues } from "./account-schemas";
import {
  useCloseUser,
  useEndSessions,
  usePauseUser,
  useReopenUser,
  useResetAuthenticator,
  useResumeUser,
} from "./account-detail-api";
import { AdminButton, AdminTextInput, ApiNote } from "./admin-ui";
import { AdminIcon } from "./AdminIcon";
import { daysUntil } from "./format";
import { ViewConfirmDialog } from "./ViewConfirmDialog";
import { getViewEndedNote, getViewSession, subscribeViewSession } from "./view-session";

type User = components["schemas"]["UserRead"];

const emptySnap = { session: null, ended: null } as const;
let cachedSnap: {
  session: ReturnType<typeof getViewSession>;
  ended: ReturnType<typeof getViewEndedNote>;
} = emptySnap;

function getViewSessionSnap() {
  const session = getViewSession();
  const ended = getViewEndedNote();
  if (cachedSnap.session === session && cachedSnap.ended === ended) return cachedSnap;
  cachedSnap = { session, ended };
  return cachedSnap;
}

function useViewSessionSnap() {
  return useSyncExternalStore(subscribeViewSession, getViewSessionSnap, () => emptySnap);
}

export function AccountSupport({ user }: { user: User }) {
  const { locale, translate } = useMessages();
  const sessions = useEndSessions(user.id);
  const close = useCloseUser(user.id);
  const reopen = useReopenUser(user.id);
  const reset = useResetAuthenticator(user.id);
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { session, ended } = useViewSessionSnap();
  const viewingThis = session?.userId === user.id;
  const endedThis = ended?.userId === user.id ? ended : null;
  const daysLeft = user.purge_after ? daysUntil(user.purge_after) : null;
  const canStopClose = daysLeft === null || daysLeft > 0;

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
      setFailure(null);
    } catch (error) {
      setFailure(errorMessage(error, translate, (seconds) => formatRetryTime(seconds, locale)));
    }
  }

  return (
    <>
      {endedThis ? (
        <p
          role="status"
          className="rounded-square bg-success-tint px-3.5 py-3 text-caption text-on-success-tint"
        >
          {translate("admin.viewEndedNote", {
            name: endedThis.name,
            minutes: String(endedThis.minutes),
          })}
        </p>
      ) : null}
      <section className="flex flex-col gap-3.5 rounded-xl border border-admin-border bg-admin-surface p-5">
        <h2 className="text-body font-semibold">{translate("admin.supportActions")}</h2>
        <AdminButton
          tone="quiet"
          size="lg"
          className="w-full"
          disabled={Boolean(session)}
          onClick={() => setConfirmOpen(true)}
        >
          <AdminIcon name="view" className="size-4 text-admin-soft" />
          {translate("admin.viewAsStudent")}
        </AdminButton>
        <AdminButton
          tone="quiet"
          size="lg"
          className="w-full"
          pending={sessions.isPending}
          onClick={() => void run(() => sessions.mutateAsync())}
        >
          {translate("admin.signOutDevices")}
        </AdminButton>
        {sessions.isSuccess ? (
          <p role="status" className="text-caption text-admin-soft">
            {translate("admin.signedOutDevices")}
          </p>
        ) : null}
        {viewingThis ? <ApiNote what={translate("admin.viewSurfaceMissing")} /> : null}
        <p className="text-caption text-admin-soft">{translate("admin.viewAsNote")}</p>
      </section>
      {confirmOpen ? (
        <ViewConfirmDialog
          userId={user.id}
          name={user.name}
          onClose={() => setConfirmOpen(false)}
        />
      ) : null}
      {user.status === "active" ? <PauseCard userId={user.id} /> : null}
      {user.status === "paused" ? <ResumeCard userId={user.id} /> : null}
      {user.status === "closing" ? (
        <section className="flex flex-col gap-3.5 rounded-xl border border-admin-danger-line bg-admin-surface p-5">
          <h2 className="text-body font-semibold text-admin-danger">
            {translate("admin.closeAccount")}
          </h2>
          <p className="text-caption text-admin-soft">{translate("admin.closeWait")}</p>
          {canStopClose ? (
            <AdminButton
              tone="primary"
              size="lg"
              className="w-full"
              pending={reopen.isPending}
              onClick={() => void run(() => reopen.mutateAsync())}
            >
              {translate("admin.stopClose")}
            </AdminButton>
          ) : null}
        </section>
      ) : user.status === "closed" ? null : (
        <section className="flex flex-col gap-3.5 rounded-xl border border-admin-danger-line bg-admin-surface p-5">
          <h2 className="text-body font-semibold text-admin-danger">
            {translate("admin.closeAccount")}
          </h2>
          <p className="text-caption text-admin-soft">{translate("admin.closeWait")}</p>
          <Link
            href="/admin/account-states"
            className="text-caption font-semibold text-primary underline hover:text-primary-pressed"
          >
            {translate("admin.closeStop")}
          </Link>
          <AdminButton
            tone="danger"
            size="lg"
            className="w-full"
            pending={close.isPending}
            onClick={() => void run(() => close.mutateAsync())}
          >
            {translate("admin.closeButton")}
          </AdminButton>
        </section>
      )}
      {failure ? (
        <p role="alert" className="text-caption text-admin-danger">
          {failure}
        </p>
      ) : null}
      <section className="flex flex-col gap-2.5 rounded-xl border border-admin-border bg-admin-surface p-5">
        <h2 className="text-body font-semibold">{translate("admin.notShownHere")}</h2>
        <p className="text-caption text-admin-soft">
          <Link
            href={`/admin/accounts/${user.id}/access`}
            className="font-semibold text-primary underline hover:text-primary-pressed"
          >
            {translate("admin.accessScreen")}
          </Link>
        </p>
        <p className="text-caption text-admin-soft">
          {translate(user.account_kind === "staff" ? "admin.notOnStaff" : "admin.notOnMember")}
        </p>
        {user.account_kind === "staff" ? (
          <AdminButton
            tone="quiet"
            size="lg"
            className="w-full"
            pending={reset.isPending}
            onClick={() => void run(() => reset.mutateAsync())}
          >
            {translate("admin.resetAuthenticator")}
          </AdminButton>
        ) : null}
        {reset.isSuccess ? (
          <p role="status" className="text-caption text-admin-soft">
            {translate("admin.authenticatorReset")}
          </p>
        ) : null}
      </section>
    </>
  );
}

function PauseCard({ userId }: { userId: string }) {
  const { locale, translate } = useMessages();
  const pause = usePauseUser(userId);
  const form = useForm<PauseValues>({
    resolver: zodResolver(pauseSchema),
    defaultValues: { reason: "abuse", note: "" },
  });
  const reason = useWatch({ control: form.control, name: "reason" });
  const errors = form.formState.errors;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-5">
      <h2 className="text-body font-semibold">{translate("admin.pauseAccount")}</h2>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await pause.mutateAsync(values);
          } catch (error) {
            recordFormFailure(error, form.setError, translate, locale);
          }
        })}
      >
        <ChoiceField
          label={translate("admin.reason")}
          value={reason}
          onChange={(event) => form.setValue("reason", event.target.value as PauseValues["reason"])}
        >
          {PAUSE_REASONS.map((item) => (
            <option key={item} value={item}>
              {translate(`admin.pauseReasonOption.${item}`)}
            </option>
          ))}
        </ChoiceField>
        <AdminTextInput
          label={translate("admin.noteOptional")}
          placeholder={translate("admin.pausePlaceholder")}
          error={fieldText(errors.note?.message, translate)}
          {...form.register("note")}
        />
        {errors.root?.message ? (
          <p role="alert" className="text-caption text-admin-danger">
            {errors.root.message}
          </p>
        ) : null}
        <AdminButton
          type="submit"
          tone="reward"
          size="lg"
          className="w-full"
          pending={form.formState.isSubmitting}
        >
          {translate(errors.root?.type === "offline" ? "common.noConnection" : "admin.pauseButton")}
        </AdminButton>
      </form>
      <p className="text-caption text-admin-soft">{translate("admin.pauseNote")}</p>
    </section>
  );
}

function ResumeCard({ userId }: { userId: string }) {
  const { locale, translate } = useMessages();
  const resume = useResumeUser(userId);
  const [failure, setFailure] = useState<string | null>(null);
  return (
    <section className="flex flex-col gap-3.5 rounded-xl border border-admin-border bg-admin-surface p-5">
      <AdminButton
        tone="primary"
        size="lg"
        className="w-full"
        pending={resume.isPending}
        onClick={() =>
          void resume.mutateAsync().then(
            () => setFailure(null),
            (error: unknown) =>
              setFailure(
                errorMessage(error, translate, (seconds) => formatRetryTime(seconds, locale)),
              ),
          )
        }
      >
        {translate("admin.resumeAccount")}
      </AdminButton>
      {failure ? (
        <p role="alert" className="text-caption text-admin-danger">
          {failure}
        </p>
      ) : null}
      <p className="text-caption text-admin-soft">{translate("admin.resumeNote")}</p>
    </section>
  );
}
