import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Icon, Sheet, Text } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { useTheme } from "@/lib/theme";

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

/** Native-style dropdown: a field that opens a sheet of choices (Expo Go has no picker). */
export function SelectField({ label, value, options, onChange, className }: SelectFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selected ? `${label}: ${selected.label}` : label}
        onPress={() => setOpen(true)}
        className={cx(
          "min-h-14 flex-row items-center justify-between rounded-lg border-2 border-border bg-surface px-3",
          className,
        )}
      >
        <Text
          numberOfLines={1}
          className={cx("flex-1 text-button", !selected && "text-text-muted")}
        >
          {selected?.label ?? label}
        </Text>
        <Icon name="chevd" size={18} color={colors.textMuted} />
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <ScrollView className="max-h-96">
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: option.value === value }}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="min-h-touch flex-row items-center justify-between px-1"
            >
              <Text className={cx(option.value === value && "font-ui-bold text-primary")}>
                {option.label}
              </Text>
              {option.value === value ? (
                <Icon name="check" size={20} color={colors.primary} />
              ) : (
                <View />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>
    </>
  );
}
