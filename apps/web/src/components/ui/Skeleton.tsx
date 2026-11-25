import type { ReactNode } from "react";

export function SkeletonBlock({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg motion-reduce:animate-none ${className}`}
    />
  );
}

function SkeletonStatus({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function AdminSkeleton({ label }: { label: string }) {
  return (
    <SkeletonStatus label={label} className="min-h-dvh bg-admin-page">
      <div className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-3 border-r border-admin-border bg-admin-surface px-3.5 py-5 md:flex">
        <SkeletonBlock className="h-7.5 w-36 bg-admin-rule" />
        <SkeletonBlock className="mt-3 h-9 w-full bg-admin-rule" />
        <SkeletonBlock className="h-9 w-full bg-admin-rule" />
        <SkeletonBlock className="h-9 w-full bg-admin-rule" />
        <SkeletonBlock className="mt-auto h-9 w-full bg-admin-rule" />
      </div>
      <div className="flex min-w-0 flex-col md:pl-60">
        <div className="border-b border-admin-border bg-admin-surface px-4 py-4 sm:px-7">
          <SkeletonBlock className="h-7.5 w-40 bg-admin-rule" />
        </div>
        <div className="flex max-w-295 flex-col gap-6 px-4 pt-6 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonBlock className="h-28 bg-admin-rule" />
            <SkeletonBlock className="h-28 bg-admin-rule" />
            <SkeletonBlock className="h-28 bg-admin-rule" />
            <SkeletonBlock className="h-28 bg-admin-rule" />
          </div>
          <SkeletonBlock className="h-64 bg-admin-rule" />
        </div>
      </div>
    </SkeletonStatus>
  );
}

export function ContentSkeleton({ label }: { label: string }) {
  return (
    <SkeletonStatus label={label} className="flex flex-col gap-3 py-4">
      <SkeletonBlock className="h-11 w-full bg-admin-rule" />
      <SkeletonBlock className="h-11 w-full bg-admin-rule" />
      <SkeletonBlock className="h-11 w-full bg-admin-rule" />
    </SkeletonStatus>
  );
}
