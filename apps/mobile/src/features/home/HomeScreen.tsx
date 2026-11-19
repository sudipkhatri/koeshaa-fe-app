import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import {
  Banner,
  Chip,
  Icon,
  LinkButton,
  ListRow,
  Screen,
  Skeleton,
  StateView,
  Text,
  useQueryStateKind,
} from "@/components/ui";
import { cardShadow } from "@/components/ui/Card";
import { SubjectsGate } from "@/features/learn/components/SubjectsGate";
import { useClassInfo } from "@/features/enrollment/api";
import { useSubjects } from "@/features/learn/api";
import { useDevices, useDismissSecondDevice, useProfile } from "@/features/me/api";
import { ClassPill, MAX_DEVICES } from "@/features/session";
import { SubjectCard } from "@/features/learn/components/SubjectGrid";
import { StatusBadge } from "@/features/learn/components/StatusBadge";
import { SubjectSquare } from "@/features/learn/components/SubjectSquare";
import { localized } from "@/features/learn/locale";
import { chapterRef } from "@/features/learn/progress";
import { isMockMode } from "@/lib/config";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { ContinueHero } from "./components/ContinueHero";
import { DailyGoal } from "./components/DailyGoal";
import { DevSheet } from "./DevSheet";
import { FIRST_LOAD_MS, STREAK_DAYS } from "./mock";

/** Developer shortcut states (long-press the avatar in a dev build). */
type ForcedState = "loading" | "offline" | null;

function HomeSkeleton() {
  return (
    <View
      className="gap-4 px-4 pt-4"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
    >
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-48 rounded-card" />
      <Skeleton className="h-6 w-1/2" />
      <View className="flex-row gap-3">
        <Skeleton className="h-40 flex-1 rounded-card" />
        <Skeleton className="h-40 flex-1 rounded-card" />
      </View>
    </View>
  );
}

export function HomeScreen() {
  const { t, locale, formatNumber } = useLocale();
  const { scheme, setPreference, colors } = useTheme();
  const profile = useProfile();
  const devices = useDevices();
  const dismissNotice = useDismissSecondDevice();
  const subjectsState = useSubjects();
  const classInfo = useClassInfo();
  const [forced, setForced] = useState<ForcedState>(null);
  const [devOpen, setDevOpen] = useState(false);
  const name = profile.data?.name ?? "";
  const profileKind = useQueryStateKind({ ...profile, hasData: !!profile.data });
  const subjectsKind = useQueryStateKind({ ...subjectsState, hasData: subjectsState.hasClass });
  const kind = forced ?? profileKind ?? subjectsKind;
  const retry = () => {
    setForced(null);
    void profile.refetch();
    subjectsState.refetch();
  };

  useEffect(() => {
    if (forced !== "loading") return;
    const timer = setTimeout(() => setForced(null), FIRST_LOAD_MS);
    return () => clearTimeout(timer);
  }, [forced]);

  return (
    <Screen edges={["top"]} className="px-0 pt-0">
      <View className="flex-row items-center gap-3 px-4 pt-2">
        <Pressable
          accessible={false}
          delayLongPress={650}
          onLongPress={__DEV__ ? () => setDevOpen(true) : undefined}
          className="h-12 w-12 items-center justify-center rounded-full bg-reward"
        >
          <Text variant="title" className="text-on-reward">
            {(name[0] ?? "A").toUpperCase()}
          </Text>
        </Pressable>
        <View className="flex-1">
          <Text variant="caption">{t("home.greeting")}</Text>
          <Text variant="greeting" accessibilityRole="header">
            {t("home.namaste", { name })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("home.switchTheme")}
          onPress={() => setPreference(scheme === "dark" ? "light" : "dark")}
          className="h-12 w-12 items-center justify-center rounded-full bg-surface active:scale-90"
          style={cardShadow[scheme]}
        >
          <Icon name="moon" color={colors.text} />
        </Pressable>
      </View>

      {kind === "loading" ? (
        <HomeSkeleton />
      ) : kind !== null ? (
        <View className="px-4">
          <StateView kind={kind} onRetry={retry} />
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-4 pb-6 pt-5">
          <View className="mb-4 flex-row flex-wrap gap-2">
            <ClassPill onPress={() => router.push("/onboarding/pick-class")} />
            {isMockMode() ? (
              <Chip
                label={t("home.streak", { n: formatNumber(STREAK_DAYS) })}
                tone="reward"
                icon="flame"
                accessibilityLabel={t("home.streakLabel", { n: formatNumber(STREAK_DAYS) })}
              />
            ) : null}
            {profile.data?.role === "parent" ? (
              <Chip label={t("home.parentView")} tone="grape" />
            ) : null}
          </View>

          {profile.data?.secondDeviceNotice ? (
            <Banner icon="phone" onDismiss={() => dismissNotice.mutate()} className="mb-4">
              {t("home.deviceNotice", {
                used: formatNumber(devices.data?.length ?? 2),
                max: formatNumber(MAX_DEVICES),
              })}{" "}
              <LinkButton
                small
                title={t("home.manageDevices")}
                onPress={() => router.push("/me/devices")}
                className="min-h-8 px-0"
              />
            </Banner>
          ) : null}

          <SubjectsGate state={subjectsState}>
            {(subjects) => {
              const current = subjects.find((s) => s.currentPercent > 0) ?? subjects[0];
              return (
                <>
                  {current ? <ContinueHero subject={current} /> : null}

                  <View className="mb-3 mt-6 flex-row items-center justify-between">
                    <Text variant="section" accessibilityRole="header">
                      {t("home.yourSubjects")}
                    </Text>
                    <LinkButton
                      title={t("common.seeAll")}
                      onPress={() => router.navigate("/learn")}
                      className="min-h-10"
                    />
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-3 px-4 pb-3 pt-1"
                    className="-mx-4"
                  >
                    {subjects.map((subject) => (
                      <SubjectCard key={subject.id} subject={subject} compact />
                    ))}
                  </ScrollView>

                  <View className="mb-3 mt-3 flex-row items-center justify-between">
                    <Text variant="section" accessibilityRole="header">
                      {t("home.freeChapters")}
                    </Text>
                    <Text variant="small">
                      {t("common.classN", { n: formatNumber(classInfo.data?.grade ?? 0) })}
                    </Text>
                  </View>
                  <View className="gap-2">
                    {subjects.map((subject) => {
                      const first = subject.chapters[0];
                      if (!first) return null;
                      return (
                        <ListRow
                          key={subject.id}
                          title={localized(first.name, locale)}
                          subtitle={localized(subject.name, locale)}
                          leading={<SubjectSquare subject={subject.art} />}
                          badge={<StatusBadge status="free" />}
                          onPress={() =>
                            router.push({
                              pathname: "/learn/chapter/[ref]",
                              params: { ref: chapterRef(subject.id, 0) },
                            })
                          }
                        />
                      );
                    })}
                  </View>
                  {isMockMode() ? <DailyGoal /> : null}
                </>
              );
            }}
          </SubjectsGate>
        </ScrollView>
      )}
      {__DEV__ ? (
        <DevSheet
          visible={devOpen}
          onClose={() => setDevOpen(false)}
          onSkeleton={() => setForced("loading")}
          onOffline={() => setForced("offline")}
        />
      ) : null}
    </Screen>
  );
}
