import { Pressable, View } from "react-native";
import type { ReactNode } from "react";

import { useTheme } from "@/lib/theme";

import { cardShadow } from "./Card";
import { cx } from "./cx";
import { Icon } from "./Icon";
import type { IconName } from "./icon-paths";
import { Text } from "./Text";

/** Grouped settings list: one rounded surface with hairline-separated rows. */
export function Group({ children }: { children: ReactNode }) {
  const { scheme } = useTheme();
  return (
    <View className="overflow-hidden rounded-card bg-surface" style={cardShadow[scheme]}>
      {children}
    </View>
  );
}

const squareFill = {
  primary: "bg-primary",
  grape: "bg-subject-health",
  sky: "bg-subject-social",
  green: "bg-subject-science",
  danger: "bg-danger-fill",
  neutral: "bg-text-muted",
} as const;
export type SquareTone = keyof typeof squareFill;

interface GroupRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconTone?: SquareTone;
  /** Replaces the chevron, e.g. a switch. */
  trailing?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  first?: boolean;
}

export function GroupRow({
  title,
  subtitle,
  icon,
  iconTone = "primary",
  trailing,
  onPress,
  danger,
  first,
}: GroupRowProps) {
  const { colors } = useTheme();
  const body = (
    <>
      {icon ? (
        <View
          className={cx("h-9 w-9 items-center justify-center rounded-square", squareFill[iconTone])}
        >
          <Icon name={icon} size={20} color={colors.onSubject} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className={cx("font-ui-semibold", danger && "text-on-danger-tint")}>{title}</Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
      {trailing ?? (onPress ? <Icon name="chev" size={20} color={colors.textMuted} /> : null)}
    </>
  );
  const box = cx(
    "min-h-row flex-row items-center gap-3 px-4 py-2",
    !first && "border-t border-border",
  );
  if (!onPress) return <View className={box}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      className={cx(box, "active:bg-surface-muted")}
    >
      {body}
    </Pressable>
  );
}
