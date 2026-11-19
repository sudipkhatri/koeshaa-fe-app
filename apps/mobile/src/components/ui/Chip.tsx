import { Pressable, View } from "react-native";

import { useTheme } from "@/lib/theme";

import { cardShadow } from "./Card";
import { cx } from "./cx";
import { Icon } from "./Icon";
import type { IconName } from "./icon-paths";
import { Text } from "./Text";
import { toneStyle } from "./tone";
import type { Tone } from "./tone";

/** `pill`: 13 bold status label (class, streak). `chip`: 14 semibold choice or action. `tiny`: 12 bold badge. */
type Variant = "pill" | "chip" | "tiny";

interface ChipProps {
  label: string;
  tone?: Tone;
  icon?: IconName;
  variant?: Variant;
  /** Icon after the label, e.g. a chevron on the class picker. */
  trailingIcon?: IconName;
  /** Makes the chip a button. */
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
}

const textClass: Record<Variant, string> = {
  pill: "text-caption font-ui-bold",
  chip: "text-small font-ui-semibold",
  tiny: "text-micro font-ui-bold",
};

export function Chip({
  label,
  tone = "primary",
  icon,
  variant = "pill",
  trailingIcon,
  onPress,
  accessibilityLabel,
  className,
}: ChipProps) {
  const { colors, scheme } = useTheme();
  const style = toneStyle[tone];
  const iconSize = variant === "tiny" ? 14 : variant === "pill" ? 16 : 14;
  const textStyle = cx(
    textClass[variant],
    onPress && variant === "pill" && "text-small",
    style.text,
  );
  const content = (
    <>
      {icon ? <Icon name={icon} size={iconSize} color={colors[style.ink]} /> : null}
      <Text className={textStyle}>{label}</Text>
      {trailingIcon ? <Icon name={trailingIcon} size={16} color={colors[style.ink]} /> : null}
    </>
  );
  const height = variant === "tiny" ? "min-h-6" : onPress ? "min-h-10" : "min-h-8";
  const base = cx(
    "flex-row items-center gap-1 self-start rounded-full",
    variant === "tiny" ? "px-2.5" : "px-3",
    height,
    style.box,
    className,
  );
  const shadowStyle = tone === "surface" ? cardShadow[scheme] : undefined;

  if (!onPress) {
    return (
      <View
        accessible={accessibilityLabel ? true : undefined}
        accessibilityLabel={accessibilityLabel}
        className={base}
        style={shadowStyle}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      hitSlop={4}
      className={cx(base, "active:scale-95")}
      style={shadowStyle}
    >
      {content}
    </Pressable>
  );
}
