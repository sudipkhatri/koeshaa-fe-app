import type { en } from "./en";

type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Every locale has exactly the English keys (a missing or extra key fails to compile). */
export type Messages = Widen<typeof en>;

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = {
  [K in keyof T]: T[K] extends string ? K : Join<K, Paths<T[K]>>;
}[keyof T];

/** `"errors.network"` and so on. */
export type MessageKey = Paths<Messages>;

export type Locale = "en" | "ne";
