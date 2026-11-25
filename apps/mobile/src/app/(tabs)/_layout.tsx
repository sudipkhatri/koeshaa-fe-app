import { Tabs } from "expo-router";

import { TabIcon, useTabBarOptions } from "@/components/ui";
import { useProfile } from "@/features/me/api";
import { useLocale } from "@/lib/locale";

export default function TabsLayout() {
  const { t } = useLocale();
  const options = useTabBarOptions();
  const profile = useProfile();
  const isParent = profile.data?.role === "parent";

  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen
        name="home"
        options={{
          title: isParent ? t("tabs.children") : t("tabs.home"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={isParent ? "heart" : "home"} color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: t("tabs.learn"),
          href: isParent ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="book" color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t("tabs.search"),
          href: isParent ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="search" color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: t("tabs.alerts"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="bell" color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: t("tabs.me"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={String(color)} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
