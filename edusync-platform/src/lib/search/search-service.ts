import "server-only";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { getSchoolPermissions, hasPermission, permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export type SearchResult = Readonly<{
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
}>;

function cleanQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").slice(0, 80);
}

export async function searchSchool(
  actor: AuthorizationContext,
  rawQuery: string,
): Promise<SearchResult[]> {
  if (!actor.schoolId || !actor.membershipId) return [];
  const query = cleanQuery(rawQuery);
  if (query.length < 2) return [];
  const actorPermissions = getSchoolPermissions(actor.schoolRoles);
  const can = (permission: (typeof permissions)[keyof typeof permissions]) =>
    hasPermission(actorPermissions, permission);
  const [resources, events, clubs, workflows, conversations, members] =
    await Promise.all([
      can(permissions.resourceRead)
        ? db.resource.findMany({
            where: {
              schoolId: actor.schoolId,
              status: "PUBLISHED",
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { summary: { contains: query, mode: "insensitive" } },
              ],
            },
            select: { id: true, title: true, summary: true },
            take: 10,
          })
        : [],
      can(permissions.calendarEventRead)
        ? db.calendarEvent.findMany({
            where: {
              schoolId: actor.schoolId,
              status: "CONFIRMED",
              calendar: { visibility: "SCHOOL" },
              title: { contains: query, mode: "insensitive" },
            },
            select: { id: true, title: true, startsAt: true },
            take: 10,
          })
        : [],
      can(permissions.clubRead)
        ? db.club.findMany({
            where: {
              schoolId: actor.schoolId,
              status: "ACTIVE",
              name: { contains: query, mode: "insensitive" },
            },
            select: { id: true, name: true, description: true },
            take: 10,
          })
        : [],
      can(permissions.workflowTemplateRead)
        ? db.workflowTemplate.findMany({
            where: {
              schoolId: actor.schoolId,
              status: "PUBLISHED",
              name: { contains: query, mode: "insensitive" },
            },
            select: { id: true, name: true },
            take: 10,
          })
        : [],
      can(permissions.messageConversationRead)
        ? db.conversation.findMany({
            where: {
              schoolId: actor.schoolId,
              title: { contains: query, mode: "insensitive" },
              participants: { some: { userId: actor.userId } },
            },
            select: { id: true, title: true },
            take: 10,
          })
        : [],
      can(permissions.schoolUserRead)
        ? db.schoolMembership.findMany({
            where: {
              schoolId: actor.schoolId,
              status: "ACTIVE",
              user: {
                OR: [
                  { displayName: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                ],
              },
            },
            select: {
              id: true,
              user: { select: { displayName: true, email: true } },
            },
            take: 10,
          })
        : [],
    ]);
  return [
    ...resources.map((item) => ({
      id: `resource:${item.id}`,
      type: "Tài liệu",
      title: item.title,
      description: item.summary ?? "Tài liệu đã xuất bản",
      href: `/dashboard/resources/${item.id}`,
    })),
    ...events.map((item) => ({
      id: `calendar:${item.id}`,
      type: "Lịch",
      title: item.title,
      description: item.startsAt.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
      href: `/dashboard/calendar/${item.id}`,
    })),
    ...clubs.map((item) => ({
      id: `club:${item.id}`,
      type: "Câu lạc bộ",
      title: item.name,
      description: item.description ?? "Câu lạc bộ đang hoạt động",
      href: `/dashboard/clubs-events/${item.id}`,
    })),
    ...workflows.map((item) => ({
      id: `workflow:${item.id}`,
      type: "Quy trình",
      title: item.name,
      description: "Mẫu quy trình đã xuất bản",
      href: `/dashboard/workflows/${item.id}`,
    })),
    ...conversations.map((item) => ({
      id: `conversation:${item.id}`,
      type: "Tin nhắn",
      title: item.title ?? "Cuộc trò chuyện",
      description: "Chỉ thành viên cuộc trò chuyện nhìn thấy",
      href: `/dashboard/messages/${item.id}`,
    })),
    ...members.map((item) => ({
      id: `member:${item.id}`,
      type: "Thành viên",
      title: item.user.displayName,
      description: item.user.email,
      href: `/dashboard/admin/members/${item.id}`,
    })),
  ].slice(0, 50);
}
