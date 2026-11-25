import { SchoolLeadScreen } from "@/features/admin/SchoolLeadScreen";

export const instant = false;

export default async function SchoolLeadPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  return <SchoolLeadScreen leadId={leadId} />;
}
