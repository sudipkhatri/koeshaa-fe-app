import { Pressable, View } from "react-native";
import type { ReactNode } from "react";

import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { cx } from "./cx";
import { Icon } from "./Icon";
import type { IconName } from "./icon-paths";
import { Text } from "./Text";

type BannerTone = "neutral" | "success" | "danger";

const toneBox: Record<BannerTone, string> = {
  neutral: "bg-surface-muted",
  success: "bg-success-tint",
  danger: "bg-danger-tint",
};
const toneText: Record<BannerTone, string> = {
  neutral: "text-text",
  success: "text-on-success-tint",
  danger: "text-on-danger-tint",
};

interface BannerProps {
  icon?: IconName;
  tone?: BannerTone;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

/** A slim notice: icon, short text and an optional dismiss control. */
export function Banner({ icon, tone = "neutral", children, onDismiss, className }: BannerProps) {
  const { t } = useLocale();
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole={tone === "danger" ? "alert" : undefined}
      accessibilityLiveRegion={tone === "danger" ? "assertive" : undefined}
      accessible={tone === "danger" && !onDismiss ? true : undefined}
      className={cx(
        "flex-row items-center gap-2 rounded-lg",
        tone === "danger" ? "px-4 py-3" : "py-2 pl-3",
        toneBox[tone],
        !onDismiss && tone !== "danger" && "pr-3",
        className,
      )}
    >
      {icon ? <Icon name={icon} size={20} color={colors.textMuted} /> : null}
      <Text
        variant={tone === "danger" ? "body" : "caption"}
        className={cx("flex-1", tone === "danger" && "font-ui-medium", toneText[tone])}
      >
        {children}
      </Text>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.dismiss")}
          onPress={onDismiss}
          className="h-11 w-11 items-center justify-center"
        >
          <Icon name="x" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
