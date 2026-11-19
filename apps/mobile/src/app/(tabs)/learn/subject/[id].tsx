import { useLocalSearchParams } from "expo-router";

import { SubjectScreen } from "@/features/learn/SubjectScreen";

export default function SubjectRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  return <SubjectScreen id={id} />;
}
