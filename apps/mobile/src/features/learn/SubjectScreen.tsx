import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import {
  Header,
  ListRow,
  ProgressRing,
  Screen,
  StateView,
  Text,
  subjectFill,
  useQueryStateKind,
} from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { routeParam, subjectIdSchema } from "@/features/shared/route-params";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { StatusBadge } from "./components/StatusBadge";
import { useSubject, type SubjectsState } from "./api";
import { SubjectArt } from "./components/SubjectArt";
import { SubjectMissing } from "./components/SubjectMissing";
import { UnlockSheet } from "./components/UnlockSheet";
import { localized } from "./locale";
import { FREE_CHAPTERS, LESSONS_PER_CHAPTER } from "./mock";
import { chapterRef, chapterStatus, subjectPercent } from "./progress";

export function SubjectScreen({ id }: { id: string | string[] | undefined }) {
  const { t, locale, formatNumber } = useLocale();
  const { colors } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const parsed = routeParam(subjectIdSchema).safeParse(id);
  const { subject, ...state } = useSubject(parsed.success ? parsed.data : null);
  if (!subject) return <SubjectMissing state={state} />;
  if (subject.chapters.length === 0) {
    return (
      <Screen edges={["top"]}>
        <Header title={localized(subject.name, locale)} />
        <ChapterListState state={state} />
      </Screen>
    );
  }
  const percent = subjectPercent(subject);
  const freeCount = subject.chapters.some((chapter) => chapter.chapterId)
    ? subject.chapters.length
    : FREE_CHAPTERS;

  return (
    <Screen edges={["top"]} className="px-0 pt-0">
      <View
        className={cx("overflow-hidden rounded-b-band px-4 pb-6 pt-1", subjectFill[subject.art])}
      >
        <View
          className="absolute -right-6 -top-2 opacity-20"
          style={{ transform: [{ rotate: "12deg" }] }}
        >
          <SubjectArt subject={subject.art} size={180} ink={colors.onSubject} />
        </View>
        <Header title={localized(subject.name, locale)} onSubject />
        <View className="mt-2 flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-xl bg-on-subject">
            <SubjectArt subject={subject.art} size={44} ink={colors.subject[subject.art]} />
          </View>
          <View className="flex-1">
            <Text className="text-button font-ui-bold text-on-subject">
              {t("learn.chaptersDone", {
                done: formatNumber(subject.doneCount),
                total: formatNumber(subject.chapters.length),
              })}
            </Text>
            <Text variant="caption" className="text-on-subject">
              {t("learn.freeStart", { n: formatNumber(freeCount) })}
            </Text>
          </View>
          <ProgressRing
            percent={percent}
            size={64}
            stroke={8}
            color={colors.onSubject}
            label={t("common.percent", { n: formatNumber(percent) })}
            accessibilityLabel={t("common.percent", { n: formatNumber(percent) })}
          />
        </View>
      </View>
      <ScrollView contentContainerClassName="gap-2 px-4 pb-6 pt-4">
        {subject.chapters.map((chapter) => {
          const status = chapterStatus(subject, chapter.index);
          const locked = status === "locked";
          return (
            <ListRow
              key={chapter.chapterId ?? chapter.index}
              title={localized(chapter.name, locale)}
              subtitle={
                chapter.chapterId
                  ? undefined
                  : t("learn.lessons", { n: formatNumber(LESSONS_PER_CHAPTER) })
              }
              leading={
                <View
                  className={cx(
                    "h-10 w-10 items-center justify-center rounded-md",
                    locked ? "bg-surface-muted" : subjectFill[subject.art],
                  )}
                >
                  <Text
                    className={cx(
                      "text-button font-ui-bold",
                      locked ? "text-text-muted" : "text-on-subject",
                    )}
                  >
                    {formatNumber(chapter.index + 1)}
                  </Text>
                </View>
              }
              badge={
                <StatusBadge
                  status={status}
                  percent={subject.currentPercent}
                  ringColor={colors.subject[subject.art]}
                />
              }
              onPress={() =>
                locked
                  ? setSheetOpen(true)
                  : router.push({
                      pathname: "/learn/chapter/[ref]",
                      params: { ref: chapterRef(subject.id, chapter.index) },
                    })
              }
              trailing={locked ? <></> : undefined}
            />
          );
        })}
      </ScrollView>
      <UnlockSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </Screen>
  );
}

function ChapterListState({ state }: { state: SubjectsState }) {
  const { t } = useLocale();
  const kind = useQueryStateKind({ ...state, hasData: false });
  if (kind === "loading" || kind === "error" || kind === "offline") {
    return <StateView kind={kind} onRetry={state.refetch} />;
  }
  return (
    <StateView
      kind="empty"
      title={t("learn.noChaptersTitle")}
      message={t("learn.noChaptersBody")}
    />
  );
}
