import { router } from "expo-router";
import { View } from "react-native";

import {
  Banner,
  Button,
  Card,
  Header,
  Screen,
  StateView,
  Text,
  useQueryStateKind,
} from "@/components/ui";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import type { Locale } from "@keoshaa/i18n";

import { useClassInfo } from "./api";

function windowDate(iso: string | null, locale: Locale): string | null {
  if (!iso) return null;
  const tag = locale === "ne" ? "ne-NP" : "en-GB";
  return new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kathmandu",
  }).format(new Date(iso));
}

export function EnrolmentScreen() {
  const { t, formatNumber, locale } = useLocale();
  const { colors } = useTheme();
  const info = useClassInfo();
  const kind = useQueryStateKind({ ...info, hasData: info.data !== undefined });

  if (kind !== null) {
    return (
      <Screen scroll edges={["top"]}>
        <Header title={t("enrolment.title")} onBack={() => router.back()} />
        <StateView kind={kind} onRetry={() => void info.refetch()} />
      </Screen>
    );
  }

  const data = info.data;
  if (!data?.enrollmentId || !data.grade) {
    return (
      <Screen scroll edges={["top", "bottom"]}>
        <Header title={t("enrolment.title")} onBack={() => router.back()} />
        <StateView
          kind="empty"
          title={t("enrolment.emptyTitle")}
          message={t("enrolment.emptyBody")}
          action={{
            title: t("learn.pickClassAction"),
            onPress: () => router.push("/onboarding/pick-class"),
          }}
        />
      </Screen>
    );
  }

  if (data.state === "draft") {
    return (
      <Screen scroll edges={["top", "bottom"]}>
        <Header title={t("enrolment.title")} onBack={() => router.back()} />
        <Card className="gap-3">
          <Text className="font-ui-bold">{t("enrolment.draftTitle")}</Text>
          <Text muted>{t("enrolment.draftBody")}</Text>
          <Button
            title={t("enrolment.continueDraft")}
            onPress={() => router.push("/onboarding/pick-class")}
          />
        </Card>
      </Screen>
    );
  }

  const classLabel = data.stream
    ? t("common.classStream", {
        n: formatNumber(data.grade),
        stream: t(`pick.${data.stream}`),
      })
    : t("common.classN", { n: formatNumber(data.grade) });
  const until = windowDate(data.windowEndsAt, locale);
  const canCorrect = data.windowOpen && data.changesLeft > 0;

  return (
    <Screen scroll edges={["top", "bottom"]}>
      <Header title={t("enrolment.title")} onBack={() => router.back()} />

      <Card className="mt-2 gap-3">
        {data.yearLabel ? (
          <Text variant="caption">{t("enrolment.year", { year: data.yearLabel })}</Text>
        ) : (
          <Text variant="caption">{t("enrolment.yearUnknown")}</Text>
        )}
        <Text variant="section" accessibilityRole="header">
          {classLabel}
        </Text>
        <View className="gap-2">
          {data.subjects.length === 0 ? (
            <Text muted>{t("enrolment.noSubjects")}</Text>
          ) : (
            data.subjects.map((subject) => (
              <View
                key={subject.code}
                className="flex-row items-center justify-between border-b border-border py-2"
              >
                <Text className="font-ui-semibold">{subject.name}</Text>
                {subject.optional ? <Text variant="caption">{t("enrolment.optional")}</Text> : null}
              </View>
            ))
          )}
        </View>
      </Card>

      {canCorrect ? (
        <Card className="mt-4 gap-3">
          <Text className="font-ui-bold">{t("enrolment.fixYourselfTitle")}</Text>
          <Text muted>
            {until
              ? t("enrolment.fixYourselfBody", {
                  until,
                  left: formatNumber(data.changesLeft),
                })
              : t("enrolment.fixYourselfBodyNoDate", {
                  left: formatNumber(data.changesLeft),
                })}
          </Text>
          <Button
            title={t("enrolment.changeNow")}
            onPress={() => router.push("/onboarding/pick-class")}
          />
        </Card>
      ) : (
        <Card className="mt-4 gap-3">
          <Text className="font-ui-bold">{t("enrolment.askTitle")}</Text>
          <Text muted>{t("enrolment.askBody")}</Text>
          <Button
            title={t("enrolment.askAction")}
            onPress={() => router.push("/me/enrolment-ask")}
          />
        </Card>
      )}

      {!canCorrect && data.windowOpen ? (
        <Banner icon="info" className="mt-4">
          {t("enrolment.noChangesLeft")}
        </Banner>
      ) : null}

      <View className="mt-4 rounded-2xl border border-dashed border-border bg-surface-muted px-4 py-3.5">
        <Text variant="small" style={{ color: colors.textMuted }}>
          <Text className="font-ui-bold text-text">{t("parent.apiNoteLead")} </Text>
          {t("enrolment.historyNote")}
        </Text>
      </View>
    </Screen>
  );
}
