import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated } from "react-native";

import { cx } from "./cx";

/** A pulsing placeholder block; holds still when the system asks for reduced motion. */
export function Skeleton({ className }: { className?: string }) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity]);

  return <Animated.View className={cx("rounded-tile bg-border", className)} style={{ opacity }} />;
}
