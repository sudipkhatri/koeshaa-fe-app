import Link from "next/link";
import type { ReactNode } from "react";

const toneClass = {
  muted: "text-text-muted hover:text-text focus-visible:outline-primary",
  onDark: "text-on-primary focus-visible:outline-reward",
} as const;

/** A text link for navigation bars and footers. */
export function TextLink({
  href,
  tone = "muted",
  children,
  onNavigate,
}: {
  href: string;
  tone?: keyof typeof toneClass;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`inline-flex min-h-12 cursor-pointer items-center rounded-card px-3 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${toneClass[tone]}`}
    >
      {children}
    </Link>
  );
}
