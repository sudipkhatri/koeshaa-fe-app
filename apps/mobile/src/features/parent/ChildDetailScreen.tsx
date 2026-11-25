import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import {
  Banner,
  Button,
  Card,
  Header,
  Screen,
  StateView,
  Text,
  TextField,
  useQueryStateKind,
} from "@/components/ui";
import { lastSeenLabel } from "@/features/me/lastSeen";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useToast } from "@/lib/toast";
import type { MessageKey } from "@keoshaa/i18n";

import {
  initials,
  useChildDevices,
  useChildPassword,
  useChildren,
  useCloseChild,
  useRemoveChildDevice,
  useUpdateChild,
} from "./api";
import type { ChildDevice } from "./api";
import { ChildCloseSheet, ChildPasswordSheet, SignOutDeviceSheet } from "./ChildSheets";
import { childCloseSchema, childPasswordSchema } from "./schemas";

export function ChildDetailScreen({ childId }: { childId: string }) {
  const { t, formatNumber, formatClock } = useLocale();
  const toast = useToast();
  const children = useChildren();
  const devices = useChildDevices(childId);
  const update = useUpdateChild(childId);
  const removeDevice = useRemoveChildDevice(childId);
  const setPassword = useChildPassword(childId);
  const closeChild = useCloseChild(childId);

  const child = children.data?.find((c) => c.id === childId);
  const [draftName, setDraftName] = useState<{ id: string; name: string } | null>(null);
  const name = draftName?.id === childId ? draftName.name : (child?.name ?? "");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [asking, setAsking] = useState<ChildDevice | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [closePassword, setClosePassword] = useState("");
  const [formError, setFormError] = useState("");

  const listKind = useQueryStateKind({
    ...children,
    hasData: children.data !== undefined,
  });
  const deviceKind = useQueryStateKind({
    ...devices,
    hasData: devices.data !== undefined,
  });

  if (listKind !== null) {
    return (
      <Screen scroll edges={["top"]}>
        <Header title={t("tabs.children")} onBack={() => router.back()} />
        <StateView kind={listKind} onRetry={() => void children.refetch()} />
      </Screen>
    );
  }

  if (!child) {
    return (
      <Screen scroll edges={["top"]}>
        <Header title={t("tabs.children")} onBack={() => router.back()} />
        <StateView kind="empty" title={t("parent.notFound")} message={t("parent.emptyBody")} />
      </Screen>
    );
  }

  const relationship = t(`parent.relationship.${child.relationship}` as MessageKey);
  const firstName = child.name.split(/\s+/)[0] ?? child.name;

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed === child.name) return;
    update.mutate(
      { name: trimmed },
      {
        onSuccess: () => setDraftName(null),
        onError: (error) => setFormError(errorMessage(error, t, formatClock)),
      },
    );
  };

  const submitPassword = () => {
    const parsed = childPasswordSchema.safeParse({ password: newPassword, parentPassword });
    if (!parsed.success) {
      setFormError(t(parsed.error.issues[0]?.message as MessageKey));
      return;
    }
    setFormError("");
    setPassword.mutate(
      { password: parsed.data.password, parentPassword: parsed.data.parentPassword },
      {
        onSuccess: () => {
          setPasswordOpen(false);
          setNewPassword("");
          setParentPassword("");
          toast(t("parent.detailPasswordSaved"));
        },
        onError: (error) => setFormError(errorMessage(error, t, formatClock)),
      },
    );
  };

  const submitClose = () => {
    const parsed = childCloseSchema.safeParse({ password: closePassword });
    if (!parsed.success) {
      setFormError(t(parsed.error.issues[0]?.message as MessageKey));
      return;
    }
    setFormError("");
    closeChild.mutate(parsed.data.password, {
      onSuccess: () => {
        setCloseOpen(false);
        router.replace("/(tabs)/home");
      },
      onError: (error) => setFormError(errorMessage(error, t, formatClock)),
    });
  };

  return (
    <Screen scroll edges={["top", "bottom"]}>
      <Header title={firstName} onBack={() => router.back()} />

      <View className="mb-4 mt-2 flex-row items-center gap-3.5">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
          <Text className="font-ui-bold text-lg text-on-primary">{initials(child.name)}</Text>
        </View>
        <View className="min-w-0">
          <Text variant="headline" accessibilityRole="header">
            {firstName}
          </Text>
          <Text variant="caption">
            {t("parent.detailYour", { relationship })}
            {child.grade ? ` · ${child.grade}` : ""}
          </Text>
        </View>
      </View>

      <Card className="mb-3 gap-3">
        <Text className="font-ui-bold">{t("parent.detailDetails")}</Text>
        <TextField
          label={t("parent.detailName")}
          value={name}
          onChangeText={(value) => {
            setDraftName({ id: childId, name: value });
            setFormError("");
          }}
        />
        <Text className="font-ui-semibold">{t("parent.detailYouAre")}</Text>
        <Text muted>{t(`parent.relationshipTitle.${child.relationship}` as MessageKey)}</Text>
        <Button
          title={t("parent.detailSaveName")}
          variant="secondary"
          loading={update.isPending}
          disabled={update.isPending || name.trim() === child.name}
          onPress={saveName}
        />
      </Card>

      <Card className="mb-3 gap-2">
        <Text className="font-ui-bold">{t("parent.detailDevices")}</Text>
        <Text muted variant="small">
          {t("parent.detailDevicesBody")}
        </Text>
        {deviceKind !== null ? (
          <StateView kind={deviceKind} onRetry={() => void devices.refetch()} />
        ) : (
          (devices.data ?? []).map((device) => (
            <View
              key={device.id}
              className="flex-row items-center gap-3 border-b border-border py-3 last:border-b-0"
            >
              <View className="min-w-0 flex-1">
                <Text className="font-ui-semibold">{device.name}</Text>
                <Text variant="caption">{lastSeenLabel(device.lastSeenAt, t, formatNumber)}</Text>
              </View>
              <Button
                title={t("common.signOut")}
                variant="ghost"
                onPress={() => setAsking(device)}
                accessibilityLabel={t("devices.signOutDevice", { device: device.name })}
              />
            </View>
          ))
        )}
      </Card>

      <Card className="mb-3 gap-2">
        <Text className="font-ui-bold">{t("parent.detailPasswordTitle")}</Text>
        <Text muted variant="small">
          {t("parent.detailPasswordBody")}
        </Text>
        <Button
          title={t("parent.detailSetPassword")}
          variant="secondary"
          onPress={() => {
            setFormError("");
            setPasswordOpen(true);
          }}
        />
      </Card>

      <Card className="mb-3 gap-2 border border-danger">
        <Text className="font-ui-bold text-danger">{t("parent.detailCloseTitle")}</Text>
        <Text muted variant="small">
          {t("parent.detailCloseBody")}
        </Text>
        <Button
          title={t("parent.detailCloseAction")}
          variant="danger"
          onPress={() => {
            setFormError("");
            setCloseOpen(true);
          }}
        />
      </Card>

      <Banner icon="info" className="mb-4">
        {t("parent.detailProgressNote")}
      </Banner>
      {formError && !passwordOpen && !closeOpen ? <Banner tone="danger">{formError}</Banner> : null}

      <SignOutDeviceSheet
        device={asking}
        loading={removeDevice.isPending}
        onClose={() => setAsking(null)}
        onConfirm={() => {
          if (!asking) return;
          removeDevice.mutate(asking.id, {
            onSuccess: () => {
              setAsking(null);
              toast(t("devices.toast"));
            },
          });
        }}
      />
      <ChildPasswordSheet
        visible={passwordOpen}
        newPassword={newPassword}
        parentPassword={parentPassword}
        error={formError}
        loading={setPassword.isPending}
        onChangeNew={setNewPassword}
        onChangeParent={setParentPassword}
        onClose={() => setPasswordOpen(false)}
        onSubmit={submitPassword}
      />
      <ChildCloseSheet
        visible={closeOpen}
        password={closePassword}
        error={formError}
        loading={closeChild.isPending}
        onChangePassword={setClosePassword}
        onClose={() => setCloseOpen(false)}
        onSubmit={submitClose}
      />
    </Screen>
  );
}
