import { shadow } from "@keoshaa/tokens";
import { View } from "react-native";
import type { ViewProps } from "react-native";

import { useTheme } from "@/lib/theme";

import { cx } from "./cx";

/** The two-layer prototype shadow is a `boxShadow` string, which a class cannot carry per scheme. */
export const cardShadow = {
  light: { boxShadow: shadow.light },
  dark: { boxShadow: shadow.dark },
} as const;

export function Card({ className, style, ...rest }: ViewProps & { className?: string }) {
  const { scheme } = useTheme();
  return (
    <View
      className={cx("rounded-card bg-surface p-4", className)}
      style={[cardShadow[scheme], style]}
      {...rest}
    />
  );
}
