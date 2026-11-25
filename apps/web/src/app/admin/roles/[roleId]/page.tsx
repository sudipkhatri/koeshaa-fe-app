import { RoleScreen } from "@/features/admin/RoleScreen";

export const instant = false;

export default async function RolePage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  return <RoleScreen roleId={roleId} />;
}
