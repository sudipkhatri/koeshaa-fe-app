import { Redirect } from "expo-router";

import { Screen, StateView } from "@/components/ui";
import { useSession } from "@/features/session";
import { startsAtOnboarding } from "@/lib/config";

/** Opens Home when a stored session refreshes, otherwise the front door (sign-in guide). */
export default function Index() {
  const { status, retryStart } = useSession();
  if (status === "booting") {
    return (
      <Screen edges={["top"]}>
        <StateView kind="loading" />
      </Screen>
    );
  }
  if (status === "offline") {
    return (
      <Screen edges={["top"]}>
        <StateView kind="offline" onRetry={retryStart} />
      </Screen>
    );
  }
  const home = status === "signedIn" && !startsAtOnboarding();
  return <Redirect href={home ? "/home" : "/onboarding"} />;
}
