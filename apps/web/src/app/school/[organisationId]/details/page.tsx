import { SchoolDetailsScreen } from "@/features/school-portal/SchoolDetailsScreen";

export const instant = false;

export default async function SchoolDetailsPage({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;
  return <SchoolDetailsScreen organisationId={organisationId} />;
}
