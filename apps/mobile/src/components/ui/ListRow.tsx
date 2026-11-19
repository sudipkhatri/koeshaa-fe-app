import { Pressable, View } from "react-native";
import type { ReactNode } from "react";

import { useTheme } from "@/lib/theme";

import { cardShadow } from "./Card";
import { cx } from "./cx";
import { Icon } from "./Icon";
import type { IconName } from "./icon-paths";
import { Text } from "./Text";
import { toneStyle } from "./tone";
import type { Tone } from "./tone";

interface ListRowProps {
  title: string;
  /** Replaces the plain title text, e.g. to highlight a search match. Title stays the spoken label. */
  titleContent?: ReactNode;
  subtitle?: string;
  /** Replaces the icon box, e.g. a number badge. */
  leading?: ReactNode;
  /** Sits before the chevron, e.g. a status. */
  badge?: ReactNode;
  icon?: IconName;
  iconTone?: Tone;
  /** Replaces the chevron, e.g. a Chip or a switch. */
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function ListRow({
  title,
  titleContent,
  subtitle,
  leading,
  badge,
  icon,
  iconTone = "primary",
  trailing,
  onPress,
  accessibilityLabel,
}: ListRowProps) {
  const { colors, scheme } = useTheme();
  const tone = toneStyle[iconTone];

  const content = (
    <>
      {leading ?? null}
      {icon && !leading ? (
        <View className={cx("h-10 w-10 items-center justify-center rounded-md", tone.box)}>
          <Icon name={icon} size={22} color={colors[tone.ink]} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="font-ui-semibold">{titleContent ?? title}</Text>
        {subtitle ? <Text variant="small">{subtitle}</Text> : null}
      </View>
      {badge}
      {trailing ?? (onPress ? <Icon name="chev" size={20} color={colors.textMuted} /> : null)}
    </>
  );
  const base = "min-h-16 flex-row items-center gap-3 rounded-xl bg-surface px-4 py-2";

  if (!onPress) {
    return (
      <View className={base} style={cardShadow[scheme]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
      onPress={onPress}
      className={cx(base, "active:scale-95")}
      style={cardShadow[scheme]}
    >
      {content}
    </Pressable>
  );
}
