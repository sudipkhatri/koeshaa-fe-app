import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { cx } from "./cx";
import { Icon } from "./Icon";
import { Text } from "./Text";

interface TextFieldProps extends Pick<
  TextInputProps,
  | "value"
  | "onChangeText"
  | "placeholder"
  | "keyboardType"
  | "autoComplete"
  | "autoCapitalize"
  | "autoCorrect"
  | "maxLength"
  | "returnKeyType"
  | "onSubmitEditing"
> {
  label: string;
  error?: string;
  hint?: string;
  /** Password style: hides the text and shows a show/hide control. */
  secureTextEntry?: boolean;
  /** Fixed leading badge such as a country code. */
  prefix?: string;
}

export function TextField({
  label,
  error,
  hint,
  secureTextEntry,
  prefix,
  ...input
}: TextFieldProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const hidden = secureTextEntry && !revealed;

  return (
    <View>
      <Text className="mb-2 font-ui-semibold">{label}</Text>
      <View
        className={cx(
          "min-h-14 flex-row items-center gap-2 rounded-lg border-2 bg-surface pl-4 pr-1",
          error ? "border-danger" : focused ? "border-primary" : "border-border",
        )}
      >
        {prefix ? (
          <View className="rounded-full bg-primary-tint px-2.5 py-0.5">
            <Text variant="small" className="font-ui-bold text-on-primary-tint">
              {prefix}
            </Text>
          </View>
        ) : null}
        <TextInput
          {...input}
          accessibilityLabel={label}
          accessibilityHint={error}
          secureTextEntry={hidden}
          {...(secureTextEntry
            ? {
                textContentType: "password" as const,
                autoComplete: input.autoComplete ?? "current-password",
              }
            : {})}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-button flex-1 font-ui text-button text-text"
          placeholderTextColor={colors.textMuted}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(revealed ? "ui.hidePassword" : "ui.showPassword")}
            onPress={() => setRevealed((value) => !value)}
            className="h-12 w-12 items-center justify-center"
          >
            <Icon name={revealed ? "eyeoff" : "eye"} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View className="mt-3 rounded-lg bg-danger-tint px-4 py-3">
          <Text
            variant="body"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            className="font-ui-medium text-on-danger-tint"
          >
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="small" className="mt-2">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
