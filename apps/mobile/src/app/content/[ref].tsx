import { useLocalSearchParams } from "expo-router";

import { ContentScreen } from "@/features/learn/ContentScreen";

export default function ContentRoute() {
  const { ref } = useLocalSearchParams<{ ref: string | string[] }>();
  return <ContentScreen contentRef={ref} />;
}
