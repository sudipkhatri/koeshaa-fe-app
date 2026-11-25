"use client";

import { useId, useState } from "react";

import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { useStartView } from "./account-detail-api";
import { AdminButton, ApiTag } from "./admin-ui";
import { AdminIcon } from "./AdminIcon";

interface Props {
  userId: string;
  name: string;
  onClose: () => void;
}

/**
 * Confirm before starting a read-only view session.
 * Reason is drawn and required in the UI but not sent — the OpenAPI body has no field.
 */
export function ViewConfirmDialog({ userId, name, onClose }: Props) {
  const { locale, translate } = useMessages();
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const start = useStartView(userId);
  const trimmed = reason.trim();
  const canStart = trimmed.length > 0 && !start.isPending;

  async function onConfirm() {
    if (!canStart) return;
    try {
      await start.mutateAsync({ name });
      setFailure(null);
      onClose();
    } catch (error) {
      setFailure(errorMessage(error, translate, (seconds) => formatRetryTime(seconds, locale)));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !start.isPending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-confirm-title"
        className="w-full max-w-md overflow-hidden rounded-xl border border-admin-border bg-admin-surface shadow-lg"
      >
        <div className="flex gap-3.5 px-6 pt-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-square bg-reward-tint text-on-reward-tint">
            <AdminIcon name="view" className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 id="view-confirm-title" className="text-body font-semibold text-admin-ink">
              {translate("admin.viewConfirmTitle", { name })}
            </h2>
            <p className="mt-1.5 text-caption text-admin-soft">
              {translate("admin.viewConfirmBody")}
            </p>
          </div>
        </div>

        <ul className="mx-6 mt-4.5 flex list-none flex-col gap-2 rounded-square bg-admin-page px-4 py-3.5 text-caption text-admin-ink">
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-admin-on-tint">
              ✓
            </span>
            {translate("admin.viewConfirmStay")}
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-admin-on-tint">
              ✓
            </span>
            {translate("admin.viewConfirmExpires")}
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-admin-on-tint">
              ✓
            </span>
            {translate("admin.viewConfirmAudit")}
          </li>
        </ul>

        <div className="px-6 pt-4.5">
          <label
            htmlFor={reasonId}
            className="flex flex-wrap items-center gap-2 text-caption font-semibold text-admin-ink"
          >
            {translate("admin.viewReasonLabel")}
            <ApiTag />
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            required
            disabled={start.isPending}
            placeholder={translate("admin.viewReasonPlaceholder")}
            className="mt-1.5 w-full resize-y rounded-lg border border-admin-border bg-admin-surface px-3 py-2.5 text-small text-admin-ink outline-none focus:border-primary"
          />
          <p className="mt-1.5 text-tag text-admin-soft">{translate("admin.viewReasonHint")}</p>
        </div>

        {failure ? (
          <p role="alert" className="px-6 pt-2 text-caption text-admin-danger">
            {failure}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2.5 border-t border-admin-rule bg-admin-subtle px-6 py-4">
          <AdminButton
            type="button"
            tone="quiet"
            size="lg"
            disabled={start.isPending}
            onClick={onClose}
          >
            {translate("admin.viewCancel")}
          </AdminButton>
          <AdminButton
            type="button"
            tone="primary"
            size="lg"
            pending={start.isPending}
            disabled={!canStart}
            onClick={() => void onConfirm()}
          >
            {translate("admin.viewStart")}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
