import { Pressable, View } from "react-native";
import type { ReactNode } from "react";

import { Icon, Text } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { useTheme } from "@/lib/theme";

interface OptionCardProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  leading?: ReactNode;
  compact?: boolean;
}

/** Large single-choice card (language, role, stream). */
export function OptionCard({
  title,
  subtitle,
  selected,
  onPress,
  leading,
  compact,
}: OptionCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      className={cx(
        "flex-row items-center gap-4 rounded-card border-2 p-4 active:scale-95",
        compact ? "min-h-16" : "min-h-option",
        selected ? "border-primary bg-primary-tint" : "border-border bg-surface",
      )}
    >
      {leading}
      <View className="flex-1">
        <Text
          variant={compact ? "body" : "title"}
          className={cx(compact && "text-choice font-ui-bold", selected && "text-on-primary-tint")}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" className={cx(selected && "text-on-primary-tint")}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? <Icon name="check" color={colors.onPrimaryTint} /> : null}
    </Pressable>
  );
}
