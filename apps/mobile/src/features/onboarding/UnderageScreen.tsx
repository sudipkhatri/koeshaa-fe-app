import { useState } from "react";
import { router } from "expo-router";
import { View } from "react-native";

import { Button, Card, Header, ListRow, Mascot, Screen, Sheet, Text } from "@/components/ui";
import { useSession } from "@/features/session";
import { useLocale } from "@/lib/locale";
import { useToast } from "@/lib/toast";

export function UnderageScreen() {
  const { t } = useLocale();
  const { signup } = useSession();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const shared = (copied: boolean) => {
    setOpen(false);
    toast(copied ? t("underage.copied") : t("underage.ready"));
  };
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <>
          <Button
            title={t("underage.share")}
            icon="share"
            size="lg"
            onPress={() => setOpen(true)}
          />
          <Button title={t("underage.goBack")} variant="ghost" onPress={() => router.back()} />
        </>
      }
    >
      <Header />
      <View className="items-center gap-3 pt-6">
        <Mascot size={130} />
        <Text variant="headline" accessibilityRole="header" className="text-center">
          {t("underage.title")}
        </Text>
        <Text muted className="text-center">
          {t("underage.body")}
        </Text>
      </View>
      <Sheet visible={open} onClose={() => setOpen(false)} title={t("underage.sheetTitle")}>
        <Card className="bg-surface">
          <Text variant="small">
            {t("underage.message", { name: signup.name.trim() || t("underage.someone") })}
          </Text>
        </Card>
        <ListRow title={t("underage.sms")} icon="sms" onPress={() => shared(false)} />
        <ListRow
          title={t("underage.whatsapp")}
          icon="sms"
          iconTone="success"
          onPress={() => shared(false)}
        />
        <ListRow
          title={t("underage.copy")}
          icon="link"
          iconTone="grape"
          onPress={() => shared(true)}
        />
      </Sheet>
    </Screen>
  );
}
