import { OrganisationScreen } from "@/features/admin/OrganisationScreen";

export const instant = false;

export default async function OrganisationPage({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;
  return <OrganisationScreen organisationId={organisationId} />;
}
