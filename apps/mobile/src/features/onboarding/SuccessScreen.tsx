import { router } from "expo-router";
import { View } from "react-native";

import { Button, Float, Mascot, Screen, Text } from "@/components/ui";
import { useProfile } from "@/features/me/api";
import { useLocale } from "@/lib/locale";

import { Confetti } from "./components/Confetti";

export function SuccessScreen() {
  const { t } = useLocale();
  const { data: profile } = useProfile();
  return (
    <Screen
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("signup.pickMyClass")}
          size="lg"
          onPress={() => router.replace("/onboarding/pick-class")}
        />
      }
    >
      <Confetti />
      <View className="items-center gap-3 mt-2 pt-16">
        <Float>
          <Mascot mood="cheer" size={160} />
        </Float>
        <Text variant="headline" accessibilityRole="header" className="my-2 text-center">
          {t("signup.successTitle", { name: profile?.name ?? "" })}
        </Text>
        <Text muted className="text-center">
          {t("signup.successBody")}
        </Text>
      </View>
    </Screen>
  );
}
