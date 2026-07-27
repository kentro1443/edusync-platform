import "server-only";

import { randomUUID } from "node:crypto";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { getSchoolPermissions, hasPermission, permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import {
  ClubValidationError,
  assertExpenseWithinBudget,
  canTransitionClubTask,
  resolveClubRegistration,
  validateClubEventRange,
  validateClubName,
} from "@/lib/clubs/club-domain";

export class ClubAuthorizationError extends Error {}

type SchoolActor = AuthorizationContext & { schoolId: string; membershipId: string };

function requireClubActor(
  actor: AuthorizationContext,
  permission: (typeof permissions)[keyof typeof permissions],
): asserts actor is SchoolActor {
  if (
    !actor.schoolId ||
    !actor.membershipId ||
    !hasPermission(getSchoolPermissions(actor.schoolRoles), permission)
  ) {
    throw new ClubAuthorizationError("Bạn không có quyền thao tác câu lạc bộ.");
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function actorHas(
  actor: AuthorizationContext,
  permission: (typeof permissions)[keyof typeof permissions],
): boolean {
  return hasPermission(getSchoolPermissions(actor.schoolRoles), permission);
}

async function isClubManager(actor: SchoolActor, clubId: string): Promise<boolean> {
  if (actor.schoolRoles.some((role) => role === "SCHOOL_ADMIN" || role === "TEACHER_STAFF")) {
    return true;
  }
  const club = await db.club.findFirst({
    where: {
      id: clubId,
      schoolId: actor.schoolId,
      OR: [
        { createdByUserId: actor.userId },
        {
          memberships: {
            some: { userId: actor.userId, role: "LEADER", status: "ACTIVE" },
          },
        },
      ],
    },
    select: { id: true },
  });
  return Boolean(club);
}

async function requireClubManager(actor: SchoolActor, clubId: string): Promise<void> {
  if (!(await isClubManager(actor, clubId))) {
    throw new ClubAuthorizationError("Bạn không phụ trách câu lạc bộ này.");
  }
}

function canReadAllClubs(actor: SchoolActor): boolean {
  return actor.schoolRoles.some((role) =>
    role === "SCHOOL_ADMIN" || role === "TEACHER_STAFF" || role === "APPROVER_REVIEWER",
  );
}

export async function listClubs(actor: AuthorizationContext) {
  requireClubActor(actor, permissions.clubRead);
  return db.club.findMany({
    where: {
      schoolId: actor.schoolId,
      status: { not: "ARCHIVED" },
      ...(canReadAllClubs(actor)
        ? {}
        : {
            OR: [
              { status: "ACTIVE" as const },
              { createdByUserId: actor.userId },
              { memberships: { some: { userId: actor.userId, status: "ACTIVE" as const } } },
            ],
          }),
    },
    include: {
      _count: { select: { memberships: true, events: true, applications: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function getClub(actor: AuthorizationContext, clubId: string) {
  requireClubActor(actor, permissions.clubRead);
  const [canManage, canApproveEvents] = await Promise.all([
    isClubManager(actor, clubId),
    Promise.resolve(actorHas(actor, permissions.clubEventApprove)),
  ]);
  const canApply = actorHas(actor, permissions.clubMembershipApply);
  const canRegisterEvents = actorHas(actor, permissions.clubEventRegister);
  const club = await db.club.findFirst({
    where: {
      id: clubId,
      schoolId: actor.schoolId,
      status: { not: "ARCHIVED" },
      ...(canReadAllClubs(actor)
        ? {}
        : {
            OR: [
              { status: "ACTIVE" as const },
              { createdByUserId: actor.userId },
              { memberships: { some: { userId: actor.userId, status: "ACTIVE" as const } } },
            ],
          }),
    },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, displayName: true } } },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
      applications: {
        where: {
          status: "PENDING",
          ...(canManage ? {} : { applicantUserId: actor.userId }),
        },
        include: { applicant: { select: { id: true, displayName: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      events: {
        where: { status: { in: canManage || canApproveEvents ? ["PENDING_APPROVAL", "APPROVED"] : ["APPROVED"] } },
        orderBy: { startsAt: "asc" },
        include: {
          _count: { select: { registrations: true } },
          safetyPlan: { select: { id: true, details: true, approvedAt: true } },
          report: { select: { id: true, summary: true, createdAt: true } },
        },
      },
      announcements: {
        where: { publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        take: 20,
        include: { author: { select: { displayName: true } } },
      },
      tasks: {
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 50,
        include: { assignee: { select: { id: true, displayName: true } } },
      },
      budgets: {
        orderBy: { createdAt: "desc" },
        include: { expenses: { orderBy: { spentAt: "desc" } } },
      },
    },
  });
  if (!club) throw new ClubAuthorizationError("Không tìm thấy câu lạc bộ.");
  return { ...club, canManage, canApproveEvents, canApply, canRegisterEvents };
}

export async function createClub(
  actor: AuthorizationContext,
  input: Readonly<{ name: string; description?: string; capacity?: number; publish?: boolean }>,
) {
  requireClubActor(actor, permissions.clubCreate);
  const name = validateClubName(input.name);
  const slug = slugify(name);
  if (!slug) throw new ClubValidationError("Tên câu lạc bộ không hợp lệ.");
  return db.club.create({
    data: {
      schoolId: actor.schoolId,
      createdByUserId: actor.userId,
      name,
      slug,
      description: input.description?.trim() || undefined,
      capacity: input.capacity && input.capacity > 0 ? Math.min(input.capacity, 10_000) : undefined,
      status: input.publish && actorHas(actor, permissions.clubApprove) ? "ACTIVE" : "DRAFT",
    },
  });
}

export async function applyToClub(
  actor: AuthorizationContext,
  input: Readonly<{ clubId: string; motivation?: string }>,
) {
  requireClubActor(actor, permissions.clubMembershipApply);
  const club = await db.club.findFirst({
    where: { id: input.clubId, schoolId: actor.schoolId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!club) throw new ClubValidationError("Câu lạc bộ chưa mở đăng ký.");
  return db.clubApplication.upsert({
    where: { clubId_applicantUserId: { clubId: club.id, applicantUserId: actor.userId } },
    create: {
      schoolId: actor.schoolId,
      clubId: club.id,
      applicantUserId: actor.userId,
      motivation: input.motivation?.trim() || undefined,
    },
    update: { status: "PENDING", motivation: input.motivation?.trim() || undefined },
  });
}

export async function reviewClubApplication(
  actor: AuthorizationContext,
  input: Readonly<{ applicationId: string; approve: boolean }>,
) {
  requireClubActor(actor, permissions.clubMembershipReview);
  return db.$transaction(async (transaction) => {
    const application = await transaction.clubApplication.findFirst({
      where: { id: input.applicationId, schoolId: actor.schoolId, status: "PENDING" },
    });
    if (!application) throw new ClubValidationError("Đơn tham gia không còn hiệu lực.");
    await requireClubManager(actor, application.clubId);
    const status = input.approve ? "APPROVED" : "REJECTED";
    const updated = await transaction.clubApplication.update({
      where: { id: application.id },
      data: { status, reviewedByUserId: actor.userId, reviewedAt: new Date() },
    });
    if (input.approve) {
      await transaction.clubMembership.upsert({
        where: { clubId_userId: { clubId: application.clubId, userId: application.applicantUserId } },
        create: {
          schoolId: actor.schoolId,
          clubId: application.clubId,
          userId: application.applicantUserId,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
        update: { status: "ACTIVE", joinedAt: new Date() },
      });
    }
    return updated;
  });
}

export async function listClubEvents(actor: AuthorizationContext, clubId?: string) {
  requireClubActor(actor, permissions.clubRead);
  return db.clubEvent.findMany({
    where: {
      schoolId: actor.schoolId,
      ...(clubId ? { clubId } : {}),
      status: { in: ["PENDING_APPROVAL", "APPROVED"] },
      endsAt: { gt: new Date() },
    },
    include: {
      club: { select: { name: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function createClubEvent(
  actor: AuthorizationContext,
  input: Readonly<{
    clubId: string;
    title: string;
    description?: string;
    startsAt: Date;
    endsAt: Date;
    location?: string;
    capacity?: number;
    submitForApproval?: boolean;
  }>,
) {
  requireClubActor(actor, permissions.clubEventCreate);
  const title = input.title.trim();
  if (title.length < 2 || title.length > 160) {
    throw new ClubValidationError("Tên sự kiện phải dài 2–160 ký tự.");
  }
  validateClubEventRange(input.startsAt, input.endsAt);
  const club = await db.club.findFirst({
    where: { id: input.clubId, schoolId: actor.schoolId, status: { in: ["DRAFT", "ACTIVE"] } },
    select: { id: true },
  });
  if (!club) throw new ClubAuthorizationError("Bạn không thuộc phạm vi câu lạc bộ này.");
  await requireClubManager(actor, club.id);
  const conflict = await db.clubEvent.findFirst({
    where: {
      schoolId: actor.schoolId,
      clubId: club.id,
      status: { in: ["PENDING_APPROVAL", "APPROVED"] },
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
    },
    select: { id: true, title: true },
  });
  if (conflict) throw new ClubValidationError(`Trùng lịch với “${conflict.title}”.`);
  return db.clubEvent.create({
    data: {
      schoolId: actor.schoolId,
      clubId: club.id,
      createdByUserId: actor.userId,
      title,
      description: input.description?.trim() || undefined,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location?.trim() || undefined,
      capacity: Math.max(0, Math.min(input.capacity ?? 0, 10_000)),
      status: input.submitForApproval ? "PENDING_APPROVAL" : "DRAFT",
    },
  });
}

export async function approveClubEvent(
  actor: AuthorizationContext,
  input: Readonly<{ eventId: string; approve: boolean }>,
) {
  requireClubActor(actor, permissions.clubEventApprove);
  const event = await db.clubEvent.findFirst({
    where: { id: input.eventId, schoolId: actor.schoolId, status: "PENDING_APPROVAL" },
    select: { id: true },
  });
  if (!event) throw new ClubValidationError("Sự kiện không chờ duyệt.");
  return db.clubEvent.update({
    where: { id: event.id },
    data: { status: input.approve ? "APPROVED" : "REJECTED" },
  });
}

export async function registerClubEvent(actor: AuthorizationContext, eventId: string) {
  requireClubActor(actor, permissions.clubEventRegister);
  return db.$transaction(async (transaction) => {
    const event = await transaction.clubEvent.findFirst({
      where: { id: eventId, schoolId: actor.schoolId, status: "APPROVED" },
      select: { id: true, clubId: true, capacity: true },
    });
    if (!event) throw new ClubValidationError("Sự kiện không mở đăng ký.");
    await transaction.$queryRaw<Array<{ locked: string }>>`
      SELECT pg_advisory_xact_lock(hashtextextended(${`club-event:${event.id}`}, 0))::text AS locked
    `;
    const existing = await transaction.clubRegistration.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: actor.userId } },
    });
    if (existing?.status === "REGISTERED" || existing?.status === "WAITLISTED") return existing;
    const registeredCount = await transaction.clubRegistration.count({
      where: { eventId: event.id, status: "REGISTERED" },
    });
    const waitlist = await transaction.clubRegistration.findMany({
      where: { eventId: event.id, status: "WAITLISTED" },
      select: { position: true },
    });
    const result = resolveClubRegistration(event.capacity, registeredCount, waitlist.map((item) => item.position));
    const registration = await transaction.clubRegistration.upsert({
      where: { eventId_userId: { eventId: event.id, userId: actor.userId } },
      create: {
        schoolId: actor.schoolId,
        eventId: event.id,
        userId: actor.userId,
        status: result.status,
        position: result.position,
      },
      update: { status: result.status, position: result.position },
    });
    // Request parent consent from each active linked guardian of the student.
    const guardianLinks = await transaction.parentStudentLink.findMany({
      where: { schoolId: actor.schoolId, studentUserId: actor.userId, status: "ACTIVE" },
      select: { parentUserId: true },
    });
    if (guardianLinks.length > 0) {
      // Single batched insert instead of one round-trip per guardian; consents
      // that already exist (re-registering after a cancel) are left untouched.
      await transaction.clubConsent.createMany({
        data: guardianLinks.map((link) => ({
          schoolId: actor.schoolId,
          eventId: event.id,
          studentId: actor.userId,
          guardianId: link.parentUserId,
        })),
        skipDuplicates: true,
      });
    }
    return registration;
  });
}

export async function decideClubConsent(
  actor: AuthorizationContext,
  input: Readonly<{ consentId: string; status: "APPROVED" | "DECLINED" }>,
) {
  requireClubActor(actor, permissions.clubEventRegister);
  const consent = await db.clubConsent.findFirst({
    where: { id: input.consentId, schoolId: actor.schoolId, guardianId: actor.userId, status: "PENDING" },
  });
  if (!consent) throw new ClubAuthorizationError("Bạn không có quyền xử lý consent này.");
  const link = await db.parentStudentLink.findFirst({
    where: {
      schoolId: actor.schoolId,
      parentUserId: actor.userId,
      studentUserId: consent.studentId,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!link) throw new ClubAuthorizationError("Học sinh chưa được liên kết với tài khoản này.");
  return db.clubConsent.update({
    where: { id: consent.id },
    data: { status: input.status, decidedAt: new Date() },
  });
}

export async function recordClubAttendance(
  actor: AuthorizationContext,
  input: Readonly<{ eventId: string; userId: string; status: "PRESENT" | "ABSENT" | "EXCUSED"; note?: string }>,
) {
  requireClubActor(actor, permissions.clubEventAttendance);
  const event = await db.clubEvent.findFirst({ where: { id: input.eventId, schoolId: actor.schoolId } });
  if (!event) throw new ClubValidationError("Không tìm thấy sự kiện.");
  return db.clubAttendance.upsert({
    where: { eventId_userId: { eventId: event.id, userId: input.userId } },
    create: {
      schoolId: actor.schoolId,
      eventId: event.id,
      userId: input.userId,
      status: input.status,
      checkedInAt: input.status === "PRESENT" ? new Date() : null,
      recordedByUserId: actor.userId,
      note: input.note?.trim() || undefined,
    },
    update: {
      status: input.status,
      checkedInAt: input.status === "PRESENT" ? new Date() : null,
      recordedByUserId: actor.userId,
      note: input.note?.trim() || undefined,
    },
  });
}

async function auditClub(
  actor: SchoolActor,
  action: string,
  entityType: string,
  entityId: string,
  after?: object,
): Promise<void> {
  await db.auditEvent.create({
    data: {
      schoolId: actor.schoolId,
      actorUserId: actor.userId,
      actorType: "USER",
      action,
      entityType,
      entityId,
      afterJson: after,
      requestId: randomUUID(),
    },
  });
}

export async function listPendingConsents(actor: AuthorizationContext) {
  requireClubActor(actor, permissions.clubRead);
  return db.clubConsent.findMany({
    where: { schoolId: (actor as SchoolActor).schoolId, guardianId: actor.userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { displayName: true } },
      event: { select: { title: true, startsAt: true, club: { select: { name: true } } } },
    },
  });
}

export async function setClubMemberRole(
  actor: AuthorizationContext,
  input: Readonly<{ clubId: string; userId: string; role: "LEADER" | "MEMBER" }>,
) {
  requireClubActor(actor, permissions.clubMembershipManage);
  await requireClubManager(actor as SchoolActor, input.clubId);
  const membership = await db.clubMembership.findFirst({
    where: { clubId: input.clubId, userId: input.userId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!membership) throw new ClubValidationError("Không tìm thấy thành viên đang hoạt động.");
  const updated = await db.clubMembership.update({
    where: { id: membership.id },
    data: { role: input.role },
  });
  await auditClub(actor as SchoolActor, "club.member.role", "ClubMembership", membership.id, { role: input.role });
  return updated;
}

export async function createClubAnnouncement(
  actor: AuthorizationContext,
  input: Readonly<{ clubId: string; title: string; body: string }>,
) {
  requireClubActor(actor, permissions.clubAnnouncementCreate);
  await requireClubManager(actor as SchoolActor, input.clubId);
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 2 || title.length > 160) {
    throw new ClubValidationError("Tiêu đề thông báo phải dài 2–160 ký tự.");
  }
  if (body.length < 2 || body.length > 4_000) {
    throw new ClubValidationError("Nội dung thông báo phải dài 2–4000 ký tự.");
  }
  const announcement = await db.clubAnnouncement.create({
    data: {
      schoolId: (actor as SchoolActor).schoolId,
      clubId: input.clubId,
      authorUserId: actor.userId,
      title,
      body,
      publishedAt: new Date(),
    },
  });
  await auditClub(actor as SchoolActor, "club.announcement.create", "ClubAnnouncement", announcement.id, { title });
  return announcement;
}

export async function createClubTask(
  actor: AuthorizationContext,
  input: Readonly<{ clubId: string; title: string; description?: string; assigneeUserId?: string; dueAt?: Date }>,
) {
  requireClubActor(actor, permissions.clubRead);
  await requireClubManager(actor as SchoolActor, input.clubId);
  const title = input.title.trim();
  if (title.length < 2 || title.length > 160) {
    throw new ClubValidationError("Tên công việc phải dài 2–160 ký tự.");
  }
  if (input.assigneeUserId) {
    const member = await db.clubMembership.findFirst({
      where: { clubId: input.clubId, userId: input.assigneeUserId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!member) throw new ClubValidationError("Người được giao phải là thành viên câu lạc bộ.");
  }
  return db.clubTask.create({
    data: {
      schoolId: (actor as SchoolActor).schoolId,
      clubId: input.clubId,
      createdById: actor.userId,
      assigneeUserId: input.assigneeUserId,
      title,
      description: input.description?.trim() || undefined,
      dueAt: input.dueAt,
    },
  });
}

export async function updateClubTaskStatus(
  actor: AuthorizationContext,
  input: Readonly<{ taskId: string; status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED" }>,
) {
  requireClubActor(actor, permissions.clubRead);
  const task = await db.clubTask.findFirst({
    where: { id: input.taskId, schoolId: (actor as SchoolActor).schoolId },
    select: { id: true, clubId: true, assigneeUserId: true },
  });
  if (!task) throw new ClubValidationError("Không tìm thấy công việc.");
  const isManager = await isClubManager(actor as SchoolActor, task.clubId);
  if (!isManager && task.assigneeUserId !== actor.userId) {
    throw new ClubAuthorizationError("Bạn không thể cập nhật công việc này.");
  }
  const current = await db.clubTask.findUniqueOrThrow({ where: { id: task.id }, select: { status: true } });
  if (!canTransitionClubTask(current.status, input.status)) {
    throw new ClubValidationError("Chuyển trạng thái công việc không hợp lệ.");
  }
  return db.clubTask.update({ where: { id: task.id }, data: { status: input.status } });
}

export async function createClubBudget(
  actor: AuthorizationContext,
  input: Readonly<{ clubId: string; name: string; amount: number }>,
) {
  requireClubActor(actor, permissions.clubBudgetSubmit);
  await requireClubManager(actor as SchoolActor, input.clubId);
  const name = input.name.trim();
  if (name.length < 2 || name.length > 160) {
    throw new ClubValidationError("Tên ngân sách phải dài 2–160 ký tự.");
  }
  if (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > 1_000_000_000) {
    throw new ClubValidationError("Số tiền ngân sách không hợp lệ.");
  }
  const budget = await db.clubBudget.create({
    data: {
      schoolId: (actor as SchoolActor).schoolId,
      clubId: input.clubId,
      name,
      amount: input.amount,
      status: "SUBMITTED",
    },
  });
  await auditClub(actor as SchoolActor, "club.budget.submit", "ClubBudget", budget.id, { name, amount: input.amount });
  return budget;
}

export async function addClubExpense(
  actor: AuthorizationContext,
  input: Readonly<{ budgetId: string; description: string; amount: number; spentAt: Date }>,
) {
  requireClubActor(actor, permissions.clubBudgetSubmit);
  const description = input.description.trim();
  if (description.length < 2 || description.length > 240) {
    throw new ClubValidationError("Mô tả chi tiêu phải dài 2–240 ký tự.");
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 1_000_000_000) {
    throw new ClubValidationError("Số tiền chi tiêu không hợp lệ.");
  }
  return db.$transaction(async (transaction) => {
    const budget = await transaction.clubBudget.findFirst({
      where: { id: input.budgetId, schoolId: (actor as SchoolActor).schoolId },
      select: { id: true, clubId: true, amount: true, spent: true },
    });
    if (!budget) throw new ClubValidationError("Không tìm thấy ngân sách.");
    if (!(await isClubManager(actor as SchoolActor, budget.clubId))) {
      throw new ClubAuthorizationError("Bạn không phụ trách ngân sách này.");
    }
    assertExpenseWithinBudget(input.amount, Number(budget.spent), Number(budget.amount));
    const nextSpent = Number(budget.spent) + input.amount;
    const expense = await transaction.clubExpense.create({
      data: { budgetId: budget.id, description, amount: input.amount, spentAt: input.spentAt },
    });
    await transaction.clubBudget.update({ where: { id: budget.id }, data: { spent: nextSpent } });
    return expense;
  });
}

export async function saveClubSafetyPlan(
  actor: AuthorizationContext,
  input: Readonly<{ eventId: string; details: string }>,
) {
  requireClubActor(actor, permissions.clubEventCreate);
  const event = await db.clubEvent.findFirst({
    where: { id: input.eventId, schoolId: (actor as SchoolActor).schoolId },
    select: { id: true, clubId: true },
  });
  if (!event) throw new ClubValidationError("Không tìm thấy sự kiện.");
  await requireClubManager(actor as SchoolActor, event.clubId);
  const details = input.details.trim();
  if (details.length < 10 || details.length > 4_000) {
    throw new ClubValidationError("Kế hoạch an toàn phải dài 10–4000 ký tự.");
  }
  return db.clubSafetyPlan.upsert({
    where: { eventId: event.id },
    create: { eventId: event.id, details },
    update: { details },
  });
}

export async function submitClubPostEventReport(
  actor: AuthorizationContext,
  input: Readonly<{ eventId: string; summary: string }>,
) {
  requireClubActor(actor, permissions.clubReportSubmit);
  const event = await db.clubEvent.findFirst({
    where: { id: input.eventId, schoolId: (actor as SchoolActor).schoolId },
    select: { id: true, clubId: true },
  });
  if (!event) throw new ClubValidationError("Không tìm thấy sự kiện.");
  await requireClubManager(actor as SchoolActor, event.clubId);
  const summary = input.summary.trim();
  if (summary.length < 10 || summary.length > 4_000) {
    throw new ClubValidationError("Báo cáo sau sự kiện phải dài 10–4000 ký tự.");
  }
  const report = await db.clubPostEventReport.upsert({
    where: { eventId: event.id },
    create: { eventId: event.id, submittedById: actor.userId, summary },
    update: { summary },
  });
  await auditClub(actor as SchoolActor, "club.report.submit", "ClubPostEventReport", report.id, {});
  return report;
}
