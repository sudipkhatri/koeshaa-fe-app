import { View } from "react-native";
import { SvgXml } from "react-native-svg";

/** The Keoshaa logo mark ("Book buddy") from assets/brand/book-buddy.svg on its indigo tile. */
const mark =
  '<svg viewBox="0 0 120 120"><path d="M60 36 C48 28 33 28 21 32 V84 C33 80 48 80 60 88 Z" fill="#FFFFFF"/><path d="M60 36 C72 28 87 28 99 32 V84 C87 80 72 80 60 88 Z" fill="#E0E7FF"/><circle cx="44" cy="54" r="5" fill="#1B1F3B"/><circle cx="76" cy="54" r="5" fill="#1B1F3B"/><circle cx="45.5" cy="52.5" r="1.6" fill="#FFFFFF"/><circle cx="77.5" cy="52.5" r="1.6" fill="#FFFFFF"/><path d="M48 68 Q60 77 72 68" stroke="#4F46E5" stroke-width="4.5" stroke-linecap="round" fill="none"/><circle cx="36" cy="64" r="3.5" fill="#F9A8D4"/><circle cx="84" cy="64" r="3.5" fill="#F9A8D4"/><circle cx="96" cy="22" r="6" fill="#FFC83D"/></svg>';

export function BookBuddy({ size = 96, label }: { size?: number; label: string }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      className="items-center justify-center overflow-hidden rounded-card bg-hero"
      style={{ width: size, height: size }}
    >
      <SvgXml xml={mark} width={size} height={size} />
    </View>
  );
}
