import { useQuery } from "@tanstack/react-query";

import type { components } from "@keoshaa/api-client";
import type { SubjectId } from "@keoshaa/tokens";

import { useClassInfo } from "@/features/enrollment/api";
import type { ClassSubject } from "@/features/enrollment/api";
import { useApi } from "@/features/session/use-api";
import { isMockMode } from "@/lib/config";
import { keys } from "@/lib/query";

import { getSubject as getDemoSubject, getSubjects as getDemoSubjects, subjectIds } from "./mock";
import type { Chapter, Subject } from "./types";

type FreeSliceSubject = components["schemas"]["FreeSliceSubjectRead"];

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
 * Subjects come from the student's enrollment. Chapter names come from the free slice.
 * The backend has no lesson body yet, so opening a real chapter says lessons are coming soon.
 * Demo chapters exist only in mock mode.
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

function freeChapters(slice: readonly FreeSliceSubject[]): Map<string, Chapter[]> {
  return new Map(
    slice.map((subject) => [
      subject.code,
      subject.chapters.map((chapter, index) => ({
        index,
        chapterId: chapter.chapter_id,
        name: { en: chapter.name, ne: chapter.name },
      })),
    ]),
  );
}

function withFreeChapters(subjects: Subject[], slice: readonly FreeSliceSubject[]): Subject[] {
  const chapters = freeChapters(slice);
  return subjects.map((subject) => {
    const next = chapters.get(subject.id);
    return next ? { ...subject, chapters: next } : subject;
  });
}

/** Free chapter names for the student's class. Disabled until the class is known. */
export function useFreeSlice(grade: number, stream: string | null, enabled: boolean) {
  const api = useApi();
  const gradeCode = `c${grade}`;
  return useQuery({
    queryKey: keys.freeSlice(gradeCode, stream),
    enabled: enabled && api !== null && grade > 0,
    // Chapter names change rarely; reading them on every visit would waste mobile data.
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!api) return [];
      const { data } = await api.GET("/api/v1/catalog/grade-levels/{grade}/free-slice", {
        params: { path: { grade: gradeCode }, query: { stream } },
      });
      return data?.data.subjects ?? [];
    },
  });
}

export function useSubjects(): SubjectsState {
  const mocks = isMockMode();
  const classInfo = useClassInfo();
  const grade = classInfo.data?.grade ?? 0;
  const stream = classInfo.data?.stream ?? null;
  const slice = useFreeSlice(grade, stream, !mocks && classInfo.data != null);
  const subjects = mocks
    ? getDemoSubjects()
    : withFreeChapters(toSubjects(classInfo.data?.subjects ?? []), slice.data ?? []);
  return {
    subjects,
    isPending: classInfo.isPending || (!mocks && classInfo.data != null && slice.isPending),
    isError: classInfo.isError || slice.isError,
    error: slice.error ?? classInfo.error,
    refetch: () => {
      void classInfo.refetch();
      void slice.refetch();
    },
    hasClass: mocks || classInfo.data != null,
  };
}

/** One subject by route id; unknown ids (real mode) are "not found", never demo data. */
export function useSubject(id: string | null): { subject: Subject | undefined } & SubjectsState {
  const state = useSubjects();
  const subject = id === null ? undefined : state.subjects.find((s) => s.id === id);
  return { ...state, subject };
}
