import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Header, Mascot, Screen, Text, TextField } from "@/components/ui";
import { useSession } from "@/features/session";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";

import { useInviteParent } from "./api";

export function ParentScreen() {
  const { t, formatClock } = useLocale();
  const { parent, sendParentInvite } = useSession();
  const invite = useInviteParent();
  const [number, setNumber] = useState(parent.number);
  const [error, setError] = useState("");

  if (parent.sent) {
    return (
      <Screen
        edges={["top", "bottom"]}
        footer={<Button title={t("common.done")} size="lg" onPress={() => router.back()} />}
      >
        <Header title={t("me.linkedParent")} />
        <View className="items-center gap-3 pt-8">
          <Mascot mood="cheer" size={120} />
          <Text variant="headline" accessibilityRole="header">
            {t("parent.sentTitle")}
          </Text>
          <Text muted className="text-center">
            {t("parent.sentBody", { number: parent.number })}
          </Text>
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
            invite.mutate(number.trim(), { onSuccess: () => sendParentInvite(number.trim()) });
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
