import { View } from "react-native";
import { SvgXml } from "react-native-svg";

/** The Keoshaa mark: teal K and gold stroke on the cream field. */
const mark =
  '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="58" fill="#F6EBD9"/><path fill="#056B67" d="M30 22h18v76H30zM48 58l36-32h16L62 62l40 36H84L48 70z"/><path fill="#E9AB34" d="M86 22h22L98 38H86z"/></svg>';

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
