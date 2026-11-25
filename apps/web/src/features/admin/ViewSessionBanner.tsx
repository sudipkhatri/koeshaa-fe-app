"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { useEndView } from "./account-detail-api";
import { AdminButton } from "./admin-ui";
import { AdminIcon } from "./AdminIcon";
import {
  endViewSessionLocally,
  getViewSession,
  minutesLeft,
  subscribeViewSession,
  type ViewSessionMeta,
} from "./view-session";

function useActiveViewSession(): ViewSessionMeta | null {
  return useSyncExternalStore(subscribeViewSession, getViewSession, () => null);
}

function useMinutesLeft(session: ViewSessionMeta | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => {
      const stamp = Date.now();
      setNow(stamp);
      if (minutesLeft(session, stamp) === 0) endViewSessionLocally();
    }, 15_000);
    return () => window.clearInterval(id);
  }, [session]);
  return session ? minutesLeft(session, now) : 0;
}

/**
 * Sticky banner while a read-only view session is active.
 * End uses the staff token; the view token never replaces it.
 */
export function ViewSessionBanner() {
  const { locale, translate } = useMessages();
  const session = useActiveViewSession();
  const end = useEndView();
  const left = useMinutesLeft(session);
  const [failure, setFailure] = useState<string | null>(null);

  if (!session) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-20 flex flex-wrap items-center gap-3 bg-on-reward-tint px-5 py-2.75 text-caption text-reward-tint"
    >
      <AdminIcon name="view" className="size-4.5 shrink-0 text-reward-tint" />
      <p className="min-w-0 flex-1">
        {translate("admin.viewBanner", {
          name: session.name,
          minutes: String(left),
        })}
      </p>
      <AdminButton
        type="button"
        tone="quiet"
        size="sm"
        className="!bg-admin-surface !text-on-reward-tint"
        pending={end.isPending}
        onClick={() =>
          void end.mutateAsync().then(
            () => setFailure(null),
            (error: unknown) =>
              setFailure(
                errorMessage(error, translate, (seconds) => formatRetryTime(seconds, locale)),
              ),
          )
        }
      >
        {translate("admin.viewEnd")}
      </AdminButton>
      {failure ? (
        <p role="alert" className="w-full text-reward">
          {failure}
        </p>
      ) : null}
    </div>
  );
}
