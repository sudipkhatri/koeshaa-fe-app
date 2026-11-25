import { router, useLocalSearchParams } from "expo-router";

import { Header, Screen, StateView } from "@/components/ui";
import { ChildDetailScreen } from "@/features/parent/ChildDetailScreen";
import { childIdSchema } from "@/features/parent/schemas";
import { routeParam } from "@/features/shared/route-params";
import { useLocale } from "@/lib/locale";

export default function ChildDetailRoute() {
  const { t } = useLocale();
  const params = useLocalSearchParams();
  const parsed = routeParam(childIdSchema).safeParse(params.id);
  if (!parsed.success) {
    return (
      <Screen scroll edges={["top"]}>
        <Header title={t("tabs.children")} onBack={() => router.back()} />
        <StateView kind="empty" title={t("parent.notFound")} message={t("parent.emptyBody")} />
      </Screen>
    );
  }
  return <ChildDetailScreen childId={parsed.data} />;
}
