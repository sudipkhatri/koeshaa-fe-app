import { useLocalSearchParams } from "expo-router";

import { ChapterScreen } from "@/features/learn/ChapterScreen";

export default function ChapterRoute() {
  const { ref } = useLocalSearchParams<{ ref: string | string[] }>();
  return <ChapterScreen chapterRef={ref} />;
}
