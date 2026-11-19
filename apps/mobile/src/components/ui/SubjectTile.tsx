import type { SubjectId } from "@keoshaa/tokens";
import { Pressable, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { useTheme } from "@/lib/theme";

import { cardShadow } from "./Card";
import { cx } from "./cx";
import { subjectArt } from "./subject-art";
import { Text } from "./Text";

/** Literal class names so Tailwind finds them. */
export const subjectFill: Record<SubjectId, string> = {
  science: "bg-subject-science",
  maths: "bg-subject-maths",
  english: "bg-subject-english",
  nepali: "bg-subject-nepali",
  social: "bg-subject-social",
  health: "bg-subject-health",
};

interface SubjectTileProps {
  subject: SubjectId;
  title: string;
  subtitle?: string;
  /** 0 to 100; shows a thin progress bar. */
  progress?: number;
  /** Short text beside the bar, e.g. "40%". */
  progressLabel?: string;
  onPress?: () => void;
  /** Fixed-width variant for horizontal rows. */
  compact?: boolean;
}

export function SubjectTile({
  subject,
  title,
  subtitle,
  progress,
  progressLabel,
  onPress,
  compact,
}: SubjectTileProps) {
  const { colors, scheme } = useTheme();
  const accent = colors.subject[subject];
  const art = subjectArt[subject].replaceAll("{accent}", accent);
  const svg = (size: number, paint: string) =>
    `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="${paint}">${art}</svg>`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      className={cx(
        "min-h-tile overflow-hidden rounded-card p-4 active:scale-95",
        subjectFill[subject],
        compact ? "w-40" : "flex-1",
      )}
      style={cardShadow[scheme]}
    >
      <View
        className="absolute -bottom-4 -right-4 opacity-20"
        style={{ transform: [{ rotate: "-12deg" }] }}
      >
        <SvgXml xml={svg(104, colors.onSubject)} width={104} height={104} />
      </View>
      <View className="h-11 w-11 items-center justify-center rounded-tile bg-on-subject">
        <SvgXml xml={svg(28, accent)} width={28} height={28} />
      </View>
      <Text variant="section" tight className="mt-auto pt-3 text-on-subject">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" className="text-on-subject">
          {subtitle}
        </Text>
      ) : null}
      {progress === undefined ? null : (
        <View className="mt-2 flex-row items-center gap-2">
          <View
            className="h-2 flex-1 overflow-hidden rounded-full"
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: progress }}
          >
            <View className="absolute inset-0 bg-on-subject opacity-35" />
            {/* Width is a measured percentage, which a class cannot express. */}
            <View className="h-full rounded-full bg-on-subject" style={{ width: `${progress}%` }} />
          </View>
          {progressLabel ? (
            <Text variant="caption" className="font-ui-bold text-on-subject">
              {progressLabel}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
