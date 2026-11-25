import { createContext, useContext, type ReactNode } from "react";

const headClass =
  "border-b border-admin-border text-micro font-semibold tracking-wider whitespace-nowrap text-admin-soft uppercase";

type SortDirection = "none" | "ascending" | "descending";

const Roomy = createContext(false);

function usePad(): string {
  return useContext(Roomy) ? "px-6" : "px-4.5";
}

const pillTone = {
  primary: "bg-primary-tint text-admin-on-tint",
  sky: "bg-sky-tint text-on-sky-tint",
  success: "bg-success-tint text-on-success-tint",
  danger: "bg-danger-tint text-on-danger-tint",
  reward: "bg-reward-tint text-on-reward-tint",
  quiet: "bg-admin-rule text-admin-quiet",
} as const;

export type PillTone = keyof typeof pillTone;

export function DataTable({
  children,
  footer,
  minWidth = "min-w-205",
  bare = false,
  roomy = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  minWidth?:
    | "min-w-110"
    | "min-w-140"
    | "min-w-150"
    | "min-w-160"
    | "min-w-190"
    | "min-w-205"
    | "min-w-235"
    | "min-w-260";
  bare?: boolean;
  roomy?: boolean;
}) {
  return (
    <Roomy.Provider value={roomy}>
      <div
        className={
          bare ? "" : "overflow-hidden rounded-xl border border-admin-border bg-admin-surface"
        }
      >
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse text-left ${minWidth}`}>{children}</table>
        </div>
        {footer}
      </div>
    </Roomy.Provider>
  );
}

export function HeadRow({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-admin-page">
      <tr>{children}</tr>
    </thead>
  );
}

export function ColumnHead({
  children,
  align = "left",
  sort,
  onSort,
}: {
  children: ReactNode;
  align?: "left" | "right";
  sort?: SortDirection;
  onSort?: () => void;
}) {
  const pad = usePad();
  const active = sort === "ascending" || sort === "descending";
  const label = sort ? (
    <span className={`inline-flex items-center gap-1.5 ${active ? "text-admin-on-tint" : ""}`}>
      {children}
      <SortIcon sort={sort} />
    </span>
  ) : (
    children
  );
  const alignClass = align === "right" ? "text-right" : "text-left";
  return (
    <th
      scope="col"
      aria-sort={sort}
      className={`${headClass} ${onSort ? "p-0" : `${pad} py-2.5`} ${alignClass}`}
    >
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          className={`flex min-h-12 w-full cursor-pointer items-center gap-1.5 py-2.5 md:min-h-0 ${pad} ${align === "right" ? "justify-end" : "justify-start"}`}
        >
          {label}
        </button>
      ) : (
        label
      )}
    </th>
  );
}

function SortIcon({ sort }: { sort: SortDirection }) {
  const active = sort !== "none";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 1.7 : 1.4}
      className={`size-3 shrink-0 ${active ? "text-primary" : "text-admin-hint"}`}
    >
      <path
        d={
          sort === "ascending"
            ? "M6 9.6V2.4M3.2 5.2 6 2.4l2.8 2.8"
            : sort === "descending"
              ? "M6 2.4v7.2M3.2 6.8 6 9.6l2.8-2.8"
              : "M3.5 4.8 6 2.3l2.5 2.5M3.5 7.2 6 9.7l2.5-2.5"
        }
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BodyRow({ children }: { children: ReactNode }) {
  return <tr className="border-b border-admin-rule last:border-b-0">{children}</tr>;
}

export function ColumnCell({
  children,
  align = "left",
  muted = false,
  compact = false,
}: {
  children: ReactNode;
  align?: "left" | "right";
  muted?: boolean;
  compact?: boolean;
}) {
  return (
    <td
      className={`${usePad()} ${compact ? "py-2.75" : "py-3"} ${align === "right" ? "text-right tabular-nums" : ""} ${muted ? "text-admin-soft" : ""}`}
    >
      {children}
    </td>
  );
}

export function StatusPill({ children, tone }: { children: ReactNode; tone: PillTone }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.75 text-micro font-semibold whitespace-nowrap ${pillTone[tone]}`}
    >
      {children}
    </span>
  );
}
