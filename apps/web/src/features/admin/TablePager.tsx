"use client";

import { useId, type ReactNode } from "react";

import { useMessages } from "@/lib/locale";

import { AdminIcon } from "./AdminIcon";
import { AdminButton } from "./admin-ui";

function pageWindow(index: number, count: number): number[] {
  const width = 5;
  const start = Math.max(0, Math.min(index - 2, count - width));
  const end = Math.min(count, start + width);
  return Array.from({ length: Math.max(0, end - start) }, (_, step) => start + step);
}

export const ROW_CHOICES = [20, 50, 100] as const;
export type RowChoice = (typeof ROW_CHOICES)[number];

export function TablePager({
  shown,
  rows,
  onRows,
  hasPrevious,
  hasNext,
  pending,
  onPrevious,
  onNext,
  summary,
  pageIndex = 0,
  pageCount,
  onPage,
}: {
  shown: number;
  rows: RowChoice;
  onRows: (rows: RowChoice) => void;
  hasPrevious: boolean;
  hasNext: boolean;
  pending: boolean;
  onPrevious: () => void;
  onNext: () => void;
  summary?: ReactNode;
  /** Zero-based page, with `pageCount`, draws numbered pages. */
  pageIndex?: number;
  pageCount?: number;
  onPage?: (pageIndex: number) => void;
}) {
  const { translate } = useMessages();
  const rowsId = useId();
  const [before, after] = translate("admin.showing", { count: "\u0000" }).split("\u0000");
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-admin-rule px-4.5 py-3">
      {summary ?? (
        <p className="text-caption text-admin-soft tabular-nums">
          {before}
          <strong className="font-semibold text-admin-ink">{shown}</strong>
          {after}
        </p>
      )}
      <label htmlFor={rowsId} className="flex items-center gap-2 text-caption text-admin-soft">
        {translate("admin.rows")}
        <select
          id={rowsId}
          aria-label={translate("admin.rowsPerPage")}
          value={rows}
          onChange={(event) => onRows(Number(event.target.value) as RowChoice)}
          className="min-h-12 cursor-pointer rounded-lg border border-admin-border bg-admin-surface px-2 text-caption text-admin-ink md:h-8 md:min-h-0"
        >
          {ROW_CHOICES.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      </label>
      <nav aria-label={translate("admin.pages")} className="ml-auto flex items-center gap-1">
        <AdminButton tone="quiet" size="sm" disabled={!hasPrevious || pending} onClick={onPrevious}>
          <AdminIcon name="chevronLeft" className="size-3.25" strokeWidth={1.8} />
          {pageCount === undefined ? (
            translate("admin.previous")
          ) : (
            <span className="sr-only">{translate("admin.previous")}</span>
          )}
        </AdminButton>
        {pageCount !== undefined && onPage
          ? pageWindow(pageIndex, pageCount).map((page) => (
              <AdminButton
                key={page}
                tone={page === pageIndex ? "primary" : "quiet"}
                size="sm"
                aria-current={page === pageIndex ? "page" : undefined}
                disabled={pending}
                onClick={() => onPage(page)}
              >
                {page + 1}
              </AdminButton>
            ))
          : null}
        <AdminButton tone="quiet" size="sm" disabled={!hasNext || pending} onClick={onNext}>
          {pageCount === undefined ? (
            translate("admin.next")
          ) : (
            <span className="sr-only">{translate("admin.next")}</span>
          )}
          <AdminIcon name="chevronRight" className="size-3.25" strokeWidth={1.8} />
        </AdminButton>
      </nav>
    </div>
  );
}
