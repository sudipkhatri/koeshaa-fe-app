import { SchoolStubScreen } from "@/features/school-portal/SchoolStubScreen";

export const instant = false;

export default async function SchoolProgressPage({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;
  return (
    <SchoolStubScreen
      organisationId={organisationId}
      titleKey="school.progress"
      noteKey="school.buildingProgress"
    />
  );
}
