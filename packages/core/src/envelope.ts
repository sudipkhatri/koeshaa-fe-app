/**
 * The backend's response envelope (backend ADR 0006): every response is
 * `{success, data | error, meta}`. Errors carry a stable `code` the apps switch on, never the
 * message text.
 */

export interface ErrorDetail {
  readonly field?: string | null;
  readonly code: string;
  readonly message: string;
}

export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: readonly ErrorDetail[] | null;
}

export interface Pagination {
  readonly limit: number;
  readonly next_cursor?: string | null;
  readonly offset?: number | null;
  readonly total?: number | null;
}

export interface Meta {
  readonly request_id?: string | null;
  readonly pagination?: Pagination | null;
}

export type Envelope<T> =
  | { readonly success: true; readonly data: T; readonly error?: null; readonly meta?: Meta }
  | {
      readonly success: false;
      readonly data?: null;
      readonly error: ApiErrorBody;
      readonly meta?: Meta;
    };
