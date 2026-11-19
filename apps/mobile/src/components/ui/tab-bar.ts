import { fontFamily, fontSize } from "@keoshaa/tokens";
import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";

import { useTheme } from "@/lib/theme";

type TabBarOptions = Extract<ComponentProps<typeof Tabs>["screenOptions"], object>;

/**
 * Prototype tab bar look for Expo Router `<Tabs screenOptions={useTabBarOptions()} />`:
 * surface bar with a top border, muted labels, and the selected tab in the primary tint (the pill behind its icon is drawn by `TabIcon`).
 * Navigator options take colour values, not classes, so they come from the theme colours.
 */
export function useTabBarOptions(): TabBarOptions {
  const { colors } = useTheme();
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.onPrimaryTint,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 64 },
    tabBarItemStyle: { marginVertical: 6 },
    tabBarLabelStyle: { fontFamily: fontFamily.semibold, fontSize: fontSize.caption },
  };
}
