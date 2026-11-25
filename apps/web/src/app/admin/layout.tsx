import { AdminApp } from "@/features/admin/AdminApp";
import type { ReactNode } from "react";

export const instant = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminApp>{children}</AdminApp>;
}
