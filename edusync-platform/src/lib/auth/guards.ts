import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { activeSchoolCookieName } from "@/lib/auth/cookies";
import { getCurrentSession } from "@/lib/auth/current-session";
import {
  getPlatformPermissions,
  getSchoolPermissions,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import {
  getPlatformAuthorizationContext,
  selectSchoolAuthorizationContext,
} from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function requireAuthenticatedSession(returnTo = "/dashboard") {
  const session = await getCurrentSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  if (session.user.mustChangePassword) redirect("/doi-mat-khau");
  return session;
}

export async function requireSchoolContext(permission?: Permission) {
  const session = await requireAuthenticatedSession();
  const cookieStore = await cookies();
  const requestedSlug = cookieStore.get(activeSchoolCookieName)?.value;
  const school =
    session.schoolContexts.find((context) => context.schoolSlug === requestedSlug) ??
    (session.schoolContexts.length === 1 ? session.schoolContexts[0] : undefined);

  if (!school) {
    if (requestedSlug) {
      const inactive = await db.schoolMembership.findFirst({
        where: { userId: session.user.id, school: { slug: requestedSlug } },
        select: { status: true },
      });
      if (inactive && inactive.status !== "ACTIVE") redirect("/membership-inactive");
    }
    redirect(session.schoolContexts.length > 1 ? "/chon-truong" : "/membership-inactive");
  }

  const actor = selectSchoolAuthorizationContext(session, school.schoolSlug);
  if (!actor) redirect("/membership-inactive");
  if (permission && !hasPermission(getSchoolPermissions(actor.schoolRoles), permission)) {
    redirect("/forbidden");
  }
  return { session, school, actor };
}

export async function requirePlatformContext(permission?: Permission) {
  const session = await requireAuthenticatedSession();
  const actor = getPlatformAuthorizationContext(session);
  if (
    actor.platformRoles.length === 0 ||
    (permission && !hasPermission(getPlatformPermissions(actor.platformRoles), permission))
  ) {
    redirect("/forbidden");
  }
  return { session, actor };
}
