import { router } from "expo-router";
import { useRef, useState } from "react";
import { View } from "react-native";

import { Banner, Button, Header, Icon, Mascot, Screen, Text, TextField } from "@/components/ui";
import { useSession } from "@/features/session";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { useCloseAccount } from "./api";

export function CloseAccountScreen() {
  const { t, formatClock } = useLocale();
  const { colors } = useTheme();
  const { signOut } = useSession();
  const close = useCloseAccount();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [closed, setClosed] = useState(false);
  /** Closing is destructive: a second tap before the first answer must not send again. */
  const sending = useRef(false);

  if (closed) {
    return (
      <Screen
        edges={["top", "bottom"]}
        footer={
          <Button
            title={t("closeAccount.backToStart")}
            size="lg"
            onPress={() => void signOut().then(() => router.replace("/onboarding/welcome"))}
          />
        }
      >
        <View className="items-center gap-3 pt-14">
          <Mascot mood="sleepy" size={130} />
          <Text variant="headline" accessibilityRole="header" className="text-center">
            {t("closeAccount.closedTitle")}
          </Text>
          <Text muted className="text-center">
            {t("closeAccount.closedBody")}
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
        <>
          <Button
            title={t("closeAccount.close")}
            variant="danger"
            size="lg"
            loading={close.isPending}
            onPress={() => {
              if (!password) return setError(t("closeAccount.passwordError"));
              if (sending.current) return;
              sending.current = true;
              close.mutate(password, {
                onSuccess: () => setClosed(true),
                onSettled: () => {
                  sending.current = false;
                },
              });
            }}
          />
          <Button title={t("closeAccount.keep")} variant="ghost" onPress={() => router.back()} />
        </>
      }
    >
      <Header title={t("me.closeAccount")} />
      <Text muted className="mt-2">
        {t("closeAccount.intro")}
      </Text>
      <View className="my-3 gap-2">
        {(["off", "kept", "deleted"] as const).map((key) => (
          <View key={key} className="flex-row items-start gap-2">
            <View className="mt-1">
              <Icon name="warn" size={18} color={colors.danger} />
            </View>
            <Text className="flex-1">{t(`closeAccount.${key}`)}</Text>
          </View>
        ))}
      </View>
      <Banner tone="success" icon="check" className="mb-2">
        {t("closeAccount.reopen")}
      </Banner>
      <TextField
        label={t("closeAccount.passwordLabel")}
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError("");
          close.reset();
        }}
        error={error || (close.error ? errorMessage(close.error, t, formatClock) : undefined)}
      />
    </Screen>
  );
}
