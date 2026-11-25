import { z } from "zod";

export const roleCreateSchema = z.object({
  name: z.string().trim().min(1, { error: "admin.nameRequired" }).max(80),
  accountKind: z.enum(["member", "staff"]),
  scopeKind: z.enum(["platform", "organisation"]),
  description: z.string().trim().max(500),
});

export type RoleCreateValues = z.infer<typeof roleCreateSchema>;

export const assignRoleSchema = z.object({
  roleId: z.string().min(1, { error: "admin.roleRequired" }),
  scopeId: z.string().trim(),
});

export type AssignRoleValues = z.infer<typeof assignRoleSchema>;

export const grantSchema = z.object({
  permission: z.string().min(1, { error: "admin.permissionRequired" }),
  scopeId: z.string().trim(),
});

export type GrantValues = z.infer<typeof grantSchema>;
