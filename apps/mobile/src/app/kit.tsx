import { Redirect } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import {
  Button,
  Card,
  Chip,
  ListRow,
  Mascot,
  Screen,
  Sheet,
  StateView,
  SubjectTile,
  Text,
  TextField,
} from "@/components/ui";
import { useLocale } from "@/lib/locale";
import { themePreferences } from "@/lib/preferences";
import type { ThemePreference } from "@/lib/preferences";
import { useTheme } from "@/lib/theme";
import type { MessageKey } from "@keoshaa/i18n";
import type { StateKind } from "@/components/ui/StateView";

const themeLabel: Record<ThemePreference, MessageKey> = {
  system: "settings.themeSystem",
  light: "settings.themeLight",
  dark: "settings.themeDark",
};

const stateLabel: Record<StateKind, MessageKey> = {
  loading: "kit.stateLoading",
  empty: "kit.stateEmpty",
  error: "kit.stateError",
  offline: "kit.stateOffline",
};

/** Dev-only gallery of every building block, for checking light/dark and English/Nepali by eye. */
export default function KitScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Kit />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6 gap-3">
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Kit() {
  const { t, locale, setLocale, formatNumber } = useLocale();
  const { preference, setPreference } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [state, setState] = useState<StateKind>("empty");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("aarav@");
  const chapters = t("kit.chapters", { count: formatNumber(12) });

  return (
    <Screen scroll>
      <Text variant="headline" accessibilityRole="header">
        {t("kit.title")}
      </Text>
      <Text muted>{t("kit.intro")}</Text>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {themePreferences.map((option) => (
          <Chip
            key={option}
            label={t(themeLabel[option])}
            tone={preference === option ? "primary" : "neutral"}
            onPress={() => setPreference(option)}
          />
        ))}
        <Chip
          label="English"
          tone={locale === "en" ? "primary" : "neutral"}
          onPress={() => setLocale("en")}
        />
        <Chip
          label="नेपाली"
          tone={locale === "ne" ? "primary" : "neutral"}
          onPress={() => setLocale("ne")}
        />
      </View>

      <Section title={t("kit.buttons")}>
        <Button title={t("kit.primary")} onPress={() => undefined} size="lg" />
        <Button title={t("kit.secondary")} variant="secondary" onPress={() => undefined} />
        <Button title={t("kit.ghost")} variant="ghost" onPress={() => undefined} />
        <Button title={t("kit.danger")} variant="danger" icon="trash" onPress={() => undefined} />
        <Button title={t("kit.loadingButton")} loading />
        <Button title={t("kit.disabledButton")} disabled />
      </Section>

      <Section title={t("kit.chips")}>
        <View className="flex-row flex-wrap gap-2">
          <Chip label={t("kit.chipPrimary")} icon="spark" />
          <Chip label={t("kit.chipReward")} tone="reward" icon="flame" />
          <Chip label={t("kit.chipSuccess")} tone="success" icon="check" />
          <Chip label={t("kit.chipDanger")} tone="danger" icon="warn" />
          <Chip label={t("kit.chipNeutral")} tone="neutral" icon="lock" />
        </View>
      </Section>

      <Section title={t("kit.cards")}>
        <Card>
          <Text>{t("kit.cardText")}</Text>
        </Card>
        <ListRow
          icon="cap"
          title={t("kit.rowTitle")}
          subtitle={t("kit.rowSubtitle")}
          onPress={() => undefined}
        />
        <ListRow
          icon="video"
          iconTone="danger"
          title={t("kit.rowTitle")}
          subtitle={t("kit.rowSubtitle")}
          trailing={<Chip label={t("kit.chipSuccess")} tone="success" />}
        />
      </Section>

      <Section title={t("kit.fields")}>
        <TextField
          label={t("kit.phoneLabel")}
          prefix="+977"
          placeholder={t("kit.phonePlaceholder")}
          keyboardType="phone-pad"
        />
        <TextField
          label={t("kit.passwordLabel")}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextField
          label={t("kit.emailLabel")}
          value={email}
          onChangeText={setEmail}
          error={t("kit.emailError")}
        />
      </Section>

      <Section title={t("kit.subjects")}>
        <View className="flex-row gap-3">
          <SubjectTile
            subject="science"
            title={t("kit.science")}
            subtitle={chapters}
            progress={40}
          />
          <SubjectTile subject="maths" title={t("kit.maths")} subtitle={chapters} progress={20} />
        </View>
        <View className="flex-row gap-3">
          <SubjectTile subject="english" title={t("kit.english")} subtitle={chapters} />
          <SubjectTile subject="nepali" title={t("kit.nepali")} subtitle={chapters} />
        </View>
        <View className="flex-row gap-3">
          <SubjectTile subject="social" title={t("kit.social")} subtitle={chapters} />
          <SubjectTile subject="health" title={t("kit.health")} subtitle={chapters} />
        </View>
      </Section>

      <Section title={t("kit.sheet")}>
        <Button title={t("kit.openSheet")} variant="secondary" onPress={() => setSheetOpen(true)} />
        <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title={t("kit.sheetTitle")}>
          <Text muted>{t("kit.sheetBody")}</Text>
          <Button title={t("ui.close")} onPress={() => setSheetOpen(false)} />
        </Sheet>
      </Section>

      <Section title={t("kit.states")}>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(stateLabel) as StateKind[]).map((kind) => (
            <Chip
              key={kind}
              label={t(stateLabel[kind])}
              tone={state === kind ? "primary" : "neutral"}
              onPress={() => setState(kind)}
            />
          ))}
        </View>
        <StateView kind={state} onRetry={() => undefined} />
      </Section>

      <Section title={t("kit.mascot")}>
        <View className="flex-row flex-wrap gap-4">
          <Mascot mood="happy" size={96} />
          <Mascot mood="cheer" size={96} />
          <Mascot mood="sleepy" size={96} />
          <Mascot mood="sad" size={96} />
        </View>
      </Section>
    </Screen>
  );
}
