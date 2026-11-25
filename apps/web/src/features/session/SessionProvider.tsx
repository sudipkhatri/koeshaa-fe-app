"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { refreshAccessToken, type RestoreResult } from "@/lib/session";

import { signOutRequest } from "./api";

type SessionStatus = "restoring" | RestoreResult;

interface SessionValue {
  status: SessionStatus;
  markSignedIn: () => void;
  signOut: () => Promise<void>;
  restore: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("restoring");

  const restore = useCallback(() => {
    setStatus("restoring");
    void refreshAccessToken().then(setStatus);
  }, []);

  useEffect(() => {
    let active = true;
    void refreshAccessToken().then((result) => {
      if (active) setStatus(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const markSignedIn = useCallback(() => setStatus("signedIn"), []);
  const signOut = useCallback(async () => {
    await signOutRequest();
    setStatus("signedOut");
  }, []);
  const value = useMemo(
    () => ({ status, markSignedIn, signOut, restore }),
    [status, markSignedIn, signOut, restore],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
