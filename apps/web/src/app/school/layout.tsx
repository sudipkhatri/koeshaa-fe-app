import type { ReactNode } from "react";

import { SchoolApp } from "@/features/school-portal/SchoolApp";

export const instant = false;

export default function SchoolLayout({ children }: { children: ReactNode }) {
  return <SchoolApp>{children}</SchoolApp>;
}
