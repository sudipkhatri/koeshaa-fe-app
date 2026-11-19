import { router } from "expo-router";
import { Pressable, View } from "react-native";
import type { ReactNode } from "react";

import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { cx } from "./cx";
import { Icon } from "./Icon";
import { Text } from "./Text";

interface HeaderProps {
  title?: string;
  /** Leave out on tab roots. */
  back?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
  /** Used on a coloured band: white title and back arrow. */
  onSubject?: boolean;
}

/** Back button, title and an optional trailing control; the top row of every pushed screen. */
export function Header({ title, back = true, onBack, trailing, onSubject }: HeaderProps) {
  const { t } = useLocale();
  const { colors } = useTheme();
  return (
    <View className="min-h-14 flex-row items-center gap-2">
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={onBack ?? (() => router.back())}
          className="h-12 w-12 items-center justify-center rounded-full active:scale-90"
        >
          <Icon name="back" color={onSubject ? colors.onSubject : colors.text} />
        </Pressable>
      ) : null}
      <Text
        variant={onSubject ? "lead" : "title"}
        accessibilityRole="header"
        className={cx("flex-1", onSubject && "text-on-subject")}
      >
        {title}
      </Text>
      {trailing}
    </View>
  );
}
