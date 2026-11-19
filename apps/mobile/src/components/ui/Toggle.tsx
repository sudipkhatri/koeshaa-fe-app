import { Pressable, View } from "react-native";

import { cx } from "./cx";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
}

/** The prototype switch: 52 by 32 track (mint when on) with a 24 point white knob. */
export function Toggle({ value, onValueChange, accessibilityLabel }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      className={cx(
        "h-8 w-toggle justify-center rounded-full px-1",
        value ? "bg-success" : "bg-border",
      )}
    >
      <View
        className={cx("h-6 w-6 rounded-full bg-on-subject", value && "self-end")}
        style={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)" }}
      />
    </Pressable>
  );
}
