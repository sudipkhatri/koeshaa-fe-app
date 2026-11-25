import type { ReactNode } from "react";

import { InvalidSchool } from "@/features/school-portal/InvalidSchool";
import { SchoolMembershipGate } from "@/features/school-portal/SchoolApp";
import { organisationIdSchema } from "@/features/school-portal/schemas";

export const instant = false;

export default async function SchoolOrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;
  if (!organisationIdSchema.safeParse(organisationId).success) {
    return <InvalidSchool />;
  }
  return <SchoolMembershipGate organisationId={organisationId}>{children}</SchoolMembershipGate>;
}
