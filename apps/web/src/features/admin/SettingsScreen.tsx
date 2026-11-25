"use client";

import type { components } from "@keoshaa/api-client";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { useMessages } from "@/lib/locale";

import { AdminTextInput, ApiNote } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { useSettings } from "./api";
import { BodyRow, ColumnCell, ColumnHead, DataTable, HeadRow } from "./DataTable";
import { formatDay } from "./format";
import { QueryGate } from "./QueryGate";

type Setting = components["schemas"]["SettingRead"];
type SortColumn = "key" | "changed";
type Direction = "ascending" | "descending";

const SCOPE_OPTIONS = [
  { value: "", label: "admin.allScopes" },
  { value: "platform", label: "admin.scopePlatform" },
  { value: "grade_level", label: "admin.scopeGrade" },
] as const;

function settingScope(setting: Setting): string {
  return setting.scope ?? "platform";
}

function ordered(
  settings: readonly Setting[],
  column: SortColumn,
  direction: Direction,
): Setting[] {
  const sorted = [...settings].sort((left, right) => {
    if (column === "key") return left.key.localeCompare(right.key);
    const leftTime = left.updated_at ? Date.parse(left.updated_at) : 0;
    const rightTime = right.updated_at ? Date.parse(right.updated_at) : 0;
    return leftTime - rightTime;
  });
  return direction === "descending" ? sorted.reverse() : sorted;
}

export function SettingsScreen() {
  const { locale, translate } = useMessages();
  const settings = useSettings();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<(typeof SCOPE_OPTIONS)[number]["value"]>("");
  const [sort, setSort] = useState<{ column: SortColumn; direction: Direction }>({
    column: "key",
    direction: "ascending",
  });
  const needle = query.trim().toLowerCase();
  const filtering = needle !== "" || scope !== "";

  const rows = useMemo(() => {
    const matched = (settings.data ?? []).filter((setting) => {
      if (scope !== "" && settingScope(setting) !== scope) return false;
      if (needle === "") return true;
      return (
        setting.key.toLowerCase().includes(needle) ||
        setting.description.toLowerCase().includes(needle)
      );
    });
    return ordered(matched, sort.column, sort.direction);
  }, [needle, scope, settings.data, sort]);

  function toggleSort(column: SortColumn) {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === "ascending" ? "descending" : "ascending" }
        : { column, direction: column === "changed" ? "descending" : "ascending" },
    );
  }

  return (
    <AdminPage title={translate("admin.settings")} gap="gap-4">
      <p className="max-w-prose text-admin-soft">{translate("admin.settingsIntro")}</p>
      <div className="flex flex-wrap items-end gap-3">
        <AdminTextInput
          className="grow basis-70"
          type="search"
          label={translate("admin.search")}
          placeholder={translate("admin.searchSettingsPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="w-full sm:w-50">
          <ChoiceField
            label={translate("admin.scope")}
            value={scope}
            onChange={(event) =>
              setScope(event.target.value as (typeof SCOPE_OPTIONS)[number]["value"])
            }
          >
            {SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {translate(option.label)}
              </option>
            ))}
          </ChoiceField>
        </div>
      </div>
      {scope === "grade_level" ? <ApiNote what={translate("admin.gradeScopeWhat")} /> : null}
      <QueryGate
        query={settings}
        isEmpty={rows.length === 0}
        emptyTitle={filtering ? "admin.noSettingsMatch" : "admin.emptySettings"}
        emptyMessage={filtering ? "admin.noSettingsMatchBody" : "admin.emptySettingsBody"}
      >
        <DataTable minWidth="min-w-190">
          <HeadRow>
            <ColumnHead
              sort={sort.column === "key" ? sort.direction : "none"}
              onSort={() => toggleSort("key")}
            >
              {translate("admin.key")}
            </ColumnHead>
            <ColumnHead>{translate("admin.whatItDoes")}</ColumnHead>
            <ColumnHead align="right">{translate("admin.value")}</ColumnHead>
            <ColumnHead
              align="right"
              sort={sort.column === "changed" ? sort.direction : "none"}
              onSort={() => toggleSort("changed")}
            >
              {translate("admin.settingChanged")}
            </ColumnHead>
          </HeadRow>
          <tbody>
            {rows.map((setting) => (
              <BodyRow key={setting.key}>
                <ColumnCell>
                  <Link
                    href={`/admin/settings/${encodeURIComponent(setting.key)}`}
                    className="text-caption font-medium text-primary underline hover:text-primary-pressed"
                  >
                    {setting.key}
                  </Link>
                </ColumnCell>
                <ColumnCell muted>{setting.description}</ColumnCell>
                <ColumnCell align="right">
                  <span className="font-semibold">{setting.value}</span>
                </ColumnCell>
                <ColumnCell align="right" muted>
                  {setting.updated_at
                    ? formatDay(setting.updated_at, locale)
                    : translate("admin.unassigned")}
                </ColumnCell>
              </BodyRow>
            ))}
          </tbody>
        </DataTable>
      </QueryGate>
      <p className="text-caption text-admin-soft">{translate("admin.settingsListNote")}</p>
    </AdminPage>
  );
}
