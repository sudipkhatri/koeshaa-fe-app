"use client";

import type { ButtonHTMLAttributes } from "react";

const toneClass = {
  primary: "bg-primary text-on-primary enabled:hover:bg-primary-pressed",
  quiet: "border border-border bg-surface text-text enabled:hover:bg-surface-muted",
  danger: "bg-danger-fill text-on-danger-fill enabled:hover:opacity-90",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  tone?: keyof typeof toneClass;
};

export function Button({
  pending = false,
  tone = "primary",
  children,
  disabled,
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center rounded-card px-4 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${toneClass[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
