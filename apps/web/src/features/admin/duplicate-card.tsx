"use client";

import type { components } from "@keoshaa/api-client";
import type { MessageKey } from "@keoshaa/i18n";
import { NetworkError } from "@keoshaa/core";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { useAdminUser } from "./account-detail-api";
import { AdminButton, ApiTag } from "./admin-ui";
import {
  isMatched,
  matchedKeys,
  primaryIdentifier,
  useDecideDuplicate,
  type Duplicate,
} from "./duplicates-api";
import { formatDay, formatPhone } from "./format";

type User = components["schemas"]["UserRead"];

const matchLabel: Record<string, MessageKey> = {
  name: "admin.name",
  date_of_birth: "admin.dateOfBirth",
  phone: "admin.phone",
  email: "admin.email",
  username: "admin.username",
};

export function matchTitle(
  matchedOn: Record<string, boolean>,
  translate: (key: MessageKey, vars?: Record<string, string>) => string,
): string {
  const keys = matchedKeys(matchedOn);
  if (keys.length === 0) return translate("admin.matchedOnUnknown");
  const labels = keys.map((key) =>
    key in matchLabel ? translate(matchLabel[key]!) : key.replaceAll("_", " "),
  );
  if (labels.length === 1) {
    return translate("admin.matchedOnOne", { field: labels[0]! });
  }
  if (labels.length === 2) {
    return translate("admin.matchedOnTwo", { a: labels[0]!, b: labels[1]! });
  }
  const last = labels[labels.length - 1]!;
  const head = labels.slice(0, -1).join(", ");
  return translate("admin.matchedOnMany", { fields: head, last });
}

export function DuplicateCard({
  duplicate,
  expanded,
  onReview,
}: {
  duplicate: Duplicate;
  expanded: boolean;
  onReview: () => void;
}) {
  const { locale, translate } = useMessages();
  const userA = useAdminUser(duplicate.user_id);
  const userB = useAdminUser(duplicate.candidate_id);
  const decide = useDecideDuplicate();
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const title = matchTitle(duplicate.matched_on, translate);
  const nameA = userA.data?.name?.trim() || "—";
  const nameB = userB.data?.name?.trim() || "—";

  async function decideStatus(status: "same_person" | "different") {
    setError("");
    setOffline(false);
    try {
      await decide.mutateAsync({ duplicateId: duplicate.id, status });
    } catch (failure) {
      setOffline(failure instanceof NetworkError);
      setError(errorMessage(failure, translate, (seconds) => formatRetryTime(seconds, locale)));
    }
  }

  if (!expanded) {
    const shared = matchedKeys(duplicate.matched_on)
      .map((key) => (key in matchLabel ? translate(matchLabel[key]!) : key))
      .join(", ");
    return (
      <article className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface opacity-85">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-admin-rule px-5 py-3.5">
          <h2 className="min-w-0 grow text-title font-semibold">{title}</h2>
          <span className="text-caption text-admin-soft tabular-nums">
            {translate("admin.raisedOn", { date: formatDay(duplicate.created_at, locale) })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3.5 px-5 py-4">
          <p className="min-w-0 grow text-caption">
            <strong className="font-semibold">{nameA}</strong> {translate("admin.and")}{" "}
            <strong className="font-semibold">{nameB}</strong>
            {shared ? ` · ${translate("admin.shareMatch", { fields: shared })}` : null}
          </p>
          <AdminButton tone="quiet" size="sm" onClick={onReview}>
            {translate("admin.review")}
          </AdminButton>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-admin-rule px-5 py-3.5">
        <h2 className="min-w-0 grow text-title font-semibold">{title}</h2>
        <span className="text-caption text-admin-soft tabular-nums">
          {translate("admin.raisedOn", { date: formatDay(duplicate.created_at, locale) })}
        </span>
      </div>
      <div className="flex flex-wrap">
        <AccountColumn
          label={translate("admin.accountA")}
          user={userA.data}
          matchedOn={duplicate.matched_on}
          openLabel={translate("admin.openAccountA")}
        />
        <AccountColumn
          label={translate("admin.accountB")}
          user={userB.data}
          matchedOn={duplicate.matched_on}
          openLabel={translate("admin.openAccountB")}
          last
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-admin-rule bg-admin-page px-5 py-4">
        <p className="min-w-0 grow text-caption text-admin-soft">
          {translate("admin.duplicateDecideHint")}
        </p>
        <AdminButton
          tone="quiet"
          disabled={decide.isPending}
          onClick={() => void decideStatus("different")}
        >
          {translate(offline ? "common.noConnection" : "admin.differentPeople")}
        </AdminButton>
        <AdminButton
          pending={decide.isPending}
          disabled={decide.isPending}
          onClick={() => void decideStatus("same_person")}
        >
          {translate(offline ? "common.noConnection" : "admin.samePerson")}
        </AdminButton>
        {error ? <p className="w-full text-caption text-admin-danger">{error}</p> : null}
      </div>
    </article>
  );
}

function AccountColumn({
  label,
  user,
  matchedOn,
  openLabel,
  last = false,
}: {
  label: string;
  user: User | undefined;
  matchedOn: Record<string, boolean>;
  openLabel: string;
  last?: boolean;
}) {
  const { locale, translate } = useMessages();
  const signIn = primaryIdentifier(user);
  const signInValue =
    signIn === null ? "—" : signIn.kind === "phone" ? formatPhone(signIn.value) : signIn.value;
  const signInMatched =
    signIn !== null &&
    (isMatched(matchedOn, signIn.kind) ||
      (signIn.kind === "phone" && isMatched(matchedOn, "phone")));

  return (
    <div
      className={`min-w-0 grow basis-75 px-5 py-5 ${last ? "" : "border-b border-admin-rule md:border-r md:border-b-0"}`}
    >
      <p className="mb-3 text-micro font-semibold tracking-widest text-admin-soft uppercase">
        {label}
      </p>
      <dl className="flex flex-col gap-2.5">
        <Row
          label={translate("admin.name")}
          highlight={isMatched(matchedOn, "name")}
          value={user?.name?.trim() || "—"}
        />
        <Row
          label={translate("admin.dateOfBirth")}
          highlight={isMatched(matchedOn, "date_of_birth")}
          value={user?.date_of_birth ?? "—"}
          tabular
        />
        <Row
          label={translate("admin.signsInWith")}
          highlight={signInMatched}
          value={signInValue}
          tabular={signIn?.kind === "phone"}
        />
        <Row
          label={translate("admin.created")}
          value={
            user
              ? translate("admin.createdWithSource", {
                  date: formatDay(user.created_at, locale),
                  source: user.source,
                })
              : "—"
          }
          tabular
        />
        <Row
          label={translate("admin.enrolment")}
          value={
            <span className="inline-flex items-center gap-2">
              —
              <ApiTag />
            </span>
          }
        />
        <Row
          label={translate("admin.lastActive")}
          value={
            <span className="inline-flex items-center gap-2">
              —
              <ApiTag />
            </span>
          }
        />
      </dl>
      {user ? (
        <Link
          href={`/admin/accounts/${user.id}`}
          className="mt-3.5 inline-block text-caption font-semibold text-primary underline hover:text-primary-pressed"
        >
          {openLabel}
        </Link>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  highlight = false,
  tabular = false,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
  tabular?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-caption text-admin-soft">{label}</dt>
      <dd
        className={`m-0 text-right font-semibold ${tabular ? "tabular-nums" : ""} ${highlight ? "rounded-sm bg-reward-tint px-1.5 text-on-reward-tint" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
