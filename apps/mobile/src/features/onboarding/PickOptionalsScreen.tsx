import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { z } from "zod";

import {
  Banner,
  Button,
  Header,
  LinkButton,
  Screen,
  StateView,
  Text,
  useQueryStateKind,
} from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { useChooseOptionals, useSubjectPool } from "@/features/enrollment/api";
import { routeParam } from "@/features/shared/route-params";
import { streamIds } from "@/features/session/mock";
import type { StreamId } from "@/features/session/mock";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { enrolConfirmParams } from "./enrol-nav";

const paramsSchema = z.object({
  enrollmentId: routeParam(z.string().min(1)),
  grade: routeParam(z.coerce.number().int().min(1).max(12)),
  stream: routeParam(z.string()),
});

export function PickOptionalsScreen() {
  const { t, formatNumber, formatClock } = useLocale();
  const { colors } = useTheme();
  const raw = useLocalSearchParams();
  const parsed = paramsSchema.safeParse(raw);
  const grade = parsed.success ? parsed.data.grade : 0;
  const stream = (
    parsed.success && streamIds.includes(parsed.data.stream as StreamId) ? parsed.data.stream : null
  ) as StreamId | null;
  const enrollmentId = parsed.success ? parsed.data.enrollmentId : "";
  const pool = useSubjectPool(grade, stream, parsed.success);
  const choose = useChooseOptionals();
  const [picked, setPicked] = useState<string[]>([]);

  const kind = useQueryStateKind({ ...pool, hasData: pool.data !== undefined });
  const required = pool.data?.optionalRequired ?? 0;
  const ready = picked.length === required;

  if (!parsed.success) {
    return (
      <Screen edges={["top"]}>
        <Header title={t("pick.optionalsTitle")} onBack={() => router.back()} />
        <StateView kind="empty" title={t("pick.optionalsMissing")} message={t("pick.classSub")} />
      </Screen>
    );
  }

  const goConfirm = (deferred: boolean, ids: string[]) => {
    router.push({
      pathname: "/onboarding/enrol-confirm",
      params: enrolConfirmParams({
        enrollmentId,
        grade,
        stream,
        deferred,
        optionals: ids.join(","),
      }),
    });
  };

  const toggle = (id: string) => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= required) return prev;
      return [...prev, id];
    });
    choose.reset();
  };

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <View className="gap-2">
          <Button
            title={t("pick.optionalsNext", {
              n: formatNumber(picked.length),
              total: formatNumber(required),
            })}
            size="lg"
            disabled={!ready}
            loading={choose.isPending}
            onPress={() =>
              choose.mutate(
                { enrollmentId, optionalSubjectIds: picked, deferred: false },
                { onSuccess: () => goConfirm(false, picked) },
              )
            }
          />
        </View>
      }
    >
      <Header title={t("pick.optionalsTitle")} onBack={() => router.back()} />
      <Text variant="headline" accessibilityRole="header" className="mt-2">
        {t("pick.optionalsHeadline", { n: formatNumber(required) })}
      </Text>
      <Text muted className="mb-4 mt-2">
        {t("pick.optionalsSub", {
          class: formatNumber(grade),
          stream: stream ? ` · ${t(`pick.${stream}`)}` : "",
        })}
      </Text>

      {kind !== null ? (
        <StateView kind={kind} onRetry={() => void pool.refetch()} />
      ) : (
        <View className="gap-2.5">
          {(pool.data?.optional ?? []).map((subject) => {
            const selected = picked.includes(subject.id);
            const lockedOut = !selected && picked.length >= required;
            return (
              <Pressable
                key={subject.id}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: lockedOut }}
                disabled={lockedOut}
                onPress={() => toggle(subject.id)}
                className={cx(
                  "min-h-20 flex-row items-center gap-3.5 rounded-card border-2 px-4 py-3.5",
                  selected ? "border-primary bg-primary-tint" : "border-border bg-surface",
                  lockedOut && "opacity-55",
                )}
              >
                <View className="h-11 w-11 items-center justify-center rounded-lg bg-primary">
                  <Text className="font-ui-bold text-on-primary">
                    {subject.code.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className={cx("font-ui-bold text-lg", selected && "text-primary")}>
                    {subject.name}
                  </Text>
                  <Text variant="caption">
                    {subject.availability === "coming_soon"
                      ? t("pick.comingSoon")
                      : t("pick.readyNow")}
                  </Text>
                </View>
                {selected ? (
                  <Text className="font-ui-bold text-primary">✓</Text>
                ) : (
                  <View
                    className="h-6 w-6 rounded-full border-2"
                    style={{ borderColor: colors.border }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <View className="mt-4 rounded-card bg-surface p-4">
        <Text muted variant="small">
          {t("pick.decideLaterBody")}
        </Text>
        <LinkButton
          title={t("pick.decideLater")}
          className="mt-2 self-start"
          onPress={() =>
            choose.mutate(
              { enrollmentId, optionalSubjectIds: [], deferred: true },
              { onSuccess: () => goConfirm(true, []) },
            )
          }
        />
      </View>
      {choose.error ? (
        <Banner tone="danger" className="mt-3">
          {errorMessage(choose.error, t, formatClock)}
        </Banner>
      ) : null}
    </Screen>
  );
}
