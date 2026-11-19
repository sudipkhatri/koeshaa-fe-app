import { useState } from "react";
import { View } from "react-native";

import {
  Banner,
  Button,
  Card,
  Chip,
  Header,
  Icon,
  Screen,
  Sheet,
  StateView,
  useQueryStateKind,
  Text,
} from "@/components/ui";
import { MAX_DEVICES } from "@/features/session";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";

import { useDevices, useRemoveDevice } from "./api";
import type { Device } from "./api";
import { lastSeenLabel } from "./lastSeen";

export function DevicesScreen() {
  const { t, formatNumber, formatClock } = useLocale();
  const { colors } = useTheme();
  const query = useDevices();
  const remove = useRemoveDevice();
  const toast = useToast();
  const [asking, setAsking] = useState<Device | null>(null);

  const kind = useQueryStateKind({ ...query, hasData: !!query.data });
  if (!query.data) {
    return (
      <Screen scroll edges={["top"]}>
        <Header title={t("me.devices")} />
        <StateView kind={kind ?? "loading"} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }
  const devices = query.data;
  const freeSlots = Array.from({ length: Math.max(0, MAX_DEVICES - devices.length) });

  return (
    <Screen scroll edges={["top"]}>
      <Header title={t("me.devices")} />
      <Banner icon="info" className="mb-4 mt-2">
        {t("devices.info")}
      </Banner>
      <View className="gap-3">
        {devices.map((device) => (
          <Card key={device.id} className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-lg bg-primary-tint">
              <Icon name="phone" color={colors.onPrimaryTint} />
            </View>
            <View className="flex-1 items-start">
              <Text className="font-ui-bold">{device.name}</Text>
              <Text variant="caption" className="-mt-1">
                {lastSeenLabel(device.lastSeenAt, t, formatNumber)}
              </Text>
              {device.isThisDevice ? (
                <Chip variant="tiny" label={t("devices.thisDevice")} tone="success" icon="check" />
              ) : null}
            </View>
            {device.isThisDevice ? null : (
              <Chip
                variant="chip"
                label={t("common.signOut")}
                tone="danger"
                icon="logout"
                onPress={() => setAsking(device)}
                accessibilityLabel={t("devices.signOutDevice", { device: device.name })}
              />
            )}
          </Card>
        ))}
        {freeSlots.map((_, i) => (
          <View
            key={i}
            className="flex-row items-center gap-3 rounded-card border-2 border-dashed border-border p-4"
          >
            <View className="h-12 w-12 items-center justify-center rounded-lg bg-surface-muted">
              <Icon name="plus" color={colors.textMuted} />
            </View>
            <Text muted className="font-ui-semibold">
              {t("devices.freeSlot")}
            </Text>
          </View>
        ))}
      </View>
      <Sheet
        visible={asking !== null}
        onClose={() => setAsking(null)}
        title={asking ? t("devices.askTitle", { device: asking.name }) : undefined}
      >
        <Text muted>{t("devices.askBody")}</Text>
        <Button
          title={t("devices.yes")}
          variant="danger"
          loading={remove.isPending}
          onPress={() => {
            if (!asking) return;
            remove.mutate(asking.id, {
              onSuccess: () => toast(t("devices.toast")),
              onSettled: () => setAsking(null),
              onError: (error) => toast(errorMessage(error, t, formatClock)),
            });
          }}
        />
        <Button title={t("devices.keep")} variant="ghost" onPress={() => setAsking(null)} />
      </Sheet>
    </Screen>
  );
}
