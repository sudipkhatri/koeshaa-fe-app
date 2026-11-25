import { View } from "react-native";

import { Button, Card, Header, Screen, Text } from "@/components/ui";
import { useLocale } from "@/lib/locale";

/** Shows authenticator recovery codes once. Does not store them; `onSaved` leaves the screen. */
export function BackupCodes({ codes, onSaved }: { codes: readonly string[]; onSaved: () => void }) {
  const { t, formatNumber } = useLocale();
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={<Button title={t("auth.backupSaved")} size="lg" onPress={onSaved} />}
    >
      <Header title={t("auth.backupTitle")} />
      <Text muted>{t("auth.backupBody")}</Text>
      <View className="mt-4 gap-2">
        {codes.map((code, index) => (
          <Card key={`${index}-${code}`}>
            <Text
              selectable
              variant="section"
              accessibilityLabel={t("auth.backupItem", { n: formatNumber(index + 1) })}
            >
              {code}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
