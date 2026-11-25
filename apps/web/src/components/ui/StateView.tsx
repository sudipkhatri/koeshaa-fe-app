"use client";

import { Button } from "./Button";

export function StateView({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <section role="status" className="flex flex-col gap-3 py-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-text-muted">{message}</p>
      {onRetry && retryLabel ? (
        <Button type="button" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </section>
  );
}
