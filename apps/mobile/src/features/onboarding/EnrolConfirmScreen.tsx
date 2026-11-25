import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { z } from "zod";

import {
  Banner,
  Button,
  Card,
  Chip,
  Header,
  LinkButton,
  Screen,
  StateView,
  Text,
  TextField,
  useQueryStateKind,
} from "@/components/ui";
import { useConfirmEnrollment, useSubjectPool } from "@/features/enrollment/api";
import { routeParam } from "@/features/shared/route-params";
import { streamIds } from "@/features/session/mock";
import type { StreamId } from "@/features/session/mock";
import { errorMessage, isNetworkError } from "@/lib/errors";
import { useLocale } from "@/lib/locale";

const paramsSchema = z.object({
  enrollmentId: routeParam(z.string().min(1)),
  grade: routeParam(z.coerce.number().int().min(1).max(12)),
  stream: routeParam(z.string()),
  deferred: routeParam(z.string()).optional(),
  optionals: routeParam(z.string()).optional(),
});

export function EnrolConfirmScreen() {
  const { t, formatNumber, formatClock } = useLocale();
  const raw = useLocalSearchParams();
  const parsed = paramsSchema.safeParse(raw);
  const grade = parsed.success ? parsed.data.grade : 0;
  const stream = (
    parsed.success && streamIds.includes(parsed.data.stream as StreamId) ? parsed.data.stream : null
  ) as StreamId | null;
  const enrollmentId = parsed.success ? parsed.data.enrollmentId : "";
  const deferred = parsed.success && parsed.data.deferred === "1";
  const optionalIds =
    parsed.success && parsed.data.optionals ? parsed.data.optionals.split(",").filter(Boolean) : [];
  const pool = useSubjectPool(grade, stream, parsed.success);
  const confirm = useConfirmEnrollment();
  const [parentPhone, setParentPhone] = useState("");

  const kind = useQueryStateKind({ ...pool, hasData: pool.data !== undefined });

  if (!parsed.success) {
    return (
      <Screen edges={["top"]}>
        <Header title={t("pick.confirmTitle")} onBack={() => router.back()} />
        <StateView kind="empty" title={t("pick.optionalsMissing")} message={t("pick.classSub")} />
      </Screen>
    );
  }

  const compulsory = pool.data?.compulsory ?? [];
  const optionals = (pool.data?.optional ?? []).filter((s) => optionalIds.includes(s.id));

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <View className="gap-2">
          <Button
            title={t("pick.confirmStart")}
            size="lg"
            loading={confirm.isPending}
            disabled={confirm.isPending}
            onPress={() =>
              confirm.mutate(
                {
                  enrollmentId,
                  optionalsDeferred: deferred,
                  optionalSubjectIds: deferred ? [] : optionalIds,
                  parentPhone: parentPhone.trim() || undefined,
                },
                { onSuccess: () => router.replace("/home") },
              )
            }
          />
          <LinkButton title={t("pick.goBackChange")} onPress={() => router.back()} />
        </View>
      }
    >
      <Header title={t("pick.confirmTitle")} onBack={() => router.back()} />
      <Text variant="headline" accessibilityRole="header" className="mt-2">
        {t("pick.confirmHeadline")}
      </Text>
      <Text muted className="mb-4 mt-2">
        {t("pick.confirmSub")}
      </Text>

      {kind !== null ? (
        <StateView kind={kind} onRetry={() => void pool.refetch()} />
      ) : (
        <Card className="gap-3">
          <Text variant="caption" className="font-ui-bold uppercase tracking-wide">
            {t("pick.schoolYear")}
          </Text>
          <Text className="font-ui-bold text-xl">
            {stream
              ? t("common.classStream", { n: formatNumber(grade), stream: t(`pick.${stream}`) })
              : t("common.classN", { n: formatNumber(grade) })}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {compulsory.map((s) => (
              <Chip key={s.id} label={s.name} tone="primary" />
            ))}
            {optionals.map((s) => (
              <Chip key={s.id} label={s.name} tone="reward" />
            ))}
            {deferred ? <Chip label={t("pick.optionalsLater")} tone="neutral" /> : null}
          </View>
          {optionals.length > 0 ? (
            <Text muted variant="small">
              {t("pick.goldAreOptional")}
            </Text>
          ) : null}
        </Card>
      )}

      <Card className="mt-3 gap-2">
        <Text className="font-ui-bold">{t("pick.parentTellTitle")}</Text>
        <Text muted variant="small">
          {t("pick.parentTellBody")}
        </Text>
        <TextField
          label={t("pick.parentPhone")}
          prefix="+977"
          keyboardType="phone-pad"
          value={parentPhone}
          onChangeText={setParentPhone}
          hint={t("pick.parentPhoneHint")}
        />
      </Card>

      <Banner icon="info" className="mt-3">
        {t("pick.correctUntil")}
      </Banner>
      {confirm.error ? (
        <Banner tone="danger" className="mt-3">
          {isNetworkError(confirm.error)
            ? t("common.noConnection")
            : errorMessage(confirm.error, t, formatClock)}
        </Banner>
      ) : null}
    </Screen>
  );
}
