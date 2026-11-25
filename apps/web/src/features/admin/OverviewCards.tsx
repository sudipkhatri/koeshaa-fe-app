"use client";

import type { ReactNode } from "react";

import { SkeletonBlock } from "@/components/ui/Skeleton";
import { useMessages } from "@/lib/locale";

export function CountCard({
  label,
  value,
  detail,
  query,
  danger = false,
  children,
}: {
  label: string;
  value: string;
  detail: string;
  query?: { isPending: boolean; isError: boolean };
  danger?: boolean;
  children?: ReactNode;
}) {
  const { translate } = useMessages();
  const pending = query?.isPending ?? false;
  return (
    <article
      aria-busy={pending || undefined}
      className="flex flex-col gap-1 rounded-xl border border-admin-border bg-admin-surface px-4.5 py-4"
    >
      <p className="text-micro font-semibold tracking-wider text-admin-soft uppercase">{label}</p>
      {pending ? (
        <SkeletonBlock className="my-1 h-8 w-16 bg-admin-rule" />
      ) : (
        <p
          className={`text-headline font-bold tabular-nums ${danger ? "text-admin-danger" : "text-admin-ink"}`}
        >
          {query?.isError ? "—" : value}
        </p>
      )}
      {pending ? (
        <SkeletonBlock className="h-4 w-36 bg-admin-rule" />
      ) : (
        <p className="text-caption text-admin-soft">
          {query?.isError ? translate("state.errorMessage") : detail}
        </p>
      )}
      {children}
    </article>
  );
}
