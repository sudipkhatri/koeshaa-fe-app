import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { Icon, Text } from "@/components/ui";
import { cardShadow } from "@/components/ui/Card";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { localized } from "@/features/learn/locale";
import { chapterRef } from "@/features/learn/progress";
import type { Subject } from "@/features/learn/types";

import { HeroArt } from "./HeroArt";

const TOPIC = 2;
const TOPICS = 5;

/** The indigo "Continue learning" card: picks up the chapter in progress. */
export function ContinueHero({ subject }: { subject: Subject }) {
  const { t, locale, formatNumber } = useLocale();
  const { colors, scheme } = useTheme();
  const chapter = subject.chapters[subject.doneCount];
  if (!chapter) return null;
  const percent = subject.currentPercent;

  return (
    <View
      className="gap-3 overflow-hidden rounded-card bg-hero px-4 pb-4 pt-5"
      style={cardShadow[scheme]}
    >
      <View className="absolute right-1 top-1">
        <HeroArt />
      </View>
      <View className="min-h-24 pr-28">
        <Text variant="caption" className="font-ui-semibold text-on-subject">
          {t("home.continueEyebrow")}
        </Text>
        <Text variant="lead" accessibilityRole="header" className="text-on-subject">
          {localized(chapter.name, locale)}
        </Text>
        <Text variant="small" className="mt-1 text-on-subject">
          {t("home.continueSub", {
            subject: localized(subject.name, locale),
            n: formatNumber(TOPIC),
            total: formatNumber(TOPICS),
          })}
        </Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={t("home.progressLabel", { n: formatNumber(percent) })}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        className="h-2.5 overflow-hidden rounded-full"
      >
        <View className="absolute inset-0 bg-on-subject opacity-30" />
        {/* Width is a measured percentage, which a class cannot express. */}
        <View className="h-full rounded-full bg-reward" style={{ width: `${percent}%` }} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.continue")}
        onPress={() =>
          router.push({
            pathname: "/content/[ref]",
            params: { ref: `${chapterRef(subject.id, chapter.index)}:${TOPIC}` },
          })
        }
        className="min-h-14 flex-row items-center justify-center gap-2 rounded-full bg-on-subject active:scale-95"
      >
        <Icon name="play" size={18} color={colors.primaryPressed} />
        <Text variant="section" className="text-primary-pressed">
          {t("common.continue")}
        </Text>
      </Pressable>
    </View>
  );
}
