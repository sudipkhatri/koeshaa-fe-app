"use client";

import { useState } from "react";
import { encode } from "uqr";
import { z } from "zod";

import { useMessages } from "@/lib/locale";

const otpauthUri = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "otpauth:" && url.hostname === "totp" && url.searchParams.has("secret");
  } catch {
    return false;
  }
});

export function AuthenticatorQr({ uri, label }: { uri: string; label: string }) {
  const parsed = otpauthUri.safeParse(uri);
  if (!parsed.success) return null;
  const qr = encode(parsed.data, { ecc: "M", border: 2 });
  const modules = qr.data
    .flatMap((row, y) => row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : "")))
    .join("");
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${qr.size} ${qr.size}`}
      className="size-32 shrink-0 rounded-xl border border-line bg-canvas text-text"
    >
      <path d={modules} className="fill-current" />
    </svg>
  );
}

export function AuthenticatorKey({
  secret,
  uri,
}: {
  secret: string;
  uri: string | null | undefined;
}) {
  const { translate } = useMessages();
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(secret.replace(/\s+/g, ""));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-5">
      {uri ? <AuthenticatorQr uri={uri} label={translate("auth.mfaQr")} /> : null}
      <div className="flex min-w-0 flex-1 basis-40 flex-col gap-2">
        <p className="text-xs font-semibold tracking-widest text-ink-soft uppercase">
          {translate("auth.mfaOrType")}
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-mist py-2 pr-1 pl-3">
          <code className="min-w-0 flex-1 font-mono text-sm break-all">
            {groupedSecret(secret)}
          </code>
          <button
            type="button"
            className="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-soft hover:bg-canvas"
            aria-label={translate("auth.mfaCopy")}
            onClick={() => void copyKey()}
          >
            <CopyIcon />
          </button>
        </div>
        <p className="text-xs text-ink-soft">{translate("auth.mfaStays")}</p>
        {copied ? <p role="status">{translate("auth.mfaCopied")}</p> : null}
      </div>
    </div>
  );
}

function groupedSecret(secret: string): string {
  const compact = secret.replace(/\s+/g, "");
  return compact.match(/.{1,4}/g)?.join(" ") ?? compact;
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="7" y="7" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 4.8H5.8A1 1 0 0 0 4.8 5.8V13" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
