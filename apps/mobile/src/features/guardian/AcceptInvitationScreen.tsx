import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { z } from "zod";

import {
  Banner,
  Button,
  Card,
  Header,
  Screen,
  StateView,
  Text,
  useQueryStateKind,
} from "@/components/ui";
import { cardShadow } from "@/components/ui/Card";
import { routeParam } from "@/features/shared/route-params";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";
import type { MessageKey } from "@keoshaa/i18n";

import { useAcceptInvitation, useEndGuardianship, useGuardianInvitations } from "./api";

const linkIdSchema = z.string().min(1).max(64);

export function AcceptInvitationScreen() {
  const { t, formatClock } = useLocale();
  const { scheme } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams();
  const parsedId = routeParam(linkIdSchema).safeParse(params.id);
  const invitations = useGuardianInvitations();
  const accept = useAcceptInvitation();
  const decline = useEndGuardianship();

  const kind = useQueryStateKind({
    ...invitations,
    hasData: invitations.data !== undefined,
  });

  const pending = (invitations.data ?? []).filter((row) => row.state === "pending");
  const selected =
    (parsedId.success ? pending.find((row) => row.id === parsedId.data) : null) ?? pending[0];

  if (kind !== null) {
    return (
      <Screen scroll edges={["top"]}>
        <Header title={t("guardian.acceptTitle")} onBack={() => router.back()} />
        <StateView kind={kind} onRetry={() => void invitations.refetch()} />
      </Screen>
    );
  }

  if (!selected) {
    return (
      <Screen scroll edges={["top", "bottom"]}>
        <Header title={t("guardian.acceptTitle")} onBack={() => router.back()} />
        <StateView
          kind="empty"
          title={t("guardian.noneTitle")}
          message={t("guardian.noneBody")}
          action={{ title: t("common.done"), onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  const relationship = t(`parent.relationship.${selected.relationship}` as MessageKey);
  const busy = accept.isPending || decline.isPending;
  const error = accept.error || decline.error;

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <View className="gap-2">
          <Button
            title={t("guardian.acceptYes", { relationship })}
            size="lg"
            loading={accept.isPending}
            disabled={busy}
            onPress={() =>
              accept.mutate(selected.id, {
                onSuccess: () => {
                  toast(t("guardian.acceptedToast"));
                  router.replace("/(tabs)/home");
                },
              })
            }
          />
          <Button
            title={t("guardian.acceptNo")}
            variant="ghost"
            disabled={busy}
            loading={decline.isPending}
            onPress={() =>
              decline.mutate(selected.id, {
                onSuccess: () => {
                  toast(t("guardian.declinedToast"));
                  router.back();
                },
              })
            }
          />
        </View>
      }
    >
      <Header title={t("guardian.acceptTitle")} onBack={() => router.back()} />
      <Text variant="headline" accessibilityRole="header" className="mt-2">
        {t("guardian.acceptTitle")}
      </Text>

      <View
        className="mt-5 items-center rounded-card bg-surface px-4 py-5"
        style={cardShadow[scheme]}
      >
        <Text className="font-ui-bold text-lg">{t("guardian.studentInvite")}</Text>
        <Text muted className="mt-2 text-center">
          {t("guardian.saysRelationship", { relationship })}
        </Text>
        {selected.expiresAt ? (
          <Text variant="caption" className="mt-2">
            {t("guardian.expires")}
          </Text>
        ) : null}
      </View>

      <Card className="mt-4 gap-2">
        <Text className="font-ui-bold">{t("guardian.ifYesTitle")}</Text>
        <Text muted>{t("guardian.ifYesStudy")}</Text>
        <Text muted>{t("guardian.ifYesHelp")}</Text>
        <Text muted>{t("guardian.ifYesNoAnswers")}</Text>
        <Text muted>{t("guardian.ifYesNoMessage")}</Text>
      </Card>

      <Banner icon="info" className="mt-3">
        {t("guardian.removeLater")}
      </Banner>
      <View className="mt-3 rounded-2xl border border-dashed border-border bg-surface-muted px-4 py-3">
        <Text muted variant="small">
          <Text className="font-ui-bold text-text">{t("parent.apiNoteLead")} </Text>
          {t("guardian.studentNameMissing")}
        </Text>
      </View>
      {error ? (
        <Banner tone="danger" className="mt-3">
          {errorMessage(error, t, formatClock)}
        </Banner>
      ) : null}
    </Screen>
  );
}
