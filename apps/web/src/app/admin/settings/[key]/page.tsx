import { SettingScreen } from "@/features/admin/SettingScreen";

export const instant = false;

export default async function SettingPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <SettingScreen settingKey={key} />;
}
