"use client";

import { NetworkError } from "@keoshaa/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AdminSkeleton } from "@/components/ui/Skeleton";
import { StateView } from "@/components/ui/StateView";
import { LocaleSwitch } from "@/components/ui/LocaleSwitch";
import { useMessages } from "@/lib/locale";

import { useMySchools } from "./school-api";

export function SchoolPickerScreen() {
  const { translate } = useMessages();
  const router = useRouter();
  const mine = useMySchools();

  useEffect(() => {
    if (mine.data?.length === 1) {
      router.replace(`/school/${mine.data[0]!.organisation_id}`);
    }
  }, [mine.data, router]);

  if (mine.isPending) return <AdminSkeleton label={translate("ui.loading")} />;
  if (mine.error instanceof NetworkError) {
    return (
      <main className="mx-auto max-w-lg px-6 py-10">
        <StateView
          title={translate("state.offlineTitle")}
          message={translate("state.offlineMessage")}
          retryLabel={translate("ui.retry")}
          onRetry={() => void mine.refetch()}
        />
      </main>
    );
  }
  if (mine.isError) {
    return (
      <main className="mx-auto max-w-lg px-6 py-10">
        <StateView
          title={translate("state.errorTitle")}
          message={translate("state.errorMessage")}
          retryLabel={translate("ui.retry")}
          onRetry={() => void mine.refetch()}
        />
      </main>
    );
  }

  const schools = mine.data ?? [];
  if (schools.length === 1) return <AdminSkeleton label={translate("ui.loading")} />;

  return (
    <main className="min-h-dvh bg-admin-page text-admin-ink">
      <header className="flex items-center justify-between border-b border-admin-border bg-admin-surface px-6 py-4">
        <div>
          <h1 className="text-heading font-semibold">{translate("school.pickerTitle")}</h1>
          <p className="text-caption text-admin-soft">{translate("school.pickerBody")}</p>
        </div>
        <LocaleSwitch variant="admin" />
      </header>
      <div className="mx-auto max-w-xl px-6 py-8">
        {schools.length === 0 ? (
          <StateView
            title={translate("school.pickerEmptyTitle")}
            message={translate("school.pickerEmptyBody")}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {schools.map((school) => (
              <li key={school.organisation_id}>
                <Link
                  href={`/school/${school.organisation_id}`}
                  className="flex flex-col gap-1 rounded-xl border border-admin-border bg-admin-surface px-4.5 py-4 hover:border-admin-dashed"
                >
                  <span className="font-semibold">{school.name}</span>
                  <span className="text-caption text-admin-soft">
                    {school.title || school.role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
