import { AccessScreen } from "@/features/admin/AccessScreen";

export const instant = false;

export default async function AccountAccessPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <AccessScreen userId={userId} />;
}
