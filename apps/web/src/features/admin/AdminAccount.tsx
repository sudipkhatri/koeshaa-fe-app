"use client";

import { useEffect, useId, useRef, useState } from "react";

import { useMessages } from "@/lib/locale";

import { useAccount } from "./api";
import { initials } from "./nav-counts";
import { roleLabel, usePrimaryRole } from "./shell-api";

export function AdminAccount({ compact, onSignOut }: { compact: boolean; onSignOut: () => void }) {
  const { translate } = useMessages();
  const account = useAccount();
  const user = account.data?.user;
  const role = usePrimaryRole(user?.id);
  const name = user?.name ?? "";
  const roleText = role.data ? roleLabel(role.data) : "";
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    itemRef.current?.focus();
    function onPointer(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatar = (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-primary-tint text-caption font-semibold text-admin-on-tint ${compact ? "size-8.5" : "size-8"}`}
    >
      {initials(name)}
    </span>
  );

  return (
    <div
      ref={rootRef}
      className={`relative ${compact ? "mt-auto" : "mt-auto border-t border-admin-rule pt-4"}`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title={compact && roleText ? `${name} · ${roleText}` : undefined}
        onClick={() => setOpen((current) => !current)}
        className={`flex cursor-pointer items-center gap-2.5 rounded-lg text-left hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${compact ? "" : "-mx-1 w-full p-1"}`}
      >
        {avatar}
        {compact ? null : (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-caption font-semibold">{name}</span>
            {roleText ? <span className="text-micro text-admin-soft">{roleText}</span> : null}
          </span>
        )}
        <span className="sr-only">{translate("admin.accountOptions")}</span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={translate("admin.accountOptions")}
          className="absolute bottom-0 left-full z-40 ml-3 w-52 rounded-xl border border-admin-border bg-admin-surface p-1 shadow-card"
        >
          <button
            ref={itemRef}
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className="flex min-h-12 w-full cursor-pointer items-center rounded-lg px-3 text-left text-small font-semibold text-admin-ink hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-primary md:min-h-9"
          >
            {translate("common.signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
