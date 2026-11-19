import { Pressable, View } from "react-native";

import { useTheme } from "@/lib/theme";

import { cardShadow } from "./Card";
import { cx } from "./cx";
import { Text } from "./Text";

interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** Two or three exclusive choices in a pill-shaped control (language, theme). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedProps<T>) {
  const { scheme } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="flex-row gap-1 rounded-full bg-surface-muted p-1"
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(option.value)}
            className={cx(
              "min-h-11 flex-1 items-center justify-center rounded-full",
              on && "bg-surface",
            )}
            style={on ? cardShadow[scheme] : undefined}
          >
            <Text className={cx("font-ui-semibold", on ? "text-primary" : "text-text-muted")}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
