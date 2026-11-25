import { AccountScreen } from "@/features/admin/AccountScreen";

export const instant = false;

export default async function AccountPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <AccountScreen userId={userId} />;
}
