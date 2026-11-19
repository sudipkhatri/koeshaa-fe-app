import type { SubjectId } from "@keoshaa/tokens";
import { View } from "react-native";

import { subjectFill } from "@/components/ui";
import { useTheme } from "@/lib/theme";

import { SubjectArt } from "./SubjectArt";

/** Coloured rounded square with the subject drawing, the leading mark of a chapter row. */
export function SubjectSquare({ subject, size = 40 }: { subject: SubjectId; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      className={`items-center justify-center ${size < 40 ? "rounded-square" : "rounded-md"} ${subjectFill[subject]}`}
      style={{ width: size, height: size }}
    >
      <SubjectArt subject={subject} size={size - 16} ink={colors.onSubject} />
    </View>
  );
}
