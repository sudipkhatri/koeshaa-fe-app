import { FREE_CHAPTERS } from "./mock";
import type { ChapterStatus, Subject } from "./types";

export function subjectPercent(subject: Subject): number {
  if (subject.chapters.length === 0) return 0;
  return Math.round((subject.doneCount * 100 + subject.currentPercent) / subject.chapters.length);
}

export function chapterStatus(subject: Subject, index: number): ChapterStatus {
  if (index < subject.doneCount) return "done";
  if (index === subject.doneCount && subject.currentPercent > 0) return "inProgress";
  const chapter = subject.chapters[index];
  if (chapter?.chapterId) return "free";
  return index >= FREE_CHAPTERS ? "locked" : "free";
}

export function chaptersDoneTotal(subjects: readonly Subject[]): number {
  return subjects.reduce((sum, subject) => sum + subject.doneCount, 0);
}

/** "math:0" style route reference: subject id and zero-based chapter index. */
export function chapterRef(subjectId: string, index: number): string {
  return `${subjectId}:${index}`;
}

export function parseChapterRef(ref: string): { subjectId: string; index: number } | null {
  const [subjectId, rawIndex] = ref.split(":");
  const index = Number(rawIndex);
  return subjectId && Number.isInteger(index) && index >= 0 ? { subjectId, index } : null;
}
