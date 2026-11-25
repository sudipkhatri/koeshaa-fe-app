"use client";

import type { MessageKey } from "@keoshaa/i18n";

import { useMessages } from "@/lib/locale";

import { AdminPage } from "./AdminPage";

/** Holds a sidebar destination whose board is next in the build order. */
export function BuildingNextScreen({ title }: { title: MessageKey }) {
  const { translate } = useMessages();
  return (
    <AdminPage title={translate(title)}>
      <p className="text-admin-soft">{translate("admin.buildingNext")}</p>
    </AdminPage>
  );
}
