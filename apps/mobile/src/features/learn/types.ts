import type { SubjectId } from "@keoshaa/tokens";

export interface Bilingual {
  en: string;
  ne: string;
}

export interface Chapter {
  /** Zero-based position in the subject. */
  index: number;
  name: Bilingual;
  /** Free-slice chapter id. Demo chapters omit it. */
  chapterId?: string;
}

export interface Subject {
  /** Route and list key: the backend subject code (or the demo id in mock mode). */
  id: string;
  /** Colour and illustration. */
  art: SubjectId;
  name: Bilingual;
  chapters: readonly Chapter[];
  /** Chapters finished, in order from the first. */
  doneCount: number;
  /** Percent into the chapter that follows the finished ones, if started. */
  currentPercent: number;
}

export type TopicKind = "video" | "notes" | "practice";

export interface Topic {
  index: number;
  kind: TopicKind;
  title: Bilingual;
  detail: Bilingual;
}

export type ChapterStatus = "done" | "inProgress" | "free" | "locked";
