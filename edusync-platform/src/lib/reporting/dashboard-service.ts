import "server-only";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";

export type DashboardAction = Readonly<{
  key: string;
  label: string;
  count: number;
  description: string;
  href: string;
}>;

export async function getSchoolDashboard(
  actor: AuthorizationContext,
  now = new Date(),
) {
  if (!actor.schoolId || !actor.membershipId) return null;
  const nextWeek = new Date(now.getTime() + 7 * 86_400_000);
  const [
    unreadNotifications,
    conversations,
    upcomingEvents,
    publishedResources,
    workflowOwned,
    workflowReview,
    upcomingAppointments,
    clubMemberships,
    assignedTasks,
  ] = await Promise.all([
    db.notification.count({
      where: { schoolId: actor.schoolId, userId: actor.userId, readAt: null },
    }),
    db.conversation.count({
      where: {
        schoolId: actor.schoolId,
        participants: { some: { userId: actor.userId } },
      },
    }),
    db.calendarEvent.count({
      where: {
        schoolId: actor.schoolId,
        startsAt: { gte: now, lt: nextWeek },
        status: "CONFIRMED",
        OR: [
          { calendar: { visibility: "SCHOOL" } },
          { createdByUserId: actor.userId },
          { bookings: { some: { userId: actor.userId, status: "BOOKED" } } },
        ],
      },
    }),
    db.resource.count({
      where: { schoolId: actor.schoolId, status: "PUBLISHED" },
    }),
    db.workflowSubmission.count({
      where: {
        schoolId: actor.schoolId,
        ownerUserId: actor.userId,
        status: { in: ["DRAFT", "CHANGES_REQUESTED", "IN_REVIEW"] },
      },
    }),
    db.workflowSubmission.count({
      where: {
        schoolId: actor.schoolId,
        status: "IN_REVIEW",
        steps: {
          some: {
            status: "ACTIVE",
            OR: [
              { assignedUserId: actor.userId },
              { delegations: { some: { delegatedToUserId: actor.userId } } },
            ],
          },
        },
      },
    }),
    db.appointment.count({
      where: {
        schoolId: actor.schoolId,
        startsAt: { gte: now },
        status: { in: ["REQUESTED", "CONFIRMED", "WAITLISTED"] },
        OR: [
          { studentUserId: actor.userId },
          { mentorUserId: actor.userId },
          { organizerUserId: actor.userId },
        ],
      },
    }),
    db.clubMembership.count({
      where: { schoolId: actor.schoolId, userId: actor.userId, status: "ACTIVE" },
    }),
    db.mentoringTask.count({
      where: {
        schoolId: actor.schoolId,
        assigneeUserId: actor.userId,
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
    }),
  ]);
  const actions: DashboardAction[] = [
    {
      key: "notifications",
      label: "Thông báo chưa đọc",
      count: unreadNotifications,
      description: "Tin nhắn và hoạt động cần chú ý",
      href: "/dashboard/notifications?status=unread",
    },
    {
      key: "workflow-review",
      label: "Hồ sơ cần duyệt",
      count: workflowReview,
      description: "Bước quy trình đang giao cho bạn",
      href: "/dashboard/workflows/submissions",
    },
    {
      key: "mentoring-tasks",
      label: "Nhiệm vụ cố vấn",
      count: assignedTasks,
      description: "Việc đang làm hoặc chưa bắt đầu",
      href: "/dashboard/mentoring/cases",
    },
    {
      key: "appointments",
      label: "Lịch hẹn sắp tới",
      count: upcomingAppointments,
      description: "Yêu cầu, xác nhận và danh sách chờ",
      href: "/dashboard/appointments",
    },
    {
      key: "calendar",
      label: "Sự kiện 7 ngày tới",
      count: upcomingEvents,
      description: "Lịch trường và lịch bạn tham gia",
      href: "/dashboard/calendar",
    },
    {
      key: "workflows-owned",
      label: "Hồ sơ của bạn",
      count: workflowOwned,
      description: "Bản nháp, yêu cầu sửa và đang duyệt",
      href: "/dashboard/workflows/submissions",
    },
  ].sort((a, b) => b.count - a.count);
  return {
    actions,
    context: {
      conversations,
      publishedResources,
      clubMemberships,
    },
  };
}

export async function getPlatformDashboard() {
  const [activeSchools, activeMembers, failedDomainEvents, failedEmails] =
    await Promise.all([
      db.school.count({ where: { status: "ACTIVE" } }),
      db.schoolMembership.count({ where: { status: "ACTIVE" } }),
      db.domainOutboxEvent.count({ where: { status: "FAILED" } }),
      db.emailOutbox.count({ where: { status: "FAILED" } }),
    ]);
  return { activeSchools, activeMembers, failedDomainEvents, failedEmails };
}
