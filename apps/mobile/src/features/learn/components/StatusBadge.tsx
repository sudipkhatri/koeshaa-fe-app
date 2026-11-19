import { View } from "react-native";

import { Icon, ProgressRing, Text } from "@/components/ui";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import type { ChapterStatus } from "../types";

/** Done tick, progress ring, FREE or Locked: the state at the end of a chapter row. */
export function StatusBadge({
  status,
  percent = 0,
  ringColor,
}: {
  status: ChapterStatus;
  percent?: number;
  ringColor?: string;
}) {
  const { t } = useLocale();
  const { colors } = useTheme();
  if (status === "done") {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t("learn.done")}
        className="h-8 w-8 items-center justify-center rounded-full bg-success"
      >
        <Icon name="check" size={18} color={colors.onSubject} />
      </View>
    );
  }
  if (status === "inProgress") {
    return (
      <ProgressRing
        percent={percent}
        size={34}
        stroke={4}
        color={ringColor ?? colors.primary}
        accessibilityLabel={t("learn.inProgress")}
      />
    );
  }
  if (status === "locked") {
    return (
      <View className="min-h-8 flex-row items-center gap-1 rounded-full bg-surface-muted px-3">
        <Icon name="lock" size={14} color={colors.textMuted} />
        <Text variant="caption" className="font-ui-bold text-text-muted">
          {t("common.locked")}
        </Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-success-tint px-2.5 py-0.5">
      <Text className="text-micro font-ui-bold text-on-success-tint">{t("common.free")}</Text>
    </View>
  );
}
