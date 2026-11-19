import { Screen, StateView } from "@/components/ui";

import type { SubjectsState } from "../api";

import { SubjectsGate } from "./SubjectsGate";

/** A subject, chapter or lesson that cannot be shown: loading, offline, error, or not found. */
export function SubjectMissing({ state }: { state: SubjectsState }) {
  return (
    <Screen edges={["top"]}>
      <SubjectsGate state={state}>{() => <StateView kind="empty" />}</SubjectsGate>
    </Screen>
  );
}
