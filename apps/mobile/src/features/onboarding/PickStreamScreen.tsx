import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Banner, Button, Header, Screen, Text } from "@/components/ui";
import { useStartEnrollment } from "@/features/enrollment/api";
import { streamIds } from "@/features/session";
import type { StreamId } from "@/features/session";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";

import { OptionCard } from "./components/OptionCard";
import { continueAfterDraft } from "./enrol-nav";
import { parseStreamGrade } from "./route-params";

export function PickStreamScreen() {
  const { t, formatNumber, formatClock } = useLocale();
  const { grade } = useLocalSearchParams();
  const cls = parseStreamGrade(grade);
  const [stream, setStream] = useState<StreamId | null>(null);
  const start = useStartEnrollment();
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("common.continue")}
          size="lg"
          disabled={!stream}
          loading={start.isPending}
          onPress={() =>
            start.mutate(
              { grade: cls, stream },
              { onSuccess: (draft) => continueAfterDraft(draft, { grade: cls, stream }) },
            )
          }
        />
      }
    >
      <Header title={t("pick.streamTitle")} />
      <Text muted className="mb-4 mt-2">
        {t("pick.streamSub", { n: formatNumber(cls) })}
      </Text>
      {start.error ? (
        <Banner tone="danger" className="mb-3">
          {errorMessage(start.error, t, formatClock)}
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
