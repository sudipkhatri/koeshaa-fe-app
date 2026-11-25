"use client";

import { Button } from "@/components/ui/Button";
import { useMessages } from "@/lib/locale";

export function RecoveryCodes({
  codes,
  onSaved,
}: {
  codes: readonly string[];
  onSaved: () => void;
}) {
  const { translate } = useMessages();
  return (
    <section className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-line bg-canvas p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{translate("auth.backupTitle")}</h2>
        <p className="text-sm text-ink-soft">{translate("auth.backupOnce")}</p>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {codes.map((code, index) => (
          <li key={code}>
            <code className="block rounded-lg bg-mist px-3 py-2 font-mono text-sm break-all">
              <span className="sr-only">{translate("auth.backupItem", { n: index + 1 })} </span>
              {code}
            </code>
          </li>
        ))}
      </ul>
      <p className="flex gap-3 rounded-xl bg-reward/25 p-3 text-sm text-on-reward">
        <WarningIcon />
        <span>{translate("auth.backupWarning")}</span>
      </p>
      <Button type="button" tone="quiet" onClick={onSaved}>
        {translate("auth.backupSaved")}
      </Button>
    </section>
  );
}

function WarningIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="mt-0.5 shrink-0"
    >
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 6.5v4.2M10 13.6v.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
