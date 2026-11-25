"use client";

import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

import { useMessages } from "@/lib/locale";

const buttonTone = {
  primary: "bg-primary text-on-primary enabled:hover:bg-primary-pressed",
  quiet: "border border-admin-border bg-admin-surface text-admin-ink enabled:hover:bg-admin-page",
  danger: "border border-admin-danger-line bg-admin-danger-soft text-admin-danger",
} as const;

const buttonSize = {
  sm: "md:h-8 px-3 text-caption",
  md: "md:h-9 px-4",
  lg: "md:h-10 px-4.5",
} as const;

type Tone = keyof typeof buttonTone;
type Size = keyof typeof buttonSize;

export function SchoolButton({
  tone = "primary",
  size = "md",
  pending = false,
  disabled,
  type = "button",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: Size; pending?: boolean }) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 md:min-h-0 ${buttonTone[tone]} ${buttonSize[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ApiNote({ what }: { what: string }) {
  const { translate } = useMessages();
  return (
    <div className="flex gap-3 rounded-xl border border-dashed border-admin-dashed bg-admin-rule px-4 py-3.5 text-admin-quiet">
      <p className="text-caption">
        <strong className="font-semibold text-admin-ink">{translate("admin.apiToBeAdded")}.</strong>{" "}
        {what}
      </p>
    </div>
  );
}

export function ApiTag() {
  const { translate } = useMessages();
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-dashed border-admin-dashed bg-admin-rule px-2 py-px text-tag font-semibold text-admin-quiet">
      {translate("admin.apiToBeAdded")}
    </span>
  );
}

export function SchoolTextInput({
  label,
  hint,
  error,
  className = "",
  id: idProp,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-caption font-semibold text-admin-ink">{label}</span>
      <input
        id={id}
        className={`min-h-12 rounded-square border bg-admin-surface px-3 text-admin-ink placeholder:text-admin-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-admin-subtle md:min-h-10 ${error ? "border-admin-danger" : "border-admin-border"}`}
        {...props}
      />
      {hint && !error ? <span className="text-tag text-admin-soft">{hint}</span> : null}
      {error ? (
        <span role="alert" className="text-caption text-admin-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-xl border border-admin-border bg-admin-surface ${className}`}
    >
      {children}
    </section>
  );
}
