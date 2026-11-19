import type { SubjectId } from "@keoshaa/tokens";

import type { Bilingual, Chapter, Subject, Topic } from "./types";

/** Local demo content. The backend replaces these functions later; screens only call them. */
export const FREE_CHAPTERS = 2;
export const LESSONS_PER_CHAPTER = 4;

const names = (pairs: [string, string][]): Chapter[] =>
  pairs.map(([en, ne], index) => ({ index, name: { en, ne } }));

const progress: Record<SubjectId, { done: number; percent: number }> = {
  science: { done: 2, percent: 0 },
  maths: { done: 0, percent: 40 },
  english: { done: 1, percent: 20 },
  nepali: { done: 0, percent: 0 },
  social: { done: 1, percent: 0 },
  health: { done: 0, percent: 0 },
};

const content: Record<SubjectId, { name: Bilingual; chapters: [string, string][] }> = {
  science: {
    name: { en: "Science", ne: "विज्ञान" },
    chapters: [
      ["Living things", "जीवित वस्तुहरू"],
      ["Photosynthesis", "प्रकाश संश्लेषण"],
      ["Force and motion", "बल र गति"],
      ["Light", "प्रकाश"],
      ["Heat", "ताप"],
      ["Matter around us", "हाम्रो वरपरका पदार्थ"],
    ],
  },
  maths: {
    name: { en: "Mathematics", ne: "गणित" },
    chapters: [
      ["Fractions", "भिन्न"],
      ["Decimals", "दशमलव"],
      ["Ratio and proportion", "अनुपात र समानुपात"],
      ["Integers", "पूर्णाङ्क"],
      ["Perimeter and area", "परिमिति र क्षेत्रफल"],
      ["Algebra basics", "बीजगणितको आधार"],
    ],
  },
  english: {
    name: { en: "English", ne: "अंग्रेजी" },
    chapters: [
      ["My family", "My family"],
      ["Nouns and pronouns", "Nouns and pronouns"],
      ["The mountain village", "The mountain village"],
      ["Tenses", "Tenses"],
      ["Writing a letter", "Writing a letter"],
      ["Reading comprehension", "Reading comprehension"],
    ],
  },
  nepali: {
    name: { en: "Nepali", ne: "नेपाली" },
    chapters: [
      ["Our country", "हाम्रो देश"],
      ["Spelling", "वर्णविन्यास"],
      ["Poem", "कविता"],
      ["Grammar", "व्याकरण"],
      ["Essay writing", "निबन्ध लेखन"],
      ["Letter writing", "पत्र लेखन"],
    ],
  },
  social: {
    name: { en: "Social Studies", ne: "सामाजिक अध्ययन" },
    chapters: [
      ["Our Earth", "हाम्रो पृथ्वी"],
      ["Maps and directions", "नक्सा र दिशा"],
      ["Geography of Nepal", "नेपालको भूगोल"],
      ["Rivers of Nepal", "नेपालका नदीहरू"],
      ["Festivals and culture", "चाडपर्व र संस्कृति"],
      ["Our community", "हाम्रो समुदाय"],
    ],
  },
  health: {
    name: { en: "Health & PE", ne: "स्वास्थ्य तथा शारीरिक शिक्षा" },
    chapters: [
      ["Healthy habits", "स्वस्थ बानी"],
      ["Nutrition", "पोषण"],
      ["Safety first", "सुरक्षा पहिले"],
      ["Yoga and stretching", "योग र स्ट्रेचिङ"],
      ["Team games", "टोली खेल"],
      ["Growing up", "हुर्कँदै"],
    ],
  },
};

export const demoChapters = (id: SubjectId): Chapter[] => names(content[id].chapters);

export const subjectIds = Object.keys(content) as SubjectId[];

export function getSubjects(): Subject[] {
  return subjectIds.map((id) => ({
    id,
    art: id,
    name: content[id].name,
    chapters: names(content[id].chapters),
    doneCount: progress[id].done,
    currentPercent: progress[id].percent,
  }));
}

export function getSubject(id: string): Subject | undefined {
  return getSubjects().find((subject) => subject.id === id);
}

export function getTopics(): Topic[] {
  return [
    {
      index: 0,
      kind: "video",
      title: { en: "Introduction", ne: "परिचय" },
      detail: { en: "4 min", ne: "४ मिनेट" },
    },
    {
      index: 1,
      kind: "notes",
      title: { en: "Key ideas", ne: "मुख्य कुरा" },
      detail: { en: "3 min read", ne: "३ मिनेट पढ्ने" },
    },
    {
      index: 2,
      kind: "video",
      title: { en: "Worked example", ne: "उदाहरण सहित" },
      detail: { en: "6 min", ne: "६ मिनेट" },
    },
    {
      index: 3,
      kind: "practice",
      title: { en: "Practice questions", ne: "अभ्यास प्रश्न" },
      detail: { en: "5 questions", ne: "५ प्रश्न" },
    },
  ];
}
