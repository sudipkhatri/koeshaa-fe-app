"use client";

import { StateView } from "@/components/ui/StateView";
import { useMessages } from "@/lib/locale";

export function InvalidSchool() {
  const { translate } = useMessages();
  return (
    <main className="px-4 py-8 sm:px-7">
      <StateView
        title={translate("school.notFoundTitle")}
        message={translate("school.notFoundBody")}
      />
    </main>
  );
}
