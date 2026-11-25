import { z } from "zod";

import { detectIdentifier, identifierSchema, passwordSchema } from "@keoshaa/core";

export const relationshipSchema = z.enum(["mother", "father", "guardian"]);

export type Relationship = z.infer<typeof relationshipSchema>;

export const addChildSchema = z
  .object({
    name: z.string().trim().min(2, { error: "parent.addNameShort" }).max(120),
    day: z.string().min(1, { error: "parent.addFillBirthday" }),
    month: z.string().min(1, { error: "parent.addFillBirthday" }),
    year: z.string().min(1, { error: "parent.addFillBirthday" }),
    relationship: relationshipSchema,
    identifier: identifierSchema,
    password: passwordSchema,
  })
  .refine((value) => detectIdentifier(value.identifier) !== "email", {
    error: "parent.addIdentifierHint",
    path: ["identifier"],
  });

export type AddChildValues = z.infer<typeof addChildSchema>;

export const childPasswordSchema = z.object({
  password: passwordSchema,
  parentPassword: z.string().min(1, { error: "parent.childParentPasswordRequired" }),
});

export type ChildPasswordValues = z.infer<typeof childPasswordSchema>;

export const childCloseSchema = z.object({
  password: z.string().min(1, { error: "closeAccount.passwordError" }),
});

export type ChildCloseValues = z.infer<typeof childCloseSchema>;

export const childIdSchema = z.string().min(1).max(64);
