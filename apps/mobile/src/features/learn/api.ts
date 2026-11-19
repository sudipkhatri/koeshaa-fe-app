import { useMemo } from "react";

import type { SubjectId } from "@keoshaa/tokens";

import { useClassInfo } from "@/features/enrollment/api";
import type { ClassSubject } from "@/features/enrollment/api";
import { isMockMode } from "@/lib/config";

import { getSubject as getDemoSubject, getSubjects as getDemoSubjects, subjectIds } from "./mock";
import type { Subject } from "./types";

const ART_BY_CODE: Record<string, SubjectId> = {
  nepali: "nepali",
  english: "english",
  mathematics: "maths",
  science_technology: "science",
  social_studies: "social",
  health_population_environment: "health",
};

/** Optional subjects without their own illustration borrow an unused one so every tile has art. */
function assignArt(subjects: readonly ClassSubject[]): SubjectId[] {
  const used = new Set<SubjectId>();
  const art: (SubjectId | null)[] = subjects.map((s) => {
    const own = ART_BY_CODE[s.code];
    if (own) used.add(own);
    return own ?? null;
  });
  const spare = subjectIds.filter((id) => !used.has(id));
  return art.map((id, i) => id ?? spare.shift() ?? subjectIds[i % subjectIds.length] ?? "english");
}

/**
 * Subjects come from the student's enrollment (backend). The backend has no chapter, progress
 * or content endpoint for students yet, so real subjects have no chapters ("coming soon");
 * demo chapters exist only in mock mode.
 */
export function toSubjects(subjects: readonly ClassSubject[]): Subject[] {
  const art = assignArt(subjects);
  return subjects.map((s, i) => {
    const id = art[i] ?? "english";
    const demo = getDemoSubject(id);
    return {
      id: s.code,
      art: id,
      name: { en: s.name, ne: demo?.name.ne ?? s.name },
      chapters: [],
      doneCount: 0,
      currentPercent: 0,
    };
  });
}

export interface SubjectsState {
  subjects: Subject[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  /** False until the student has picked a class (then there is nothing to show yet). */
  hasClass: boolean;
}

export function useSubjects(): SubjectsState {
  const mocks = isMockMode();
  const { data, isPending, isError, error, refetch } = useClassInfo();
  const subjects = useMemo(
    () => (mocks ? getDemoSubjects() : toSubjects(data?.subjects ?? [])),
    [mocks, data],
  );
  return {
    subjects,
    isPending,
    isError,
    error,
    refetch: () => void refetch(),
    hasClass: mocks || !!data,
  };
}

/** One subject by route id; unknown ids (real mode) are "not found", never demo data. */
export function useSubject(id: string | null): { subject: Subject | undefined } & SubjectsState {
  const state = useSubjects();
  const subject = id === null ? undefined : state.subjects.find((s) => s.id === id);
  return { ...state, subject };
}
