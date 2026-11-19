import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

export type MascotMood = "happy" | "cheer" | "sleepy" | "sad";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
}

/** Kiko, the Keoshaa mascot, drawn from the prototype with the current theme colours. */
export function Mascot({ mood = "happy", size = 120 }: MascotProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { primary, reward, mascotEyes: eyes } = colors;

  const eyeShapes =
    mood === "sleepy"
      ? `<path d="M42 58q6 5 12 0M66 58q6 5 12 0" stroke="${eyes}" fill="none" stroke-width="3.5" stroke-linecap="round"/>`
      : `<circle cx="48" cy="56" r="9" fill="#fff"/><circle cx="72" cy="56" r="9" fill="#fff"/>` +
        `<circle cx="49" cy="57" r="4.5" fill="${eyes}"/><circle cx="73" cy="57" r="4.5" fill="${eyes}"/>`;
  const mouth =
    mood === "sad"
      ? `<path d="M50 82q10-8 20 0" stroke="${eyes}" fill="none" stroke-width="3.5" stroke-linecap="round"/>`
      : mood === "cheer"
        ? `<path d="M48 74q12 18 24 0z" fill="${eyes}"/>`
        : `<path d="M49 74q11 12 22 0" stroke="${eyes}" fill="none" stroke-width="3.5" stroke-linecap="round"/>`;
  const arms =
    mood === "cheer"
      ? `<path d="M16 68q-8-14 0-26M104 68q8-14 0-26" stroke="${primary}" fill="none" stroke-width="3.5" stroke-linecap="round"/>`
      : "";

  const xml =
    `<svg viewBox="0 0 120 120"><ellipse cx="60" cy="112" rx="30" ry="5" fill="#000" opacity=".12"/>${arms}` +
    `<path d="M60 18V8" stroke="${reward}" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="60" cy="8" r="6" fill="${reward}"/><circle cx="60" cy="64" r="46" fill="${primary}"/>` +
    `<ellipse cx="60" cy="80" rx="30" ry="22" fill="#fff" opacity=".22"/>${eyeShapes}` +
    `<circle cx="36" cy="72" r="6" fill="${reward}" opacity=".75"/><circle cx="84" cy="72" r="6" fill="${reward}" opacity=".75"/>${mouth}</svg>`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t("ui.mascot")}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}
