"use client";

import { ApiError, NetworkError } from "@keoshaa/core";
import type { MessageKey } from "@keoshaa/i18n";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ContentSkeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";
import { useMessages } from "@/lib/locale";

import { AdminButton } from "./admin-ui";

export function QueryGate({
  query,
  isEmpty,
  emptyTitle,
  emptyMessage,
  inset = false,
  children,
}: {
  query: Pick<UseQueryResult, "isPending" | "error" | "refetch">;
  isEmpty: boolean;
  emptyTitle: MessageKey;
  emptyMessage: MessageKey;
  inset?: boolean;
  children: ReactNode;
}) {
  const { translate } = useMessages();
  if (query.isPending) {
    return <ContentSkeleton label={translate("ui.loading")} />;
  }
  if (query.error instanceof NetworkError) {
    return (
      <StateView
        title={translate("state.offlineTitle")}
        message={translate("state.offlineMessage")}
        retryLabel={translate("ui.retry")}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (query.error instanceof ApiError && query.error.status === 403) {
    return (
      <StateView title={translate("errors.FORBIDDEN")} message={translate("errors.FORBIDDEN")} />
    );
  }
  if (query.error) {
    return (
      <StateView
        title={translate("state.errorTitle")}
        message={translate("state.errorMessage")}
        retryLabel={translate("ui.retry")}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (isEmpty) {
    if (inset) {
      return <p className="px-4.5 py-3 text-caption text-admin-soft">{translate(emptyMessage)}</p>;
    }
    return <StateView title={translate(emptyTitle)} message={translate(emptyMessage)} />;
  }
  return children;
}

export function LoadMore({
  hasNextPage,
  pending,
  onLoad,
}: {
  hasNextPage: boolean;
  pending: boolean;
  onLoad: () => void;
}) {
  const { translate } = useMessages();
  if (!hasNextPage) return null;
  return (
    <AdminButton tone="quiet" pending={pending} onClick={onLoad} className="self-start">
      {translate("admin.loadMore")}
    </AdminButton>
  );
}
