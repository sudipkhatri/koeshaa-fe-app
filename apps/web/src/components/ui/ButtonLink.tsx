import Link from "next/link";
import type { ReactNode } from "react";

const toneClass = {
  primary: "bg-primary text-on-primary hover:bg-primary-pressed",
  quiet: "border border-border bg-surface text-text hover:bg-surface-muted",
  reward: "bg-reward text-on-reward hover:opacity-90",
  ink: "bg-text text-on-primary hover:bg-primary-pressed",
} as const;

/** A link that looks like a button. Use for navigation, not for actions that stay on the page. */
export function ButtonLink({
  href,
  tone = "primary",
  children,
  className = "",
  onNavigate,
}: {
  href: string;
  tone?: keyof typeof toneClass;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center rounded-card px-4 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${toneClass[tone]} ${className}`}
    >
      {children}
    </Link>
  );
}
