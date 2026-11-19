import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable } from "react-native";

import { Float, GradientFill, Mascot, Text } from "@/components/ui";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

const SPLASH_MS = 2200;

export function SplashScreen() {
  const { t } = useLocale();
  const { colors } = useTheme();
  useEffect(() => {
    const timer = setTimeout(() => router.replace("/onboarding/language"), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("app.name")}
      onPress={() => router.replace("/onboarding/language")}
      className="flex-1 items-center justify-center gap-3 pt-6"
    >
      <GradientFill from={colors.background} to={colors.primaryTint} />
      <Float>
        <Mascot size={160} />
      </Float>
      <Text variant="display" style={{ letterSpacing: -0.5 }}>
        {t("app.name")}
      </Text>
      <Text variant="body" muted>
        {t("brand.tagline")}
      </Text>
    </Pressable>
  );
}
