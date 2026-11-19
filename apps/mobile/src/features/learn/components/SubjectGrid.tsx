import { router } from "expo-router";
import { View } from "react-native";

import { SubjectTile } from "@/components/ui";
import { useLocale } from "@/lib/locale";

import { subjectPercent } from "../progress";
import type { Subject } from "../types";
import { localized } from "../locale";

/** Subject tile that opens the subject; `compact` is the fixed-width one for the Home row. */
export function SubjectCard({ subject, compact }: { subject: Subject; compact?: boolean }) {
  const { t, locale, formatNumber } = useLocale();
  const percent = subjectPercent(subject);
  return (
    <SubjectTile
      subject={subject.art}
      title={localized(subject.name, locale)}
      subtitle={t("common.chaptersCount", { n: formatNumber(subject.chapters.length) })}
      progress={percent}
      progressLabel={t("common.percent", { n: formatNumber(percent) })}
      compact={compact}
      onPress={() => router.push({ pathname: "/learn/subject/[id]", params: { id: subject.id } })}
    />
  );
}

/** Two tiles per row. */
export function SubjectGrid({ subjects }: { subjects: readonly Subject[] }) {
  const rows: Subject[][] = [];
  for (let i = 0; i < subjects.length; i += 2) rows.push(subjects.slice(i, i + 2));
  return (
    <View className="gap-3">
      {rows.map((pair) => (
        <View key={pair[0]?.id} className="flex-row gap-3">
          {pair.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </View>
      ))}
    </View>
  );
}
