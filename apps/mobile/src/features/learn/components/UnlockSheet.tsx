import { View } from "react-native";

import { Button, Mascot, Sheet, Text } from "@/components/ui";
import { useLocale } from "@/lib/locale";
import { useToast } from "@/lib/toast";

interface UnlockSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Plans are not built yet: locked chapters explain that and offer to be told later. */
export function UnlockSheet({ visible, onClose }: UnlockSheetProps) {
  const { t } = useLocale();
  const toast = useToast();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="items-center">
        <Mascot size={90} />
      </View>
      <Text variant="heading" accessibilityRole="header" className="text-center">
        {t("learn.unlockTitle")}
      </Text>
      <Text muted className="text-center">
        {t("learn.unlockBody")}
      </Text>
      <Button
        title={t("learn.notify")}
        onPress={() => {
          onClose();
          toast(t("learn.notifyToast"));
        }}
      />
      <Button title={t("learn.keepExploring")} variant="ghost" onPress={onClose} />
    </Sheet>
  );
}
