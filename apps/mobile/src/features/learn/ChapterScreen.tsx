import { router } from "expo-router";
import { View } from "react-native";

import { Chip, Header, ListRow, Screen, StateView, Text, subjectFill } from "@/components/ui";
import { StatusBadge } from "./components/StatusBadge";
import { cx } from "@/components/ui/cx";
import { useLocale } from "@/lib/locale";
import type { MessageKey } from "@keoshaa/i18n";

import { chapterRefSchema, routeParam } from "@/features/shared/route-params";

import { localized } from "./locale";
import { useSubject } from "./api";
import { SubjectMissing } from "./components/SubjectMissing";
import { getTopics } from "./mock";
import type { TopicKind } from "./types";

const kindLabel: Record<TopicKind, MessageKey> = {
  video: "learn.kindVideo",
  notes: "learn.kindNotes",
  practice: "learn.kindPractice",
};
const kindIcon = { video: "video", notes: "notes", practice: "practice" } as const;
const kindTone = { video: "danger", notes: "sky", practice: "grape" } as const;

export function ChapterScreen({ chapterRef }: { chapterRef: string | string[] | undefined }) {
  const { t, locale } = useLocale();
  const parsed = routeParam(chapterRefSchema).safeParse(chapterRef);
  const ref = parsed.success ? parsed.data : null;
  const { subject, ...state } = useSubject(ref?.subjectId ?? null);
  const chapter = subject?.chapters[ref?.index ?? -1];
  if (!subject || !chapter) return <SubjectMissing state={state} />;

  return (
    <Screen scroll edges={["top"]}>
      <Header title={localized(chapter.name, locale)} />
      <View className="mb-4 mt-2 flex-row items-center gap-2">
        <View className={cx("min-h-8 justify-center rounded-full px-3", subjectFill[subject.art])}>
          <Text variant="caption" className="font-ui-bold text-on-subject">
            {localized(subject.name, locale)}
          </Text>
        </View>
        <StatusBadge status="free" />
      </View>
      {chapter.chapterId ? (
        <StateView
          kind="empty"
          title={t("learn.contentSoonTitle")}
          message={t("learn.contentSoonBody")}
        />
      ) : (
        <View className="gap-2">
          {getTopics().map((topic) => (
            <ListRow
              key={topic.index}
              title={localized(topic.title, locale)}
              subtitle={localized(topic.detail, locale)}
              icon={kindIcon[topic.kind]}
              iconTone={kindTone[topic.kind]}
              trailing={
                <Chip variant="chip" label={t(kindLabel[topic.kind])} tone={kindTone[topic.kind]} />
              }
              onPress={() =>
                router.push({
                  pathname: "/content/[ref]",
                  params: { ref: `${subject.id}:${chapter.index}:${topic.index}` },
                })
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
