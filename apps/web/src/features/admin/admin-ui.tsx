"use client";

import Link from "next/link";
import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

import { useMessages } from "@/lib/locale";

import { AdminIcon } from "./AdminIcon";

const buttonTone = {
  primary: "bg-primary text-on-primary enabled:hover:bg-primary-pressed",
  quiet: "border border-admin-border bg-admin-surface text-admin-ink enabled:hover:bg-admin-page",
  danger: "bg-danger-fill text-on-danger-fill enabled:hover:opacity-90",
  dangerQuiet: "border border-admin-danger-line bg-admin-danger-soft text-admin-danger",
  reward: "border border-reward bg-reward-tint text-on-reward-tint",
} as const;

const buttonSize = {
  sm: "md:h-8 px-3 text-caption",
  md: "md:h-9 px-4",
  lg: "md:h-10 px-4.5",
} as const;

type Tone = keyof typeof buttonTone;
type Size = keyof typeof buttonSize;

function buttonClass(tone: Tone, size: Size, className: string): string {
  return `inline-flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 md:min-h-0 ${buttonTone[tone]} ${buttonSize[size]} ${className}`;
}

export function AdminButton({
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
      className={buttonClass(tone, size, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminButtonLink({
  href,
  tone = "primary",
  size = "md",
  children,
}: {
  href: string;
  tone?: Tone;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(tone, size, "")}>
      {children}
    </Link>
  );
}

/** The boards' dashed panel for anything drawn without an endpoint behind it. */
export function ApiNote({ what }: { what: string }) {
  const { translate } = useMessages();
  return (
    <div className="flex gap-3 rounded-xl border border-dashed border-admin-dashed bg-admin-rule px-4 py-3.5 text-admin-quiet">
      <span className="mt-px">
        <AdminIcon name="info" className="size-5" />
      </span>
      <p className="text-caption">
        <strong className="font-semibold text-admin-ink">{translate("admin.apiToBeAdded")}.</strong>{" "}
        {what}
      </p>
    </div>
  );
}

/** A small inline marker for one control or figure without an endpoint. */
export function ApiTag() {
  const { translate } = useMessages();
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-dashed border-admin-dashed bg-admin-rule px-2 py-px text-tag font-semibold text-admin-quiet">
      {translate("admin.apiToBeAdded")}
    </span>
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

export function AdminTextInput({
  label,
  hint,
  error,
  strong = false,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  strong?: boolean;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={`min-h-12 rounded-square border bg-admin-surface px-3 text-admin-ink placeholder:text-admin-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-admin-subtle ${strong ? "text-body font-semibold tabular-nums md:min-h-11" : "md:min-h-10"} ${error ? "border-admin-danger" : "border-admin-border"}`}
        {...props}
      />
      {note ? (
        <p id={noteId} className={`text-micro ${error ? "text-admin-danger" : "text-admin-soft"}`}>
          {note}
        </p>
      ) : null}
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-micro font-semibold tracking-widest text-admin-soft uppercase"
    >
      {children}
    </label>
  );
}
