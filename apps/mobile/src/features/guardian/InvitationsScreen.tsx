import { router } from "expo-router";
import { Pressable, View } from "react-native";

import {
  Banner,
  Button,
  Card,
  Chip,
  Header,
  Screen,
  StateView,
  Text,
  useQueryStateKind,
} from "@/components/ui";
import { useLocale } from "@/lib/locale";
import type { MessageKey } from "@keoshaa/i18n";

import { useGuardianInvitations } from "./api";

export function InvitationsScreen() {
  const { t } = useLocale();
  const invitations = useGuardianInvitations();
  const kind = useQueryStateKind({
    ...invitations,
    hasData: invitations.data !== undefined,
  });
  const pending = (invitations.data ?? []).filter((row) => row.state === "pending");
  const active = (invitations.data ?? []).filter((row) => row.state === "active");

  return (
    <Screen scroll edges={["top"]}>
      <Header title={t("guardian.invitesTitle")} onBack={() => router.back()} />
      {kind !== null ? (
        <StateView kind={kind} onRetry={() => void invitations.refetch()} />
      ) : (
        <View className="gap-3">
          <Text variant="section" accessibilityRole="header">
            {t("guardian.waiting")}
          </Text>
          {pending.length === 0 ? (
            <Text muted>{t("guardian.nonePending")}</Text>
          ) : (
            pending.map((row) => (
              <Pressable
                key={row.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: "/guardian/accept", params: { id: row.id } })
                }
              >
                <Card className="flex-row items-center gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="font-ui-bold">
                      {row.invitedPhone ?? t("guardian.unknownParent")}
                    </Text>
                    <Text variant="caption">
                      {t("guardian.asRelationship", {
                        relationship: t(`parent.relationship.${row.relationship}` as MessageKey),
                      })}
                    </Text>
                  </View>
                  <Chip label={t("guardian.pending")} tone="reward" variant="tiny" />
                </Card>
              </Pressable>
            ))
          )}

          {active.length > 0 ? (
            <>
              <Text variant="section" className="mt-2" accessibilityRole="header">
                {t("guardian.linked")}
              </Text>
              {active.map((row) => (
                <Card key={row.id} className="flex-row items-center gap-3 opacity-80">
                  <View className="min-w-0 flex-1">
                    <Text className="font-ui-bold">
                      {row.invitedPhone ?? t("guardian.unknownParent")}
                    </Text>
                    <Text variant="caption">
                      {t("guardian.asRelationship", {
                        relationship: t(`parent.relationship.${row.relationship}` as MessageKey),
                      })}
                    </Text>
                  </View>
                  <Chip label={t("guardian.linkedChip")} tone="success" variant="tiny" />
                </Card>
              ))}
            </>
          ) : null}

          <Banner icon="info" className="mt-2">
            {t("guardian.parentAcceptNote")}
          </Banner>
          <Button
            title={t("common.done")}
            variant="secondary"
            onPress={() => router.back()}
            className="mt-2"
          />
        </View>
      )}
    </Screen>
  );
}
