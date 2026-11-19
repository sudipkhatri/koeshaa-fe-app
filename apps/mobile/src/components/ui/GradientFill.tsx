import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

interface GradientFillProps {
  from: string;
  to: string;
  /** `vertical` runs top to bottom; `diagonal` is the 135 degree video gradient. */
  direction?: "vertical" | "diagonal";
}

/** Fills its parent with a two-colour gradient behind the content. Colours come from the theme. */
export function GradientFill({ from, to, direction = "vertical" }: GradientFillProps) {
  const end = direction === "vertical" ? { x2: "0", y2: "1" } : { x2: "1", y2: "1" };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" {...end}>
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#fill)" />
      </Svg>
    </View>
  );
}
