import { router } from "expo-router";
import { Pressable, View } from "react-native";

import {
  Button,
  Card,
  Header,
  Icon,
  Screen,
  StateView,
  Text,
  useQueryStateKind,
} from "@/components/ui";
import { cardShadow } from "@/components/ui/Card";
import { useProfile } from "@/features/me/api";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import type { MessageKey } from "@keoshaa/i18n";

import { initials, useChildren } from "./api";
import type { LinkedChild } from "./api";

function relationshipLabel(
  t: (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string,
  relationship: LinkedChild["relationship"],
) {
  return t(`parent.relationship.${relationship}` as MessageKey);
}

function ChildRow({ child }: { child: LinkedChild }) {
  const { t } = useLocale();
  const { colors, scheme } = useTheme();
  const relationship = relationshipLabel(t, child.relationship);
  const subtitle = child.grade
    ? t("parent.subtitle", { grade: child.grade, relationship })
    : t("parent.subtitleNoGrade", { relationship });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${child.name}, ${subtitle}`}
      onPress={() => router.push({ pathname: "/parent/child/[id]", params: { id: child.id } })}
      className="flex-row items-center gap-3.5 rounded-card bg-surface p-4 active:opacity-90"
      style={cardShadow[scheme]}
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
        <Text className="font-ui-bold text-on-primary">{initials(child.name)}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-ui-bold text-lg">{child.name.split(/\s+/)[0] ?? child.name}</Text>
        <Text variant="caption">{subtitle}</Text>
      </View>
      <Icon name="chev" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

export function ParentHomeScreen() {
  const { t } = useLocale();
  const { colors, scheme } = useTheme();
  const profile = useProfile();
  const children = useChildren();
  const kind = useQueryStateKind({
    ...children,
    hasData: children.data !== undefined,
  });
  const list = children.data ?? [];
  const empty = kind === null && list.length === 0;
  const firstName = (profile.data?.name ?? "").split(/\s+/)[0] || profile.data?.name || "";

  return (
    <Screen scroll edges={["top"]}>
      <Header title={t("tabs.children")} />
      <View className="mb-4 flex-row items-center gap-3 pt-1">
        <View
          className="h-11 w-11 items-center justify-center rounded-full bg-reward"
          style={cardShadow[scheme]}
        >
          <Text className="font-ui-bold text-on-reward">{initials(profile.data?.name ?? "P")}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text variant="section" accessibilityRole="header">
            {t("home.namaste", { name: firstName })}
          </Text>
          <Text variant="caption">{t("parent.accountLabel")}</Text>
        </View>
      </View>

      {kind !== null ? (
        <StateView kind={kind} onRetry={() => void children.refetch()} />
      ) : (
        <View className="gap-3.5">
          <Text variant="section" accessibilityRole="header">
            {t("parent.yourChildren")}
          </Text>

          {empty ? (
            <StateView
              kind="empty"
              title={t("parent.emptyTitle")}
              message={t("parent.emptyBody")}
              action={{
                title: t("parent.addFirstChild"),
                onPress: () => router.push("/parent/add-child"),
              }}
            />
          ) : (
            list.map((child) => <ChildRow key={child.id} child={child} />)
          )}

          {!empty ? (
            <Button
              title={t("parent.addChild")}
              variant="secondary"
              icon="plus"
              size="lg"
              onPress={() => router.push("/parent/add-child")}
            />
          ) : null}

          <Card className="gap-2">
            <Text className="font-ui-bold">{t("parent.linkTitle")}</Text>
            <Text muted variant="small">
              {t("parent.linkBody")}
            </Text>
            <Button
              title={t("guardian.openInvites")}
              variant="secondary"
              onPress={() => router.push("/guardian/invitations")}
            />
          </Card>

          <View className="rounded-2xl border border-dashed border-border bg-surface-muted px-4 py-3.5">
            <Text variant="small" style={{ color: colors.textMuted }}>
              <Text className="font-ui-bold text-text">{t("parent.apiNoteLead")} </Text>
              {t("parent.classStreamNote")}
            </Text>
          </View>
        </View>
      )}
    </Screen>
  );
}
