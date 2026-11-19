import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

import {
  Card,
  Chip,
  Icon,
  LinkButton,
  ListRow,
  Mascot,
  Screen,
  StateView,
  Text,
} from "@/components/ui";
import { cardShadow } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import { StatusBadge } from "@/features/learn/components/StatusBadge";
import { SubjectSquare } from "@/features/learn/components/SubjectSquare";
import { UnlockSheet } from "@/features/learn/components/UnlockSheet";
import { localized } from "@/features/learn/locale";
import { chapterRef } from "@/features/learn/progress";
import { useClassInfo } from "@/features/enrollment/api";
import { useSubjects } from "@/features/learn/api";
import { isMockMode } from "@/lib/config";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { Highlight } from "./components/Highlight";
import { getPopular, initialRecents } from "./mock";
import { searchChapters } from "./search";
import { useSlowDown } from "./useSlowDown";

const MAX_RECENTS = 5;

/** Real students: there is no search API yet, so say so instead of searching demo chapters. */
function SearchComingSoon() {
  const { t } = useLocale();
  return (
    <Screen edges={["top"]}>
      <StateView
        kind="empty"
        title={t("search.comingSoonTitle")}
        message={t("search.comingSoonBody")}
      />
    </Screen>
  );
}

export function SearchScreen() {
  return isMockMode() ? <DemoSearch /> : <SearchComingSoon />;
}

function DemoSearch() {
  const { t, locale, formatNumber } = useLocale();
  const { colors, scheme } = useTheme();
  const [focused, setFocused] = useState(false);
  const cls = useClassInfo().data?.grade ?? 0;
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState(initialRecents);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { slow, recordKeystroke } = useSlowDown();
  const { subjects } = useSubjects();
  const result = searchChapters(query, subjects);
  const typed = query.trim().length > 0;

  const openChapter = (subjectId: string, index: number) => {
    const text = query.trim();
    if (text && !recents.includes(text)) setRecents([text, ...recents].slice(0, MAX_RECENTS));
    router.push({
      pathname: "/learn/chapter/[ref]",
      params: { ref: chapterRef(subjectId, index) },
    });
  };

  return (
    <Screen edges={["top"]}>
      <View
        className={cx(
          "min-h-search flex-row items-center gap-2 rounded-card border-2 bg-surface px-4",
          focused ? "border-primary" : "border-transparent",
        )}
        style={cardShadow[scheme]}
      >
        <Icon name="search" size={22} color={colors.textMuted} />
        <TextInput
          accessibilityLabel={t("search.label")}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            recordKeystroke();
          }}
          placeholder={t("search.placeholder")}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          className="h-14 flex-1 font-ui text-button text-text"
        />
      </View>
      <ScrollView
        className="mt-4"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-6"
      >
        {slow ? (
          <View className="items-center gap-3 pt-12">
            <Mascot mood="sleepy" size={120} />
            <Text variant="heading" accessibilityRole="header">
              {t("search.slowTitle")}
            </Text>
            <Text muted className="text-center">
              {t("search.slowBody")}
            </Text>
          </View>
        ) : !typed ? (
          <View className="gap-3">
            <Text variant="body" accessibilityRole="header" className="font-ui-bold">
              {t("search.recent")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {recents.map((recent) => (
                <Chip
                  key={recent}
                  variant="chip"
                  label={recent}
                  icon="clock"
                  tone="surface"
                  onPress={() => setQuery(recent)}
                />
              ))}
            </View>
            <Text variant="body" accessibilityRole="header" className="mt-3 font-ui-bold">
              {t("search.popular", { n: formatNumber(cls) })}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {getPopular().map((word) => (
                <Chip
                  key={word}
                  variant="chip"
                  label={word}
                  icon="spark"
                  onPress={() => setQuery(word)}
                />
              ))}
            </View>
          </View>
        ) : result.groups.length === 0 ? (
          <View className="gap-4">
            {result.suggestion ? (
              <Card className="flex-row flex-wrap items-center gap-2">
                <Text muted>{t("search.didYouMean")}</Text>
                <LinkButton
                  title={`'${result.suggestion}'?`}
                  accessibilityLabel={`${t("search.didYouMean")} ${result.suggestion}`}
                  onPress={() => setQuery(result.suggestion ?? "")}
                  className="px-0"
                />
              </Card>
            ) : null}
            <View className="items-center gap-3 pt-4">
              <Mascot mood="sleepy" size={110} />
              <Text variant="heading" accessibilityRole="header">
                {t("search.emptyTitle")}
              </Text>
              <Text muted className="text-center">
                {t("search.emptyBody")}
              </Text>
            </View>
          </View>
        ) : (
          <View accessibilityLiveRegion="polite" className="gap-2">
            {result.groups.map(({ subject, hits }) => (
              <View key={subject.id} className="gap-2">
                <View className="mb-1 mt-3 flex-row items-center gap-2">
                  <SubjectSquare subject={subject.art} size={36} />
                  <Text variant="body" className="font-ui-bold">
                    {localized(subject.name, locale)}
                  </Text>
                  <Text variant="caption" className="ml-auto">
                    {formatNumber(hits.length)}
                  </Text>
                </View>
                {hits.map(({ chapter, locked }) => {
                  const name = localized(chapter.name, locale);
                  return (
                    <ListRow
                      key={chapter.index}
                      title={name}
                      titleContent={<Highlight text={name} query={query} />}
                      leading={<SubjectSquare subject={subject.art} />}
                      badge={<StatusBadge status={locked ? "locked" : "free"} />}
                      trailing={locked ? <></> : undefined}
                      onPress={() =>
                        locked ? setSheetOpen(true) : openChapter(subject.id, chapter.index)
                      }
                    />
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <UnlockSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </Screen>
  );
}
