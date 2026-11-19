import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import { useTheme } from "@/lib/theme";

import { iconPaths } from "./icon-paths";
import type { IconName } from "./icon-paths";

interface IconProps {
  name: IconName;
  size?: number;
  /** Hex from the theme colours; defaults to the text colour. */
  color?: string;
}

/** Decorative icon: hidden from screen readers. Put the label on the control around it. */
export function Icon({ name, size = 24, color }: IconProps) {
  const { colors } = useTheme();
  const xml =
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round">${iconPaths[name]}</svg>`;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SvgXml xml={xml} width={size} height={size} color={color ?? colors.text} />
    </View>
  );
}
