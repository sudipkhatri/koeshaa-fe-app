import { Redirect, useLocalSearchParams } from "expo-router";

import { CodeScreen } from "@/features/onboarding/CodeScreen";
import { parseCodeParams } from "@/features/onboarding/route-params";

export default function CodeRoute() {
  const params = parseCodeParams(useLocalSearchParams());
  if (!params) return <Redirect href="/onboarding/welcome" />;
  return <CodeScreen to={params.to} toParent={params.toParent} next={params.next} />;
}
