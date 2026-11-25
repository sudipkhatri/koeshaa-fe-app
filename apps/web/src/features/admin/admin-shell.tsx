"use client";

import { createContext, useContext } from "react";

export interface AdminShell {
  menuOpen: boolean;
  toggleMenu: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
}

export const AdminShellContext = createContext<AdminShell>({
  menuOpen: false,
  toggleMenu: () => undefined,
  collapsed: false,
  toggleCollapsed: () => undefined,
});

export function useAdminShell(): AdminShell {
  return useContext(AdminShellContext);
}
