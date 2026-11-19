import type { SubjectId } from "@keoshaa/tokens";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import { subjectArt } from "@/components/ui/subject-art";
import { useTheme } from "@/lib/theme";

interface SubjectArtProps {
  subject: SubjectId;
  size: number;
  /** Fill of the drawing; the inner detail uses the subject accent. */
  ink: string;
}

/** The subject illustration alone, used on small squares and the subject band. */
export function SubjectArt({ subject, size, ink }: SubjectArtProps) {
  const { colors } = useTheme();
  const art = subjectArt[subject].replaceAll("{accent}", colors.subject[subject]);
  const xml = `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="${ink}">${art}</svg>`;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}
