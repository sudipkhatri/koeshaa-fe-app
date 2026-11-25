"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminSkeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";
import { SessionProvider, SignInScreen, useSession } from "@/features/session";
import { LocaleProvider, useMessages } from "@/lib/locale";
import { QueryProvider } from "@/lib/query";

import { AdminNav, CurrentAdminNav } from "./AdminNav";
import { AdminShellContext } from "./admin-shell";
import { ViewSessionBanner } from "./ViewSessionBanner";
import { clearViewSession } from "./view-session";

const COLLAPSED_KEY = "keoshaa.adminNav";

export function AdminApp({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <QueryProvider>
        <SessionProvider>
          <AdminFrame>{children}</AdminFrame>
        </SessionProvider>
      </QueryProvider>
    </LocaleProvider>
  );
}

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "collapsed";
  } catch {
    return false;
  }
}

function AdminFrame({ children }: { children: ReactNode }) {
  const session = useSession();
  const { translate } = useMessages();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const shell = useMemo(
    () => ({
      menuOpen,
      toggleMenu: () => setMenuOpen((open) => !open),
      collapsed,
      toggleCollapsed: () =>
        setCollapsed((current) => {
          try {
            window.localStorage.setItem(COLLAPSED_KEY, current ? "open" : "collapsed");
          } catch {
            return !current;
          }
          return !current;
        }),
    }),
    [menuOpen, collapsed],
  );

  if (session.status !== "signedIn") {
    return (
      <SessionHold
        status={session.status}
        translate={translate}
        onRetry={session.restore}
        onSignedIn={session.markSignedIn}
      />
    );
  }

  return (
    <AdminShellContext.Provider value={shell}>
      <div className="min-h-dvh bg-admin-page text-small text-admin-ink">
        {menuOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-overlay md:hidden"
            aria-label={translate("landing.closeMenu")}
            onClick={closeMenu}
          />
        ) : null}
        <Suspense
          fallback={<AdminNav pathname="" onClose={closeMenu} onSignOut={() => undefined} />}
        >
          <CurrentAdminNav
            onClose={closeMenu}
            onSignOut={() => {
              clearViewSession();
              void session.signOut();
            }}
          />
        </Suspense>
        <div className={`flex min-h-dvh min-w-0 flex-col ${collapsed ? "md:pl-16" : "md:pl-60"}`}>
          <ViewSessionBanner />
          {children}
        </div>
      </div>
    </AdminShellContext.Provider>
  );
}

function SessionHold({
  status,
  translate,
  onRetry,
  onSignedIn,
}: {
  status: "restoring" | "offline" | "failed" | "signedOut";
  translate: ReturnType<typeof useMessages>["translate"];
  onRetry: () => void;
  onSignedIn: () => void;
}) {
  if (status === "signedOut" || status === "offline")
    return <SignInScreen onSignedIn={onSignedIn} />;
  if (status === "restoring") return <AdminSkeleton label={translate("ui.loading")} />;
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <StateView
        title={translate("state.errorTitle")}
        message={translate("state.errorMessage")}
        retryLabel={translate("ui.retry")}
        onRetry={onRetry}
      />
    </main>
  );
}
