import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Text } from "./Text";

interface ProgressRingProps {
  /** 0 to 100. */
  percent: number;
  size: number;
  stroke: number;
  /** Colour for the arc; the track is the same colour, faded. From the theme colours. */
  color: string;
  /** Short text in the middle. */
  label?: string;
  accessibilityLabel?: string;
}

export function ProgressRing({
  percent,
  size,
  stroke,
  color,
  label,
  accessibilityLabel,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const half = size / 2;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={half}
          cy={half}
          r={radius}
          stroke={color}
          strokeOpacity={0.28}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={half}
          cy={half}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          rotation={-90}
          origin={`${half}, ${half}`}
        />
      </Svg>
      {label ? (
        <View className="absolute">
          <Text variant="caption" className="font-ui-bold" style={{ color }}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
