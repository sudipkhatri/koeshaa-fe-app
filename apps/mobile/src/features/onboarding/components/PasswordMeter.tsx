import { View } from "react-native";

import { Icon, Text } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { MIN_PASSWORD_LENGTH, passwordScore } from "../rules";

const fill = ["bg-danger", "bg-reward", "bg-success"] as const;
const level = ["password.weak", "password.okay", "password.strong"] as const;

/** Three-bar strength meter and the "at least 8 characters" rule. */
export function PasswordMeter({ value }: { value: string }) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const score = passwordScore(value);
  const ok = value.length >= MIN_PASSWORD_LENGTH;
  const rule = score
    ? t("password.ruleStrength", { level: t(level[score - 1] ?? "password.weak") })
    : t("password.rule");
  return (
    <View accessibilityLiveRegion="polite">
      <View className="mt-3 flex-row gap-1.5">
        {[1, 2, 3].map((n) => (
          <View
            key={n}
            className={cx("h-2 flex-1 rounded-full", score >= n ? fill[score - 1] : "bg-border")}
          />
        ))}
      </View>
      <View className="mt-2 flex-row items-center gap-2">
        <Icon name="check" size={18} color={ok ? colors.success : colors.textMuted} />
        <Text variant="small" className={cx(ok && "text-on-success-tint")}>
          {rule}
        </Text>
      </View>
    </View>
  );
}
