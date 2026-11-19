import { SvgXml } from "react-native-svg";

import { useTheme } from "@/lib/theme";

/** Open book with a star, drawn from the prototype with the theme colours. */
export function HeroArt({ size = 116 }: { size?: number }) {
  const { colors } = useTheme();
  const xml =
    `<svg viewBox="0 0 120 120"><circle cx="64" cy="58" r="44" fill="${colors.onSubject}" opacity=".16"/>` +
    `<path d="M14 40q22-8 46 4v52q-24-12-46-4z" fill="${colors.onSubject}"/>` +
    `<path d="M106 40q-22-8-46 4v52q24 12 46-4z" fill="${colors.primaryTint}"/>` +
    `<path d="M60 44v52" stroke="${colors.primaryPressed}" stroke-width="3"/>` +
    `<path d="M26 58q14-4 24 2M26 70q14-4 24 2" stroke="${colors.primary}" stroke-width="4" stroke-linecap="round" fill="none" opacity=".5"/>` +
    `<path d="M92 8l5 11 12 2-9 8 3 12-11-6-11 6 3-12-9-8 12-2z" fill="${colors.reward}"/></svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}
