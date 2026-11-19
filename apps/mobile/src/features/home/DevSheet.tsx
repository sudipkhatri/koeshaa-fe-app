import { router } from "expo-router";

import { Button, Sheet } from "@/components/ui";
import { useLocale } from "@/lib/locale";

interface DevSheetProps {
  visible: boolean;
  onClose: () => void;
  onSkeleton: () => void;
  onOffline: () => void;
}

/** Developer shortcuts (long-press the avatar in a dev build): start onboarding, the kit, demo states. */
export function DevSheet({ visible, onClose, onSkeleton, onOffline }: DevSheetProps) {
  const { t } = useLocale();
  const run = (action: () => void) => () => {
    onClose();
    action();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title={t("dev.title")}>
      <Button title={t("dev.onboarding")} onPress={run(() => router.push("/onboarding"))} />
      <Button title={t("dev.kit")} variant="secondary" onPress={run(() => router.push("/kit"))} />
      <Button title={t("dev.skeleton")} variant="secondary" onPress={run(onSkeleton)} />
      <Button title={t("dev.offline")} variant="secondary" onPress={run(onOffline)} />
    </Sheet>
  );
}
