import { View } from "react-native";

import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { Button } from "./Button";
import { Icon } from "./Icon";
import { Mascot } from "./Mascot";
import type { MascotMood } from "./Mascot";
import { Skeleton } from "./Skeleton";
import { Text } from "./Text";

export type StateKind = "loading" | "empty" | "error" | "offline";

interface StateViewProps {
  kind: StateKind;
  /** Called by the Try again button (error and no connection). */
  onRetry?: () => void;
  /** Overrides the default copy for empty and error. */
  title?: string;
  message?: string;
  /** Extra action under the message, e.g. "Browse free chapters". */
  action?: { title: string; onPress: () => void };
}

const mood: Record<Exclude<StateKind, "loading">, MascotMood> = {
  empty: "sleepy",
  error: "sad",
  offline: "sleepy",
};

export function StateView({ kind, onRetry, title, message, action }: StateViewProps) {
  const { t } = useLocale();
  const { colors } = useTheme();

  if (kind === "loading") {
    return (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t("ui.loading")}
        accessibilityState={{ busy: true }}
        className="gap-3 pt-4"
      >
        <Skeleton className="h-36" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </View>
    );
  }

  const copy = {
    empty: { title: t("state.emptyTitle"), message: t("state.emptyMessage") },
    error: { title: t("state.errorTitle"), message: t("state.errorMessage") },
    offline: { title: t("state.offlineTitle"), message: t("state.offlineMessage") },
  }[kind];

  return (
    <View className="items-center gap-3 px-2 pt-8">
      <Mascot mood={mood[kind]} size={130} />
      {kind === "offline" ? <Icon name="wifi" size={32} color={colors.textMuted} /> : null}
      <Text variant="headline" accessibilityRole="header" className="text-center">
        {title ?? copy.title}
      </Text>
      <Text muted className="text-center">
        {message ?? copy.message}
      </Text>
      {onRetry && (kind === "error" || kind === "offline") ? (
        <Button title={t("ui.retry")} onPress={onRetry} size="lg" className="mt-4 self-stretch" />
      ) : null}
      {action ? (
        <Button
          title={action.title}
          onPress={action.onPress}
          size="lg"
          className="mt-4 self-stretch"
        />
      ) : null}
    </View>
  );
}
