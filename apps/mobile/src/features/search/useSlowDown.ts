import { useEffect, useRef, useState } from "react";

import { SLOW_DOWN_MS, TYPING_LIMIT, TYPING_WINDOW_MS } from "./mock";

/** Demo rate limit: too many keystrokes in a few seconds pauses search for a moment. */
export function useSlowDown() {
  const [slow, setSlow] = useState(false);
  const strokes = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const recordKeystroke = () => {
    const now = Date.now();
    strokes.current = [...strokes.current.filter((at) => now - at < TYPING_WINDOW_MS), now];
    if (strokes.current.length > TYPING_LIMIT && !slow) {
      setSlow(true);
      timer.current = setTimeout(() => {
        strokes.current = [];
        setSlow(false);
      }, SLOW_DOWN_MS);
    }
  };
  return { slow, recordKeystroke };
}
