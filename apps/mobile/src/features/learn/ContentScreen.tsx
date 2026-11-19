import { router } from "expo-router";
import { View } from "react-native";

import {
  Button,
  GradientFill,
  Header,
  Icon,
  Mascot,
  Screen,
  Skeleton,
  StateView,
  Text,
  subjectFill,
} from "@/components/ui";
import { cardShadow } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import { isMockMode } from "@/lib/config";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";

import { contentRefSchema, routeParam } from "@/features/shared/route-params";

import { localized } from "./locale";
import { useSubject } from "./api";
import { SubjectMissing } from "./components/SubjectMissing";
import { getTopics } from "./mock";
import type { TopicKind } from "./types";

const QUESTIONS = 5;

function VideoPlaceholder({ label }: { label: string }) {
  const { colors, scheme } = useTheme();
  const { formatClock } = useLocale();
  return (
    <View
      className="mb-4 mt-2 aspect-video items-center justify-center overflow-hidden rounded-card"
      style={cardShadow[scheme]}
    >
      <GradientFill from={colors.videoFrom} to={colors.videoTo} direction="diagonal" />
      <View
        accessible
        accessibilityLabel={label}
        className="h-play w-play items-center justify-center rounded-full bg-on-subject"
      >
        <Icon name="play" size={30} color={colors.primaryPressed} />
      </View>
      <View className="absolute bottom-3 left-4 right-4 flex-row items-center gap-2">
        <Text className="text-micro font-ui-semibold text-on-subject">{formatClock(72)}</Text>
        <View className="h-1.5 flex-1 overflow-hidden rounded-full">
          <View className="absolute inset-0 bg-on-subject opacity-30" />
          {/* Playback position is a measured percentage, which a class cannot express. */}
          <View className="h-full rounded-full bg-reward" style={{ width: "30%" }} />
        </View>
        <Text className="text-micro font-ui-semibold text-on-subject">{formatClock(240)}</Text>
      </View>
    </View>
  );
}

function NotesPlaceholder() {
  const { scheme } = useTheme();
  return (
    <View className="mb-4 mt-2 rounded-card bg-surface px-4 py-5" style={cardShadow[scheme]}>
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="mt-4 h-3.5" />
      <Skeleton className="mt-2.5 h-3.5 w-11/12" />
      <Skeleton className="mt-2.5 h-3.5 w-4/5" />
      <Skeleton className="mt-4 h-24" />
    </View>
  );
}

function PracticePlaceholder() {
  const { t, formatNumber } = useLocale();
  const { scheme } = useTheme();
  return (
    <View className="mb-4 mt-2 rounded-card bg-surface px-4 py-5" style={cardShadow[scheme]}>
      <View className="min-h-8 flex-row items-center self-start rounded-full bg-grape-tint px-3">
        <Text variant="caption" className="font-ui-bold text-on-grape-tint">
          {t("learn.questionOf", { n: formatNumber(1), total: formatNumber(QUESTIONS) })}
        </Text>
      </View>
      <Skeleton className="mt-4 h-4 w-11/12" />
      {[1, 2, 3].map((n) => (
        <View key={n} className="mt-2 h-12 justify-center rounded-tile border-2 border-border px-3">
          <Skeleton className="h-3 w-1/2" />
        </View>
      ))}
    </View>
  );
}

const hint: Record<
  TopicKind,
  "learn.contentVideo" | "learn.contentNotes" | "learn.contentPractice"
> = {
  video: "learn.contentVideo",
  notes: "learn.contentNotes",
  practice: "learn.contentPractice",
};

/** Real students have no lesson content yet: say so instead of showing demo lessons. */
function ContentComingSoon() {
  const { t } = useLocale();
  return (
    <Screen edges={["top"]}>
      <Header />
      <StateView
        kind="empty"
        title={t("learn.contentSoonTitle")}
        message={t("learn.contentSoonBody")}
      />
    </Screen>
  );
}

/** Placeholder for a lesson: the real video, notes and questions come with the content backend. */
export function ContentScreen({ contentRef }: { contentRef: string | string[] | undefined }) {
  const { t, locale } = useLocale();
  const toast = useToast();
  const parsed = routeParam(contentRefSchema).safeParse(contentRef);
  const ref = parsed.success ? parsed.data : null;
  const { subject, ...state } = useSubject(ref?.subjectId ?? null);
  if (!isMockMode()) return <ContentComingSoon />;
  const chapter = subject?.chapters[ref?.chapter ?? -1];
  const topic = getTopics()[ref?.topic ?? -1];
  if (!subject || !chapter || !topic) return <SubjectMissing state={state} />;

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("learn.markDone")}
          icon="check"
          size="lg"
          onPress={() => {
            router.back();
            toast(t("learn.doneToast"));
          }}
        />
      }
    >
      <Header title={localized(topic.title, locale)} />
      <View
        className={cx(
          "min-h-8 self-start justify-center rounded-full px-3",
          subjectFill[subject.art],
        )}
      >
        <Text variant="caption" className="font-ui-bold text-on-subject">
          {localized(chapter.name, locale)}
        </Text>
      </View>
      {topic.kind === "video" ? (
        <VideoPlaceholder label={t("learn.playVideo")} />
      ) : topic.kind === "notes" ? (
        <NotesPlaceholder />
      ) : (
        <PracticePlaceholder />
      )}
      <View className="items-center gap-3">
        <Mascot mood="sleepy" size={80} />
        <Text variant="heading" accessibilityRole="header" className="text-center">
          {t("learn.contentTitle")}
        </Text>
        <Text muted className="text-center">
          {t(hint[topic.kind])}
        </Text>
      </View>
    </Screen>
  );
}
