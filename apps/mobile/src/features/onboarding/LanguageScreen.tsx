import { router } from "expo-router";
import { View } from "react-native";

import { Button, Mascot, Screen, Text } from "@/components/ui";
import { useLocale } from "@/lib/locale";

import { OptionCard } from "./components/OptionCard";

export function LanguageScreen() {
  const { t, locale, setLocale } = useLocale();
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("common.continue")}
          size="lg"
          onPress={() => router.push("/onboarding/who")}
        />
      }
    >
      <View className="items-center pb-2 pt-4">
        <Mascot mood="cheer" size={96} />
      </View>
      <Text variant="headline" accessibilityRole="header" className="my-2 text-center">
        {t("auth.chooseLanguage")}
        {"\n"}
        {t("auth.chooseLanguageAlt")}
      </Text>
      <View className="gap-3">
        <OptionCard
          title={t("auth.english")}
          subtitle={t("auth.englishSub")}
          selected={locale === "en"}
          onPress={() => setLocale("en")}
        />
        <OptionCard
          title={t("auth.nepali")}
          subtitle={t("auth.nepaliSub")}
          selected={locale === "ne"}
          onPress={() => setLocale("ne")}
        />
      </View>
      <Text variant="small" className="mt-3 text-center">
        {t("auth.languageHint")}
      </Text>
    </Screen>
  );
}
