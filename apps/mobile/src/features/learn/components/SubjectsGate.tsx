import { router } from "expo-router";
import type { ReactNode } from "react";

import { StateView, useQueryStateKind } from "@/components/ui";
import { useLocale } from "@/lib/locale";

import type { SubjectsState } from "../api";
import type { Subject } from "../types";

/** Loading, no connection, error, no class picked and no subjects yet; otherwise the subjects. */
export function SubjectsGate({
  state,
  children,
}: {
  state: SubjectsState;
  children: (subjects: Subject[]) => ReactNode;
}) {
  const { t } = useLocale();
  const kind = useQueryStateKind({ ...state, hasData: state.hasClass });
  if (kind !== null) return <StateView kind={kind} onRetry={state.refetch} />;
  if (!state.hasClass) {
    return (
      <StateView
        kind="empty"
        title={t("learn.noClassTitle")}
        message={t("learn.noClassBody")}
        action={{
          title: t("learn.pickClassAction"),
          onPress: () => router.push("/onboarding/pick-class"),
        }}
      />
    );
  }
  if (state.subjects.length === 0) {
    return (
      <StateView
        kind="empty"
        title={t("learn.noSubjectsTitle")}
        message={t("learn.noSubjectsBody")}
      />
    );
  }
  return <>{children(state.subjects)}</>;
}
