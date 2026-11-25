import { SchoolStubScreen } from "@/features/school-portal/SchoolStubScreen";

export const instant = false;

export default async function SchoolImportPage({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;
  return (
    <SchoolStubScreen
      organisationId={organisationId}
      titleKey="school.import"
      noteKey="school.buildingImport"
    />
  );
}
