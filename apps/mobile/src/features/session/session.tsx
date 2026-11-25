import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { isMockMode } from "@/lib/config";

import type { SessionCore, TokensRead } from "./core";

/** `booting`: reading the stored session; `offline`: a stored session but no connection yet. */
export type SessionStatus = "booting" | "signedOut" | "signedIn" | "offline";

export type AccountRole = "student" | "parent";

export interface SignupDraft {
  role: AccountRole;
  name: string;
  day: string;
  month: string;
  year: string;
  contact: string;
  /** Kept only in memory until sign-up is sent; the backend spends the code when the account is made. */
  code: string;
  password: string;
}
const emptyDraft: SignupDraft = {
  role: "student",
  name: "",
  day: "",
  month: "",
  year: "",
  contact: "",
  code: "",
  password: "",
};

/** Sign-in step 2. `mfa_setup` shows a secret once, in memory only, never in a route or store. */
export type AuthStep = "code" | "totp" | "mfa_setup";

/** Where a sign-in, sign-up or reset code was sent; kept in memory only. */
export interface AuthFlow {
  identifier: string;
  /** The sign-in step-2 challenge (new device), when there is one. */
  challenge: string | null;
  /** The code the person typed; spent later by register or reset. */
  code: string;
  sentTo: string;
  step: AuthStep;
  /** Authenticator setup key. Shown once, then cleared. Never written to storage. */
  setupSecret: string | null;
}
const emptyFlow: AuthFlow = {
  identifier: "",
  challenge: null,
  code: "",
  sentTo: "",
  step: "code",
  setupSecret: null,
};

interface SessionValue {
  status: SessionStatus;
  /** The `401` code that ended the session on its own (shown once on the front door), if any. */
  endedCode: string | null;
  core: SessionCore | null;
  signIn: (tokens: TokensRead | null) => Promise<void>;
  signOut: () => Promise<void>;
  /** Resolves `false` when the backend could not confirm, so other devices may stay signed in. */
  signOutEverywhere: () => Promise<boolean>;
  retryStart: () => void;
  flow: AuthFlow;
  setFlow: (patch: Partial<AuthFlow>) => void;
  signup: SignupDraft;
  updateSignup: (patch: Partial<SignupDraft>) => void;
  resetSignup: () => void;
  /** Clears a half-finished sign-up and starts again as a student or a parent. */
  beginSignup: (role: AccountRole) => void;
  parent: { number: string; sent: boolean };
  sendParentInvite: (number: string) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({
  core,
  children,
}: {
  core: SessionCore | null;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const mocks = isMockMode();
  const [status, setStatus] = useState<SessionStatus>(mocks ? "signedIn" : "booting");
  const [endedCode, setEndedCode] = useState<string | null>(null);
  const [parent, setParent] = useState({ number: "", sent: false });
  const [signup, setSignup] = useState(emptyDraft);
  const [flow, setFlowState] = useState(emptyFlow);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (mocks || !core) return;
    let cancelled = false;
    void (async () => {
      if (!(await core.hasRefreshToken())) return !cancelled && setStatus("signedOut");
      setStatus("booting");
      const outcome = await core.refresh();
      if (cancelled) return;
      setStatus(outcome === "ok" ? "signedIn" : outcome === "ended" ? "signedOut" : "offline");
    })();
    return () => {
      cancelled = true;
    };
  }, [core, mocks, attempt]);

  useEffect(() => {
    if (!core) return;
    return core.onEnded((code) => {
      queryClient.clear();
      setEndedCode(code);
      setStatus("signedOut");
    });
  }, [core, queryClient]);

  const reset = useCallback(() => {
    queryClient.clear();
    setParent({ number: "", sent: false });
    setSignup(emptyDraft);
    setFlowState(emptyFlow);
    setStatus("signedOut");
  }, [queryClient]);

  const value: SessionValue = {
    status,
    endedCode,
    core,
    signIn: async (tokens) => {
      if (core && tokens) await core.accept(tokens);
      setEndedCode(null);
      setStatus("signedIn");
    },
    signOut: async () => {
      // Backend first, then local state even if the call fails (security.md).
      if (core) await core.api.POST("/api/v1/auth/sign-out").catch(() => undefined);
      await core?.clear();
      reset();
    },
    signOutEverywhere: async () => {
      let confirmed = true;
      if (core) {
        const result = await core.api
          .POST("/api/v1/auth/sign-out-everywhere")
          .catch(() => ({ error: true }));
        confirmed = !result.error;
      }
      // Local sign-out happens either way; the caller tells the person when it was not confirmed.
      await core?.clear();
      reset();
      return confirmed;
    },
    retryStart: () => setAttempt((n) => n + 1),
    flow,
    setFlow: (patch) => setFlowState((current) => ({ ...current, ...patch })),
    signup,
    updateSignup: (next) => setSignup((current) => ({ ...current, ...next })),
    resetSignup: () => {
      setSignup(emptyDraft);
      setFlowState(emptyFlow);
    },
    beginSignup: (role) => {
      setSignup({ ...emptyDraft, role });
      setFlowState(emptyFlow);
    },
    parent,
    sendParentInvite: (number) => setParent({ number, sent: true }),
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
