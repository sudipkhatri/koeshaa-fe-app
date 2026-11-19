import { ActivityIndicator, Pressable } from "react-native";

import { useTheme } from "@/lib/theme";

import { cx } from "./cx";
import { Icon } from "./Icon";
import type { IconName } from "./icon-paths";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const box: Record<Variant, string> = {
  primary: "bg-primary active:bg-primary-pressed",
  secondary: "bg-surface border-2 border-border",
  ghost: "bg-transparent",
  danger: "bg-danger-fill",
};

const label: Record<Variant, string> = {
  primary: "text-on-primary",
  secondary: "text-primary",
  ghost: "text-primary",
  danger: "text-on-danger-fill",
};

const sizeClass: Record<Size, string> = {
  md: "min-h-button px-6 py-2",
  lg: "min-h-16 px-8 py-3",
};

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
  className,
}: ButtonProps) {
  const { colors } = useTheme();
  const inert = disabled || loading;
  const ink = {
    primary: colors.onPrimary,
    secondary: colors.primary,
    ghost: colors.primary,
    danger: colors.onDangerFill,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={onPress}
      className={cx(
        "flex-row items-center justify-center gap-2 rounded-full active:scale-95",
        box[variant],
        sizeClass[size],
        inert && "opacity-50",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={ink} />
      ) : icon ? (
        <Icon name={icon} size={20} color={ink} />
      ) : null}
      <Text className={cx("text-button font-ui-bold text-center", label[variant])}>{title}</Text>
    </Pressable>
  );
}
