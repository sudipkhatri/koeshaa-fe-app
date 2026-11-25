import { SchoolHomeScreen } from "@/features/school-portal/SchoolHomeScreen";

export const instant = false;

export default async function SchoolHomePage({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;
  return <SchoolHomeScreen organisationId={organisationId} />;
}
