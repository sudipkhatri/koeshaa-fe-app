import { useEffect, useState } from "react";

/** Whole seconds left until a timestamp (ms), ticking once a second; 0 when it has passed. */
export function useCountdownUntil(until: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}
