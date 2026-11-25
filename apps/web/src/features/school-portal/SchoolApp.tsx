"use client";

import { useParams } from "next/navigation";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { AdminSkeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";
import { SessionProvider, SignInScreen, useSession } from "@/features/session";
import { LocaleProvider, useMessages } from "@/lib/locale";
import { QueryProvider } from "@/lib/query";

import { SchoolNav, useMembership } from "./SchoolNav";
import { useMySchools } from "./school-api";

const SchoolShellContext = createContext<{ menuOpen: boolean; toggleMenu: () => void } | null>(
  null,
);

export function useSchoolShell() {
  const value = useContext(SchoolShellContext);
  if (!value) throw new Error("useSchoolShell must be used inside SchoolApp");
  return value;
}

/** Shell context without session — for screen tests. */
export function SchoolShellStub({ children }: { children: ReactNode }) {
  return (
    <SchoolShellContext.Provider value={{ menuOpen: false, toggleMenu: () => undefined }}>
      {children}
    </SchoolShellContext.Provider>
  );
}

export function SchoolApp({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <QueryProvider>
        <SessionProvider>
          <SchoolFrame>{children}</SchoolFrame>
        </SessionProvider>
      </QueryProvider>
    </LocaleProvider>
  );
}

function SchoolFrame({ children }: { children: ReactNode }) {
  const session = useSession();
  const { translate } = useMessages();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  if (session.status !== "signedIn") {
    if (session.status === "signedOut" || session.status === "offline") {
      return <SignInScreen onSignedIn={session.markSignedIn} />;
    }
    if (session.status === "restoring") {
      return <AdminSkeleton label={translate("ui.loading")} />;
    }
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <StateView
          title={translate("state.errorTitle")}
          message={translate("state.errorMessage")}
          retryLabel={translate("ui.retry")}
          onRetry={session.restore}
        />
      </main>
    );
  }

  return (
    <SchoolShellContext.Provider value={{ menuOpen, toggleMenu: () => setMenuOpen((o) => !o) }}>
      <div className="min-h-dvh bg-admin-page text-small text-admin-ink">
        {menuOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-overlay md:hidden"
            aria-label={translate("landing.closeMenu")}
            onClick={closeMenu}
          />
        ) : null}
        <Suspense fallback={null}>
          <SchoolChrome onClose={closeMenu} onSignOut={() => void session.signOut()} />
        </Suspense>
        <div className="flex min-h-dvh min-w-0 flex-col md:pl-60">{children}</div>
      </div>
    </SchoolShellContext.Provider>
  );
}

function SchoolChrome({ onClose, onSignOut }: { onClose: () => void; onSignOut: () => void }) {
  const params = useParams<{ organisationId?: string }>();
  const organisationId = params.organisationId;
  const { menuOpen } = useSchoolShell();
  const mine = useMySchools();
  if (!organisationId || !mine.data) return null;
  const school = mine.data.find((item) => item.organisation_id === organisationId);
  if (!school) return null;
  return (
    <SchoolNav
      organisationId={organisationId}
      school={school}
      onSignOut={onSignOut}
      menuOpen={menuOpen}
      onClose={onClose}
    />
  );
}

export function SchoolMembershipGate({
  organisationId,
  children,
}: {
  organisationId: string;
  children: ReactNode;
}) {
  const { translate } = useMessages();
  const membership = useMembership(organisationId);
  const mine = useMySchools();

  if (mine.isPending || membership === undefined) {
    return <AdminSkeleton label={translate("ui.loading")} />;
  }
  if (mine.isError) {
    return (
      <main className="px-4 py-8 sm:px-7">
        <StateView
          title={translate("state.errorTitle")}
          message={translate("state.errorMessage")}
          retryLabel={translate("ui.retry")}
          onRetry={() => void mine.refetch()}
        />
      </main>
    );
  }
  if (membership === null) {
    return (
      <main className="px-4 py-8 sm:px-7">
        <StateView
          title={translate("school.forbiddenTitle")}
          message={translate("school.forbiddenBody")}
        />
      </main>
    );
  }
  return <>{children}</>;
}
