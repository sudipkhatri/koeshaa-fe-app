import { Tabs } from "expo-router";

import { TabIcon, useTabBarOptions } from "@/components/ui";
import { useLocale } from "@/lib/locale";

export default function TabsLayout() {
  const { t } = useLocale();
  const options = useTabBarOptions();
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: t("tabs.learn"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="book" color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t("tabs.search"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="search" color={String(color)} focused={focused} />
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
