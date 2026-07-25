import "server-only";

import { randomUUID } from "node:crypto";

import type { AuthorizationContext } from "@/lib/auth/policies";
import {
  getSchoolPermissions,
  hasPermission,
  permissions,
  type Permission,
} from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/reporting/reporting-domain";

export class ReportingAuthorizationError extends Error {}

type SchoolReportActor = AuthorizationContext & {
  schoolId: string;
  membershipId: string;
};

function requireReportActor(
  actor: AuthorizationContext,
  permission: Permission = permissions.schoolReportRead,
): asserts actor is SchoolReportActor {
  if (
    !actor.schoolId ||
    !actor.membershipId ||
    !hasPermission(getSchoolPermissions(actor.schoolRoles), permission)
  ) {
    throw new ReportingAuthorizationError("Bạn không có quyền xem báo cáo trường.");
  }
}

export type SchoolReportMetric = Readonly<{
  key: string;
  label: string;
  value: number;
  detail: string;
  href: string;
}>;

export async function getSchoolOperationsReport(
  actor: AuthorizationContext,
  range: Readonly<{ from: Date; to: Date }>,
) {
  requireReportActor(actor);
  const [
    activeMembers,
    calendarEvents,
    presentAttendance,
    appointments,
    openMentoringCases,
    publishedResources,
    resourceInteractions,
    workflowSubmissions,
    workflowsInReview,
    activeClubs,
    clubEvents,
    clubRegistrations,
    messages,
    storage,
    schoolUsage,
  ] = await Promise.all([
    db.schoolMembership.count({
      where: { schoolId: actor.schoolId, status: "ACTIVE" },
    }),
    db.calendarEvent.count({
      where: {
        schoolId: actor.schoolId,
        startsAt: { gte: range.from, lt: range.to },
        status: "CONFIRMED",
      },
    }),
    db.calendarAttendance.count({
      where: {
        schoolId: actor.schoolId,
        status: "PRESENT",
        checkedInAt: { gte: range.from, lt: range.to },
      },
    }),
    db.appointment.count({
      where: {
        schoolId: actor.schoolId,
        startsAt: { gte: range.from, lt: range.to },
        status: { notIn: ["CANCELLED", "DECLINED"] },
      },
    }),
    db.mentoringCase.count({
      where: { schoolId: actor.schoolId, status: { in: ["OPEN", "ON_HOLD"] } },
    }),
    db.resource.count({
      where: { schoolId: actor.schoolId, status: "PUBLISHED" },
    }),
    db.resourceAnalyticsEvent.count({
      where: {
        schoolId: actor.schoolId,
        createdAt: { gte: range.from, lt: range.to },
      },
    }),
    db.workflowSubmission.count({
      where: {
        schoolId: actor.schoolId,
        createdAt: { gte: range.from, lt: range.to },
      },
    }),
    db.workflowSubmission.count({
      where: { schoolId: actor.schoolId, status: "IN_REVIEW" },
    }),
    db.club.count({
      where: { schoolId: actor.schoolId, status: "ACTIVE" },
    }),
    db.clubEvent.count({
      where: {
        schoolId: actor.schoolId,
        startsAt: { gte: range.from, lt: range.to },
        status: { in: ["APPROVED", "COMPLETED"] },
      },
    }),
    db.clubRegistration.count({
      where: {
        schoolId: actor.schoolId,
        createdAt: { gte: range.from, lt: range.to },
        status: { in: ["REGISTERED", "WAITLISTED"] },
      },
    }),
    db.message.count({
      where: {
        schoolId: actor.schoolId,
        createdAt: { gte: range.from, lt: range.to },
        deletedAt: null,
      },
    }),
    db.storedFile.aggregate({
      where: { schoolId: actor.schoolId, status: "AVAILABLE" },
      _sum: { sizeBytes: true },
      _count: true,
    }),
    db.school.findUniqueOrThrow({
      where: { id: actor.schoolId },
      select: { storageQuotaBytes: true },
    }),
  ]);
  const metrics: SchoolReportMetric[] = [
    {
      key: "attendance",
      label: "Điểm danh lịch trường",
      value: presentAttendance,
      detail: `${calendarEvents} sự kiện trong kỳ`,
      href: "/dashboard/calendar",
    },
    {
      key: "mentoring",
      label: "Cố vấn & lịch hẹn",
      value: appointments,
      detail: `${openMentoringCases} hồ sơ đang mở/tạm giữ`,
      href: "/dashboard/mentoring",
    },
    {
      key: "resources",
      label: "Tương tác học liệu",
      value: resourceInteractions,
      detail: `${publishedResources} tài liệu đã xuất bản`,
      href: "/dashboard/resources/analytics",
    },
    {
      key: "workflows",
      label: "Hồ sơ quy trình",
      value: workflowSubmissions,
      detail: `${workflowsInReview} hồ sơ chờ xử lý`,
      href: "/dashboard/workflows/submissions",
    },
    {
      key: "clubs",
      label: "Đăng ký CLB & sự kiện",
      value: clubRegistrations,
      detail: `${activeClubs} CLB · ${clubEvents} sự kiện`,
      href: "/dashboard/clubs-events",
    },
    {
      key: "collaboration",
      label: "Tin nhắn phối hợp",
      value: messages,
      detail: `${activeMembers} thành viên hoạt động`,
      href: "/dashboard/messages",
    },
  ];
  return {
    range,
    metrics,
    usage: {
      activeMembers,
      storedFileCount: storage._count,
      storageBytes: storage._sum.sizeBytes ?? BigInt(0),
      storageQuotaBytes: schoolUsage.storageQuotaBytes,
    },
  };
}

export async function exportSchoolOperationsCsv(
  actor: AuthorizationContext,
  range: Readonly<{ from: Date; to: Date }>,
) {
  requireReportActor(actor, permissions.reportExport);
  const report = await getSchoolOperationsReport(actor, range);
  const csv = toCsv([
    ["Báo cáo vận hành EduTech"],
    ["Từ ngày", range.from.toISOString()],
    ["Đến trước", range.to.toISOString()],
    [],
    ["Mô-đun", "Chỉ số", "Chi tiết"],
    ...report.metrics.map((metric) => [metric.label, metric.value, metric.detail]),
    [],
    ["Thành viên hoạt động", report.usage.activeMembers],
    ["Số tệp lưu trữ", report.usage.storedFileCount],
    ["Dung lượng lưu trữ (byte)", report.usage.storageBytes.toString()],
    ["Hạn mức lưu trữ (byte)", report.usage.storageQuotaBytes.toString()],
  ]);
  await db.auditEvent.create({
    data: {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      actorType: "USER",
      action: "REPORT_EXPORTED",
      entityType: "SchoolOperationsReport",
      entityId: actor.schoolId,
      afterJson: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        format: "CSV",
      },
      requestId: randomUUID(),
    },
  });
  return csv;
}
