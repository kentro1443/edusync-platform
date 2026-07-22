import {
  MembershipStatus,
  SchoolRole,
  type MembershipStatus as MembershipStatusType,
  type SchoolRole as SchoolRoleType,
} from "@/generated/prisma/enums";
import { z } from "zod";

const membershipStatuses = Object.values(MembershipStatus) as MembershipStatusType[];
const schoolRoles = Object.values(SchoolRole) as SchoolRoleType[];

function positiveInteger(value: unknown, fallback: number, max?: number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

export function parseMemberFilters(input: {
  page?: unknown;
  pageSize?: unknown;
  query?: unknown;
  status?: unknown;
}) {
  const status =
    typeof input.status === "string" &&
    membershipStatuses.includes(input.status as MembershipStatusType)
      ? (input.status as MembershipStatusType)
      : undefined;
  return {
    page: positiveInteger(input.page, 1),
    pageSize: positiveInteger(input.pageSize, 20, 50),
    query: typeof input.query === "string" ? input.query.trim().slice(0, 120) : "",
    ...(status ? { status } : {}),
  };
}

export function parseRoleSelection(input: unknown):
  | { success: true; roles: SchoolRoleType[] }
  | { success: false } {
  if (!Array.isArray(input)) return { success: false };
  const roles = [...new Set(input)].filter(
    (role): role is SchoolRoleType =>
      typeof role === "string" && schoolRoles.includes(role as SchoolRoleType),
  );
  return roles.length > 0 ? { success: true, roles } : { success: false };
}

const schoolProvisioningSchema = z.object({
  name: z.string().trim().min(3).max(180),
  shortName: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(80),
  adminEmail: z.string().trim().toLowerCase().email().max(254),
});

const schoolSettingsSchema = z.object({
  name: z.string().trim().min(3).max(180),
  shortName: z.string().trim().min(2).max(80),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
    )
    .transform((value) => value || null),
});

export function parseSchoolProvisioning(input: unknown):
  | { success: true; data: z.infer<typeof schoolProvisioningSchema> }
  | { success: false } {
  const result = schoolProvisioningSchema.safeParse(input);
  return result.success ? { success: true, data: result.data } : { success: false };
}

export function parseSchoolSettings(input: unknown):
  | { success: true; data: z.infer<typeof schoolSettingsSchema> }
  | { success: false } {
  const result = schoolSettingsSchema.safeParse(input);
  return result.success ? { success: true, data: result.data } : { success: false };
}
