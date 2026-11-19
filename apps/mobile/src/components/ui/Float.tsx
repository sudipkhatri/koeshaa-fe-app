import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated } from "react-native";
import type { ReactNode } from "react";

/** Gentle 3 second up and down drift for the mascot (prototype `.float`); still when motion is reduced. */
export function Float({ children }: { children: ReactNode }) {
  const [lift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(lift, { toValue: -8, duration: 1500, useNativeDriver: true }),
          Animated.timing(lift, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [lift]);

  return <Animated.View style={{ transform: [{ translateY: lift }] }}>{children}</Animated.View>;
}
