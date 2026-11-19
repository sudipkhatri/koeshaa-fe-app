import { router } from "expo-router";
import { View } from "react-native";

import { Button, Float, Mascot, Screen, Text } from "@/components/ui";
import { useLocale } from "@/lib/locale";

export function WelcomeScreen() {
  const { t } = useLocale();
  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        <>
          <Button
            title={t("auth.createAccount")}
            size="lg"
            onPress={() => router.push("/onboarding/signup-name")}
          />
          <Button
            title={t("auth.signIn")}
            variant="secondary"
            size="lg"
            onPress={() => router.push("/onboarding/sign-in")}
          />
        </>
      }
    >
      <View className="items-center gap-3 pt-12">
        <Float>
          <Mascot mood="cheer" size={150} />
        </Float>
        <Text variant="headline" accessibilityRole="header" className="my-2 text-center">
          {t("auth.welcomeTitle")}
        </Text>
        <Text muted className="text-center">
          {t("auth.welcomeSub")}
        </Text>
      </View>
    </Screen>
  );
}
