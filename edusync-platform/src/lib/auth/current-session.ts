import "server-only";

import { cookies } from "next/headers";

import {
  getDatabaseSession,
  sessionCookieName,
  type AuthenticatedSession,
} from "@/lib/auth/session";

export async function getCurrentSession(): Promise<AuthenticatedSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  return getDatabaseSession(token);
}