import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";

import { Header, LinkButton, Screen, StateView, Text, useQueryStateKind } from "@/components/ui";
import { cardShadow } from "@/components/ui/Card";
import { lastSeenLabel } from "@/features/me/lastSeen";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { useAlerts, useMarkAllRead, useMarkRead } from "./api";
import type { AlertItem } from "./api";

function AlertRow({ item, onPress }: { item: AlertItem; onPress: () => void }) {
  const { t, formatNumber } = useLocale();
  const { colors, scheme } = useTheme();
  const unread = !item.readAt;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: unread }}
      onPress={onPress}
      className="flex-row gap-3 rounded-card p-4"
      style={[
        cardShadow[scheme],
        {
          backgroundColor: unread ? colors.primaryTint : colors.surface,
          borderWidth: unread ? 1.5 : 0,
          borderColor: unread ? colors.primary : "transparent",
        },
      ]}
    >
      <View
        className="mt-1.5 h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: unread ? colors.primary : "transparent" }}
      />
      <View className="min-w-0 flex-1">
        <Text className={unread ? "font-ui-bold" : "font-ui-semibold"}>{item.title}</Text>
        <Text muted className="mt-1" variant="small">
          {item.body}
        </Text>
        <Text variant="caption" className="mt-1.5">
          {lastSeenLabel(item.createdAt, t, formatNumber)}
        </Text>
      </View>
    </Pressable>
  );
}

function openFromAlert(item: AlertItem) {
  if (item.kind.includes("guardian")) {
    router.push("/guardian/invitations");
    return;
  }
  // Only in-app paths from the server; ignore absolute URLs.
  if (item.url?.startsWith("/") && !item.url.startsWith("//")) {
    router.push(item.url as "/me");
  }
}

export function AlertsScreen() {
  const { t } = useLocale();
  const { colors } = useTheme();
  const alerts = useAlerts();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const items = alerts.data?.pages.flatMap((page) => page.items) ?? [];
  const kind = useQueryStateKind({
    isPending: alerts.isPending,
    isError: alerts.isError,
    error: alerts.error,
    hasData: alerts.data !== undefined,
  });
  const empty = kind === null && items.length === 0;

  return (
    <Screen edges={["top"]} className="px-0">
      <View className="flex-row items-center gap-2 px-4">
        <View className="flex-1">
          <Header title={t("alerts.title")} back={false} />
        </View>
        {items.some((item) => !item.readAt) ? (
          <LinkButton
            title={t("alerts.markAll")}
            onPress={() => markAll.mutate()}
            disabled={markAll.isPending}
          />
        ) : null}
      </View>

      {kind !== null ? (
        <View className="px-4">
          <StateView kind={kind} onRetry={() => void alerts.refetch()} />
        </View>
      ) : empty ? (
        <View className="px-4">
          <StateView kind="empty" title={t("alerts.emptyTitle")} message={t("alerts.emptyBody")} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-2.5 px-4 pb-8"
          renderItem={({ item }) => (
            <AlertRow
              item={item}
              onPress={() => {
                if (!item.readAt) markRead.mutate(item.id);
                openFromAlert(item);
              }}
            />
          )}
          onEndReached={() => {
            if (alerts.hasNextPage && !alerts.isFetchingNextPage) void alerts.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            <View className="items-center gap-2 py-4">
              {alerts.isFetchingNextPage ? (
                <ActivityIndicator color={colors.primary} />
              ) : alerts.hasNextPage ? (
                <Text muted variant="small">
                  {t("alerts.loadMore")}
                </Text>
              ) : (
                <Text muted variant="small">
                  {t("alerts.end")}
                </Text>
              )}
              <View className="mt-2 w-full rounded-2xl border border-dashed border-border bg-surface-muted px-4 py-3">
                <Text variant="small" style={{ color: colors.textMuted }}>
                  <Text className="font-ui-bold text-text">{t("alerts.serverCopyLead")} </Text>
                  {t("alerts.serverCopyBody")}
                </Text>
              </View>
            </View>
          }
        />
      )}
    </Screen>
  );
}
