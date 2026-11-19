/** Local demo data for Search. The backend replaces these later. */
export const initialRecents = ["Fractions", "Photosynthesis"];

export function getPopular(): string[] {
  return ["Fractions", "Our Earth", "Tenses", "Nutrition"];
}

/** More than this many keystrokes inside the window triggers the slow-down state (rate limit demo). */
export const TYPING_LIMIT = 9;
export const TYPING_WINDOW_MS = 4000;
export const SLOW_DOWN_MS = 5000;
