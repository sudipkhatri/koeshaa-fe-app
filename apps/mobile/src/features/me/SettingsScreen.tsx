import { View } from "react-native";
import { useState } from "react";

import { Group, GroupRow, Header, Screen, Segmented, Text, Toggle } from "@/components/ui";
import { themePreferences } from "@/lib/preferences";
import type { ThemePreference } from "@/lib/preferences";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import type { Locale, MessageKey } from "@keoshaa/i18n";

const themeLabel: Record<ThemePreference, MessageKey> = {
  system: "settings.themeSystem",
  light: "settings.themeLight",
  dark: "settings.themeDark",
};

export function SettingsScreen() {
  const { t, locale, setLocale } = useLocale();
  const { preference, setPreference } = useTheme();
  const [notify, setNotify] = useState({ reminders: true, chapters: true, parent: false });
  const rows = [
    ["reminders", "prefs.reminders"],
    ["chapters", "prefs.newChapters"],
    ["parent", "prefs.parentUpdates"],
  ] as const;

  return (
    <Screen scroll edges={["top"]}>
      <Header title={t("me.settings")} />
      <View className="mt-2 gap-2">
        <Text className="mt-2 font-ui-semibold">{t("settings.language")}</Text>
        <Segmented<Locale>
          label={t("settings.language")}
          value={locale}
          onChange={setLocale}
          options={[
            { value: "en", label: t("prefs.english") },
            { value: "ne", label: t("prefs.nepali") },
          ]}
        />
        <Text className="mt-4 font-ui-semibold">{t("settings.theme")}</Text>
        <Segmented<ThemePreference>
          label={t("settings.theme")}
          value={preference}
          onChange={setPreference}
          options={themePreferences.map((value) => ({ value, label: t(themeLabel[value]) }))}
        />
        <Text className="mt-4 font-ui-semibold">{t("prefs.notifications")}</Text>
        <Group>
          {rows.map(([key, label], i) => (
            <GroupRow
              key={key}
              first={i === 0}
              title={t(label)}
              trailing={
                <Toggle
                  accessibilityLabel={t(label)}
                  value={notify[key]}
                  onValueChange={(value) => setNotify({ ...notify, [key]: value })}
                />
              }
            />
          ))}
        </Group>
      </View>
    </Screen>
  );
}
