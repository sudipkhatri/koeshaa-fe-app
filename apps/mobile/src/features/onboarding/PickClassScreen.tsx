import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Banner, Button, Header, Screen, StateView, Text } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { useClassInfo, usePickClass } from "@/features/enrollment/api";
import { errorMessage, isNetworkError } from "@/lib/errors";
import { useLocale } from "@/lib/locale";

const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
const STREAM_FROM = 11;
const ROWS = [CLASSES.slice(0, 4), CLASSES.slice(4, 8), CLASSES.slice(8, 12)];

export function PickClassScreen() {
  const { t, formatNumber, formatClock } = useLocale();
  const current = useClassInfo();
  const pick = usePickClass();
  const [chosen, setChosen] = useState<number | null>(null);
  const cls = chosen ?? current.data?.grade ?? 0;

  if (current.isError) {
    return (
      <Screen edges={["top", "bottom"]}>
        <Header title={t("pick.classTitle")} />
        <StateView
          kind={isNetworkError(current.error) ? "offline" : "error"}
          onRetry={() => void current.refetch()}
        />
      </Screen>
    );
  }

  const next = () => {
    if (cls >= STREAM_FROM) {
      return router.push({ pathname: "/onboarding/pick-stream", params: { grade: String(cls) } });
    }
    pick.mutate({ grade: cls, stream: null }, { onSuccess: () => router.replace("/home") });
  };
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("common.continue")}
          size="lg"
          disabled={cls === 0 || current.isPending}
          loading={pick.isPending}
          onPress={next}
        />
      }
    >
      <Header title={t("pick.classTitle")} />
      <Text muted className="mb-4 mt-2">
        {t("pick.classSub")}
      </Text>
      {pick.error ? (
        <Banner tone="danger" className="mb-3">
          {errorMessage(pick.error, t, formatClock)}
        </Banner>
      ) : null}
      <View className="gap-3">
        {ROWS.map((row) => (
          <View key={row[0]} className="flex-row gap-3">
            {row.map((n) => (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={t("common.classN", { n: formatNumber(n) })}
                accessibilityState={{ selected: cls === n }}
                onPress={() => {
                  setChosen(n);
                  pick.reset();
                }}
                className={cx(
                  "h-16 flex-1 items-center justify-center rounded-cell border-2",
                  cls === n ? "border-primary bg-primary" : "border-border bg-surface",
                )}
              >
                <Text variant="title" className={cx(cls === n && "text-on-primary")}>
                  {formatNumber(n)}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}
