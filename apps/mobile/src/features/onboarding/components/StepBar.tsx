import { View } from "react-native";

import { cx } from "@/components/ui/cx";
import { useLocale } from "@/lib/locale";

/** Five-segment progress through account creation. */
export function StepBar({ step }: { step: number }) {
  const { t, formatNumber } = useLocale();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t("signup.step", { n: formatNumber(step) })}
      className="mb-1 mt-2 flex-row gap-1.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <View
          key={n}
          className={cx("h-1.5 flex-1 rounded-full", n <= step ? "bg-primary" : "bg-border")}
        />
      ))}
    </View>
  );
}
