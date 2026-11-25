"use client";

import { PublicLeadScreen } from "@/features/schools/PublicLeadScreen";
import { LocaleProvider } from "@/lib/locale";

export default function SchoolsPage() {
  return (
    <LocaleProvider>
      <PublicLeadScreen />
    </LocaleProvider>
  );
}
