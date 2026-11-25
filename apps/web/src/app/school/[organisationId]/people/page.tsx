import { SchoolPeopleScreen } from "@/features/school-portal/SchoolPeopleScreen";

export const instant = false;

export default async function SchoolPeoplePage({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;
  return <SchoolPeopleScreen organisationId={organisationId} />;
}
