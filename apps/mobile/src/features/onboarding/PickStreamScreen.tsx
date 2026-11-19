import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Banner, Button, Header, Screen, Text } from "@/components/ui";
import { usePickClass } from "@/features/enrollment/api";
import { streamIds } from "@/features/session";
import type { StreamId } from "@/features/session";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";

import { OptionCard } from "./components/OptionCard";
import { parseStreamGrade } from "./route-params";

export function PickStreamScreen() {
  const { t, formatNumber, formatClock } = useLocale();
  const { grade } = useLocalSearchParams();
  const cls = parseStreamGrade(grade);
  const [stream, setStream] = useState<StreamId | null>(null);
  const pick = usePickClass();
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("pick.start")}
          size="lg"
          disabled={!stream}
          loading={pick.isPending}
          onPress={() =>
            pick.mutate({ grade: cls, stream }, { onSuccess: () => router.replace("/home") })
          }
        />
      }
    >
      <Header title={t("pick.streamTitle")} />
      <Text muted className="mb-4 mt-2">
        {t("pick.streamSub", { n: formatNumber(cls) })}
      </Text>
      {pick.error ? (
        <Banner tone="danger" className="mb-3">
          {errorMessage(pick.error, t, formatClock)}
        </Banner>
      ) : null}
      <View className="gap-3">
        {streamIds.map((id) => (
          <OptionCard
            key={id}
            compact
            title={t(`pick.${id}`)}
            selected={stream === id}
            onPress={() => setStream(id)}
          />
        ))}
      </View>
    </Screen>
  );
}
