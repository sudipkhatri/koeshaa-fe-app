import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Dimensions, View } from "react-native";

import { useTheme } from "@/lib/theme";

const PIECES = 30;

function Piece({ index, color }: { index: number; color: string }) {
  const [fall] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(fall, {
        toValue: 1,
        duration: 2400 + ((index * 53) % 16) * 100,
        delay: ((index * 37) % 20) * 100,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [fall, index]);
  const height = Dimensions.get("window").height;
  return (
    <Animated.View
      className="absolute h-4 w-2.5 rounded-piece"
      style={{
        left: `${index * 3.3}%`,
        top: -20,
        backgroundColor: color,
        transform: [
          { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) },
          { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "540deg"] }) },
        ],
      }}
    />
  );
}

/** Falling confetti for the success screen; skipped when the system asks for reduced motion. */
export function Confetti() {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => setShow(!reduce));
  }, []);
  const palette = [
    colors.reward,
    colors.primary,
    colors.success,
    colors.danger,
    colors.subject.health,
    colors.subject.social,
  ];
  if (!show) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0 overflow-hidden"
    >
      {Array.from({ length: PIECES }, (_, i) => (
        <Piece key={i} index={i} color={palette[i % palette.length] ?? colors.primary} />
      ))}
    </View>
  );
}
