import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";
import type { ReactNode } from "react";

import { cx } from "./cx";

interface ScreenProps {
  children: ReactNode;
  /** Scrolls the content; use for anything that can be taller than the screen. */
  scroll?: boolean;
  /** Edges to keep clear of the status bar and notch. Tab screens drop `bottom`. */
  edges?: readonly Edge[];
  /** Pinned under the content, e.g. the main action. */
  footer?: ReactNode;
  className?: string;
}

export function Screen({ children, scroll, edges, footer, className }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={edges}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={className ?? "px-4 pb-6 pt-2"}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cx("flex-1", className ?? "px-4 pt-2")}>{children}</View>
      )}
      {footer ? <View className="gap-2 px-4 pb-4 pt-3">{footer}</View> : null}
    </SafeAreaView>
  );
}
