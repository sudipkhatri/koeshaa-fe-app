import { useRef } from "react";
import { TextInput, View } from "react-native";

import { useLocale } from "@/lib/locale";

import { CODE_LENGTH } from "../mock";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** Six single-digit boxes; typing moves forward, backspace moves back, a pasted code fills all. */
export function CodeInput({ value, onChange }: CodeInputProps) {
  const { t, formatNumber } = useLocale();
  const refs = useRef<(TextInput | null)[]>([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? "");

  const change = (index: number, text: string) => {
    const typed = text.replace(/\D/g, "");
    if (typed.length > 1) {
      onChange(typed.slice(0, CODE_LENGTH));
      refs.current[Math.min(typed.length, CODE_LENGTH) - 1]?.focus();
      return;
    }
    const next = digits.slice();
    next[index] = typed;
    onChange(next.join(""));
    if (typed && index < CODE_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  return (
    <View className="my-6 flex-row justify-center gap-2">
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          onChangeText={(text) => change(index, text)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Backspace" && !digit && index > 0)
              refs.current[index - 1]?.focus();
          }}
          accessibilityLabel={t("code.digit", { n: formatNumber(index + 1) })}
          keyboardType="number-pad"
          textContentType={index === 0 ? "oneTimeCode" : "none"}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={index === 0}
          maxLength={index === 0 ? CODE_LENGTH : 1}
          selectTextOnFocus
          className="h-codeBox w-12 rounded-tile border-2 border-border bg-surface p-0 text-center font-ui-bold text-lead text-text focus:border-primary"
        />
      ))}
    </View>
  );
}
