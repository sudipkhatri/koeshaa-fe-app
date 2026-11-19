import { router } from "expo-router";
import { View } from "react-native";

import { Banner, Button, Mascot, Screen, Text } from "@/components/ui";
import { useLocale } from "@/lib/locale";

export function PasswordChangedScreen() {
  const { t } = useLocale();
  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("auth.signIn")}
          size="lg"
          onPress={() => router.replace("/onboarding/sign-in")}
        />
      }
    >
      <View className="items-center gap-3 pt-10">
        <Mascot mood="cheer" size={140} />
        <Text variant="headline" accessibilityRole="header">
          {t("forgot.doneTitle")}
        </Text>
        <Banner icon="shield" className="self-stretch">
          {t("forgot.doneBody")}
        </Banner>
      </View>
    </Screen>
  );
}
