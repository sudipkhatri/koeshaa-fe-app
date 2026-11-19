import { View } from "react-native";

import { Card, ProgressRing, Text } from "@/components/ui";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { getDailyGoal } from "../mock";

export function DailyGoal() {
  const { t, formatNumber } = useLocale();
  const { colors } = useTheme();
  const { doneMinutes, goalMinutes } = getDailyGoal();
  const percent = Math.round((doneMinutes / goalMinutes) * 100);
  return (
    <Card className="mt-6 flex-row items-center gap-4">
      <ProgressRing
        percent={percent}
        size={72}
        stroke={8}
        color={colors.primary}
        label={formatNumber(doneMinutes)}
        accessibilityLabel={t("home.goalMinutes", {
          done: formatNumber(doneMinutes),
          total: formatNumber(goalMinutes),
        })}
      />
      <View className="flex-1">
        <Text variant="section">{t("home.goalTitle")}</Text>
        <Text>
          {t("home.goalMinutes", {
            done: formatNumber(doneMinutes),
            total: formatNumber(goalMinutes),
          })}
        </Text>
        <Text variant="small">
          {t("home.goalLeft", { n: formatNumber(goalMinutes - doneMinutes) })}
        </Text>
      </View>
    </Card>
  );
}
