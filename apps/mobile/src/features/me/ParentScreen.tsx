import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Banner, Button, Header, Mascot, Screen, Text, TextField } from "@/components/ui";
import { SelectField } from "@/features/onboarding/components/SelectField";
import { useInviteParent, useResendInvitation } from "@/features/guardian/api";
import type { Relationship } from "@/features/parent/schemas";
import { useSession } from "@/features/session";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import type { MessageKey } from "@keoshaa/i18n";

const RELATIONSHIPS: Relationship[] = ["mother", "father", "guardian"];

export function ParentScreen() {
  const { t, formatClock } = useLocale();
  const { sendParentInvite } = useSession();
  const invite = useInviteParent();
  const resend = useResendInvitation();
  const [number, setNumber] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("guardian");
  const [error, setError] = useState("");
  const [sentLinkId, setSentLinkId] = useState<string | null>(null);
  const [sentNumber, setSentNumber] = useState("");

  if (sentLinkId) {
    return (
      <Screen
        edges={["top", "bottom"]}
        footer={
          <View className="gap-2">
            <Button
              title={t("guardian.sendAgain")}
              variant="secondary"
              loading={resend.isPending}
              onPress={() => resend.mutate(sentLinkId)}
            />
            <Button title={t("common.done")} size="lg" onPress={() => router.back()} />
          </View>
        }
      >
        <Header title={t("me.linkedParent")} />
        <View className="items-center gap-3 pt-8">
          <Mascot mood="cheer" size={120} />
          <Text variant="headline" accessibilityRole="header">
            {t("parent.sentTitle")}
          </Text>
          <Text muted className="text-center">
            {t("parent.sentBody", { number: sentNumber })}
          </Text>
          {resend.error ? (
            <Banner tone="danger">{errorMessage(resend.error, t, formatClock)}</Banner>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("parent.send")}
          icon="sms"
          size="lg"
          loading={invite.isPending}
          onPress={() => {
            if (number.replace(/\D/g, "").length < 9) return setError(t("parent.phoneError"));
            invite.mutate(
              { phone: number.trim(), relationship },
              {
                onSuccess: (link) => {
                  const phone = number.trim();
                  setSentNumber(phone);
                  setSentLinkId(link?.id ?? "sent");
                  sendParentInvite(phone);
                },
              },
            );
          }}
        />
      }
    >
      <Header title={t("me.linkedParent")} />
      <View className="items-center gap-3 pb-4 pt-2">
        <Mascot size={90} />
        <Text muted className="text-center">
          {t("parent.intro")}
        </Text>
      </View>
      <View className="mb-4">
        <SelectField
          label={t("guardian.yourRelationship")}
          value={relationship}
          options={RELATIONSHIPS.map((value) => ({
            value,
            label: t(`parent.relationshipTitle.${value}` as MessageKey),
          }))}
          onChange={(value) => setRelationship(value as Relationship)}
        />
      </View>
      <TextField
        label={t("parent.phoneLabel")}
        prefix="+977"
        keyboardType="phone-pad"
        value={number}
        onChangeText={(text) => {
          setNumber(text);
          setError("");
          invite.reset();
        }}
        placeholder={t("signup.phonePlaceholder")}
        error={error || (invite.error ? errorMessage(invite.error, t, formatClock) : undefined)}
      />
    </Screen>
  );
}
