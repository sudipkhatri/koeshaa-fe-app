import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Header, Icon, Screen, Text } from "@/components/ui";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { OptionCard } from "./components/OptionCard";

export function WhoScreen() {
  const { t } = useLocale();
  const { colors } = useTheme();
  const [role, setRole] = useState<"student" | "parent">("student");
  const lead = (name: "cap" | "heart") => (
    <View className="h-14 w-14 items-center justify-center rounded-cell bg-surface">
      <Icon name={name} size={30} color={colors.primary} />
    </View>
  );
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("common.continue")}
          size="lg"
          onPress={() => router.push("/onboarding/welcome")}
        />
      }
    >
      <Header />
      <Text variant="headline" accessibilityRole="header" className="my-2">
        {t("auth.whoTitle")}
      </Text>
      <Text muted className="mb-4">
        {t("auth.whoSub")}
      </Text>
      <View className="gap-3">
        <OptionCard
          title={t("auth.student")}
          subtitle={t("auth.studentSub")}
          leading={lead("cap")}
          selected={role === "student"}
          onPress={() => setRole("student")}
        />
        <OptionCard
          title={t("auth.parent")}
          subtitle={t("auth.parentSub")}
          leading={lead("heart")}
          selected={role === "parent"}
          onPress={() => setRole("parent")}
        />
      </View>
    </Screen>
  );
}
