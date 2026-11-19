/** Local demo account for `EXPO_PUBLIC_USE_MOCKS=1`; nothing else reads this file. */
export type StreamId = "science" | "management" | "humanities" | "education" | "law";
export const streamIds: readonly StreamId[] = [
  "science",
  "management",
  "humanities",
  "education",
  "law",
];

export const MAX_DEVICES = 3;
