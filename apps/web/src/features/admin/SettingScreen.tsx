"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import { useForm } from "react-hook-form";

import { StateView } from "@/components/ui/StateView";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput, ApiNote } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { flattenPages, useSettingHistory, useSettings, useUpdateSetting } from "./api";
import { BodyRow, ColumnCell, ColumnHead, DataTable, HeadRow } from "./DataTable";
import { formatWhen } from "./format";
import { useAccountName } from "./lead-detail-api";
import { QueryGate, LoadMore } from "./QueryGate";
import { settingKeySchema, settingValueSchema } from "./schemas";

type Setting = components["schemas"]["SettingRead"];
type Change = components["schemas"]["SettingChangeRead"];

export function SettingScreen({ settingKey }: { settingKey: string }) {
  const valid = settingKeySchema.safeParse(settingKey).success;
  const settings = useSettings();
  const { translate } = useMessages();
  const setting = valid ? settings.data?.find((item) => item.key === settingKey) : undefined;
  const back = { href: "/admin/settings", label: translate("admin.settings") };

  if (!valid || (settings.isSuccess && !setting)) {
    return (
      <AdminPage title={translate("admin.settings")} back={back}>
        <StateView
          title={translate("admin.notFoundTitle")}
          message={translate("admin.notFoundBody")}
        />
      </AdminPage>
    );
  }

  return (
    <AdminPage title={setting?.key ?? translate("admin.settings")} back={back} gap="gap-5">
      <QueryGate
        query={settings}
        isEmpty={!setting}
        emptyTitle="admin.notFoundTitle"
        emptyMessage="admin.notFoundBody"
      >
        {setting ? <SettingDetail setting={setting} /> : null}
      </QueryGate>
    </AdminPage>
  );
}

function SettingDetail({ setting }: { setting: Setting }) {
  const { locale, translate } = useMessages();
  const update = useUpdateSetting(setting.key);
  const form = useForm<{ value: number }>({
    resolver: zodResolver(settingValueSchema(setting.minimum, setting.maximum)),
    values: { value: setting.value },
    resetOptions: { keepDirtyValues: true },
  });
  const errors = form.formState.errors;
  const offline = errors.root?.type === "offline";
  const atDefault = setting.value === setting.default && !form.formState.isDirty;

  async function save(value: number) {
    const saved = await update.mutateAsync(value);
    form.reset({ value: saved.value });
  }

  return (
    <div className="flex flex-wrap gap-5">
      <div className="flex min-w-0 grow-2 basis-110 flex-col gap-5">
        <section className="flex flex-col gap-4.5 rounded-xl border border-admin-border bg-admin-surface px-6 py-5.5">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-body font-semibold">{translate("admin.whatItDoes")}</h2>
            <p className="max-w-prose text-admin-soft">{setting.description}</p>
          </div>
          <form
            className="flex flex-col gap-4.5"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await save(values.value);
              } catch (error) {
                recordFormFailure(error, form.setError, translate, locale);
              }
            })}
          >
            <div className="flex flex-wrap items-end gap-5">
              <AdminTextInput
                strong
                className="w-full sm:w-50"
                type="number"
                label={translate("admin.value")}
                hint={translate("admin.range", { min: setting.minimum, max: setting.maximum })}
                error={fieldText(errors.value?.message, translate)}
                {...form.register("value", { valueAsNumber: true })}
              />
              <Fact label={translate("admin.settingDefault")} value={String(setting.default)} />
              <Fact
                label={translate("admin.scope")}
                value={
                  setting.scope === "platform"
                    ? translate("admin.scopePlatform")
                    : (setting.scope ?? translate("admin.scopePlatform"))
                }
              />
            </div>
            {errors.root?.message ? (
              <p role="alert" className="text-caption text-admin-danger">
                {errors.root.message}
              </p>
            ) : null}
            {update.isSuccess && !form.formState.isDirty ? (
              <p role="status" className="text-caption text-admin-soft">
                {translate("admin.saved")}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2.5">
              <AdminButton type="submit" size="lg" pending={form.formState.isSubmitting}>
                {translate(offline ? "common.noConnection" : "admin.save")}
              </AdminButton>
              <AdminButton
                tone="quiet"
                size="lg"
                disabled={atDefault || update.isPending}
                onClick={() => {
                  void save(setting.default).catch((error: unknown) => {
                    recordFormFailure(error, form.setError, translate, locale);
                  });
                }}
              >
                {translate("admin.resetDefault")}
              </AdminButton>
            </div>
          </form>
        </section>
        <SettingHistory settingKey={setting.key} />
      </div>
      <section className="flex min-w-0 grow basis-70 flex-col gap-3 self-start rounded-xl border border-admin-border bg-admin-surface p-5">
        <h2 className="text-body font-semibold">{translate("admin.touches")}</h2>
        <ApiNote what={translate("admin.touchesWhat")} />
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 pb-5.5">
      <span className="text-micro font-semibold tracking-widest text-admin-soft uppercase">
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function SettingHistory({ settingKey }: { settingKey: string }) {
  const { translate } = useMessages();
  const history = useSettingHistory(settingKey, true);
  const changes = [...flattenPages(history.data)].sort(
    (left, right) => Date.parse(right.changed_at) - Date.parse(left.changed_at),
  );

  return (
    <section className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <div className="border-b border-admin-rule px-6 py-4">
        <h2 className="text-body font-semibold">{translate("admin.history")}</h2>
      </div>
      <QueryGate
        query={history}
        isEmpty={changes.length === 0}
        emptyTitle="admin.emptyHistory"
        emptyMessage="admin.emptyHistoryBody"
        inset
      >
        <DataTable bare roomy minWidth="min-w-140">
          <HeadRow>
            <ColumnHead sort="descending">{translate("admin.changedAt")}</ColumnHead>
            <ColumnHead>{translate("admin.changedBy")}</ColumnHead>
            <ColumnHead align="right">{translate("admin.oldValue")}</ColumnHead>
            <ColumnHead align="right">{translate("admin.newValue")}</ColumnHead>
          </HeadRow>
          <tbody>
            {changes.map((change) => (
              <ChangeRow key={`${change.changed_at}-${change.new_value}`} change={change} />
            ))}
          </tbody>
        </DataTable>
        <LoadMore
          hasNextPage={history.hasNextPage}
          pending={history.isFetchingNextPage}
          onLoad={() => void history.fetchNextPage()}
        />
      </QueryGate>
    </section>
  );
}

function ChangeRow({ change }: { change: Change }) {
  const { locale, translate } = useMessages();
  const name = useAccountName(change.changed_by, change.changed_by !== null);
  const who =
    change.changed_by === null ? translate("admin.systemActor") : (name.data ?? change.changed_by);
  return (
    <BodyRow>
      <ColumnCell>
        <span className="tabular-nums">{formatWhen(change.changed_at, locale)}</span>
      </ColumnCell>
      <ColumnCell>{who}</ColumnCell>
      <ColumnCell align="right" muted>
        {change.old_value}
      </ColumnCell>
      <ColumnCell align="right">
        <span className="font-semibold">{change.new_value}</span>
      </ColumnCell>
    </BodyRow>
  );
}
