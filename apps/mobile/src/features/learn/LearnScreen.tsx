import { router } from "expo-router";
import { View } from "react-native";

import { Screen, Text } from "@/components/ui";
import { ClassPill } from "@/features/session";
import { useLocale } from "@/lib/locale";

import { SubjectGrid } from "./components/SubjectGrid";
import { useSubjects } from "./api";
import { SubjectsGate } from "./components/SubjectsGate";

export function LearnScreen() {
  const { t } = useLocale();
  const state = useSubjects();
  return (
    <Screen scroll edges={["top"]}>
      <View className="min-h-14 flex-row items-center gap-2">
        <Text variant="title" accessibilityRole="header" className="flex-1">
          {t("learn.title")}
        </Text>
        <ClassPill chevron onPress={() => router.push("/onboarding/pick-class")} />
      </View>
      <Text muted className="mb-4">
        {t("learn.pick")}
      </Text>
      <SubjectsGate state={state}>{(subjects) => <SubjectGrid subjects={subjects} />}</SubjectsGate>
    </Screen>
  );
}
