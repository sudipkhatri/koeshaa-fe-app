import { Modal, Pressable, View } from "react-native";
import type { ReactNode } from "react";

import { useLocale } from "@/lib/locale";

import { Text } from "./Text";

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Bottom sheet: dims the screen, closes on backdrop tap, Android back or the close control. */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const { t } = useLocale();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" accessibilityViewIsModal>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("ui.close")}
          onPress={onClose}
          className="absolute inset-0 bg-overlay"
        />
        <View className="max-h-full gap-3 rounded-t-sheet bg-background px-6 pb-6 pt-3">
          <View className="mb-1 h-1 w-11 self-center rounded-full bg-border" />
          {title ? (
            <Text variant="heading" accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}
