/**
 * Read-only "view as" session. The impersonation access token stays in memory only
 * (never storage, never React state). The staff access token in `@/lib/session` is
 * unchanged so admin calls and End session keep using the staff identity.
 */

export interface ViewSessionMeta {
  userId: string;
  name: string;
  readOnly: boolean;
  /** Wall-clock end from expires_in when the session started. */
  endsAt: number;
  startedAt: number;
}

export interface ViewEndedNote {
  userId: string;
  name: string;
  minutes: number;
}

let accessToken: string | null = null;
let meta: ViewSessionMeta | null = null;
let endedNote: ViewEndedNote | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/** Public session facts for the UI. Never includes the access token. */
export function getViewSession(): ViewSessionMeta | null {
  return meta;
}

/** Impersonation token for a future student surface. Do not log or render. */
export function getViewAccessToken(): string | null {
  return accessToken;
}

export function getViewEndedNote(): ViewEndedNote | null {
  return endedNote;
}

export function clearViewEndedNote(): void {
  if (endedNote === null) return;
  endedNote = null;
  notify();
}

export function startViewSession(input: {
  accessToken: string;
  userId: string;
  name: string;
  expiresIn: number;
  readOnly: boolean;
}): void {
  const now = Date.now();
  accessToken = input.accessToken;
  meta = {
    userId: input.userId,
    name: input.name,
    readOnly: input.readOnly,
    endsAt: now + Math.max(0, input.expiresIn) * 1000,
    startedAt: now,
  };
  endedNote = null;
  notify();
}

export function endViewSessionLocally(): ViewEndedNote | null {
  if (meta === null) return null;
  const minutes = Math.max(1, Math.round((Date.now() - meta.startedAt) / 60_000));
  const note: ViewEndedNote = {
    userId: meta.userId,
    name: meta.name,
    minutes,
  };
  accessToken = null;
  meta = null;
  endedNote = note;
  notify();
  return note;
}

export function clearViewSession(): void {
  if (accessToken === null && meta === null && endedNote === null) return;
  accessToken = null;
  meta = null;
  endedNote = null;
  notify();
}

export function subscribeViewSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Minutes left until endsAt (at least 0). */
export function minutesLeft(session: ViewSessionMeta, now = Date.now()): number {
  return Math.max(0, Math.ceil((session.endsAt - now) / 60_000));
}
