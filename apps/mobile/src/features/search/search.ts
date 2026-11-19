import { chapterStatus } from "@/features/learn/progress";
import type { Chapter, Subject } from "@/features/learn/types";

export interface SearchHit {
  chapter: Chapter;
  locked: boolean;
}

export interface SearchGroup {
  subject: Subject;
  hits: SearchHit[];
}

export interface SearchResult {
  groups: SearchGroup[];
  /** A close spelling to offer when nothing matched. */
  suggestion: string | null;
}

/** Edit distance between two words (insert, delete, replace). */
export function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j] ?? 0;
      row[j] = Math.min(
        above + 1,
        (row[j - 1] ?? 0) + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return row[b.length] ?? 0;
}

function suggest(query: string, subjects: readonly Subject[]): string | null {
  let best: string | null = null;
  let bestDistance = 3;
  for (const subject of subjects) {
    for (const chapter of subject.chapters) {
      for (const word of chapter.name.en.toLowerCase().split(/\s+/)) {
        if (word.length <= 3) continue;
        const distance = editDistance(query, word);
        if (distance > 0 && distance < bestDistance) {
          bestDistance = distance;
          best = word;
        }
      }
    }
  }
  return best;
}

/** Chapters whose name (either language) or subject name contains the text, grouped by subject. */
export function searchChapters(rawQuery: string, subjects: readonly Subject[]): SearchResult {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return { groups: [], suggestion: null };
  const groups: SearchGroup[] = [];
  for (const subject of subjects) {
    const subjectMatches =
      subject.name.en.toLowerCase().includes(query) || subject.name.ne.includes(query);
    const hits = subject.chapters
      .filter(
        (chapter) =>
          subjectMatches ||
          chapter.name.en.toLowerCase().includes(query) ||
          chapter.name.ne.toLowerCase().includes(query),
      )
      .map((chapter) => ({ chapter, locked: chapterStatus(subject, chapter.index) === "locked" }));
    if (hits.length) groups.push({ subject, hits });
  }
  return { groups, suggestion: groups.length ? null : suggest(query, subjects) };
}
