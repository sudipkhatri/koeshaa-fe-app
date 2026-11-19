import { Pressable } from "react-native";

import { cx } from "./cx";
import { Text } from "./Text";

interface LinkButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  className?: string;
  /** Smaller text for inline use, e.g. inside a banner. */
  small?: boolean;
}

/** Text-only action in the primary colour (prototype `.link`): semibold, 48 point touch target. */
export function LinkButton({
  title,
  onPress,
  disabled,
  accessibilityLabel,
  className,
  small,
}: LinkButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cx("min-h-touch justify-center px-1", className)}
    >
      <Text
        className={cx(
          "font-ui-semibold text-primary",
          small ? "text-caption" : "text-body",
          disabled && "opacity-60",
        )}
      >
        {title}
      </Text>
    </Pressable>
  );
}
