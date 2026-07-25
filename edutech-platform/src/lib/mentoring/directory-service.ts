import "server-only";

import { getSchoolPermissions, hasPermission, permissions } from "@/lib/auth/permissions";
import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";
import { calculateAvailabilitySlots } from "@/lib/mentoring/availability";

export class DirectoryAuthorizationError extends Error {}

type SchoolActor = AuthorizationContext & {
  schoolId: string;
  membershipId: string;
};

function requireDirectoryActor(
  actor: AuthorizationContext,
  permission: Parameters<typeof hasPermission>[1],
): asserts actor is SchoolActor {
  if (
    actor.schoolId === null ||
    actor.membershipId === null ||
    !hasPermission(getSchoolPermissions(actor.schoolRoles), permission)
  ) {
    throw new DirectoryAuthorizationError("Bạn không có quyền truy cập mô-đun cố vấn.");
  }
}

function scopedAppointmentWhere(
  actor: SchoolActor,
  studentUserIds: readonly string[],
) {
  if (actor.schoolRoles.includes("SCHOOL_ADMIN")) {
    return {};
  }
  if (actor.schoolRoles.includes("TEACHER_STAFF")) {
    return {
      OR: [{ mentorUserId: actor.userId }, { organizerUserId: actor.userId }],
    };
  }
  if (actor.schoolRoles.includes("MENTOR_COUNSELOR")) {
    return { mentorUserId: actor.userId };
  }
  if (actor.schoolRoles.includes("STUDENT")) {
    return { studentUserId: actor.userId };
  }
  if (actor.schoolRoles.includes("PARENT_GUARDIAN")) {
    return { studentUserId: { in: [...studentUserIds] } };
  }
  if (actor.schoolRoles.includes("APPROVER_REVIEWER")) {
    return { status: "REQUESTED" as const };
  }
  return { organizerUserId: actor.userId };
}

function scopedCaseWhere(
  actor: SchoolActor,
  linkedStudentIds: readonly string[],
) {
  if (
    actor.schoolRoles.includes("SCHOOL_ADMIN") ||
    actor.schoolRoles.includes("TEACHER_STAFF")
  ) {
    return {};
  }
  if (actor.schoolRoles.includes("MENTOR_COUNSELOR")) {
    return { primaryMentor: { userId: actor.userId } };
  }
  if (actor.schoolRoles.includes("STUDENT")) {
    return { studentUserId: actor.userId };
  }
  if (actor.schoolRoles.includes("PARENT_GUARDIAN")) {
    return { studentUserId: { in: [...linkedStudentIds] } };
  }
  return { id: "__no_case_access__" };
}

export async function listMentorProfiles(
  actor: AuthorizationContext,
  input: Readonly<{ query?: string; specialtySlug?: string }> = {},
) {
  requireDirectoryActor(actor, permissions.mentorDirectoryRead);
  const query = input.query?.trim();
  return db.mentorProfile.findMany({
    where: {
      schoolId: actor.schoolId,
      active: true,
      verificationStatus: "VERIFIED",
      ...(query
        ? {
            OR: [
              { headline: { contains: query, mode: "insensitive" } },
              { bio: { contains: query, mode: "insensitive" } },
              {
                user: {
                  displayName: { contains: query, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
      ...(input.specialtySlug
        ? {
            specialties: {
              some: {
                specialty: { slug: input.specialtySlug },
              },
            },
          }
        : {}),
    },
    orderBy: [{ verificationStatus: "asc" }, { updatedAt: "desc" }],
    take: 100,
    select: {
      id: true,
      headline: true,
      bio: true,
      yearsExperience: true,
      gradeLabel: true,
      achievements: true,
      hourlyRateMinVnd: true,
      hourlyRateMaxVnd: true,
      certifiedByUnion: true,
      acceptingRequests: true,
      verificationStatus: true,
      user: { select: { id: true, displayName: true } },
      specialties: {
        select: { specialty: { select: { name: true, slug: true } } },
      },
      _count: { select: { studentAssignments: true } },
    },
  });
}

export async function getMentorProfile(
  actor: AuthorizationContext,
  mentorProfileId: string,
  input: Readonly<{
    from: Date;
    to: Date;
    durationMinutes?: number;
  }>,
) {
  requireDirectoryActor(actor, permissions.mentorDirectoryRead);
  const profile = await db.mentorProfile.findFirst({
    where: {
      id: mentorProfileId,
      schoolId: actor.schoolId,
      active: true,
      verificationStatus: "VERIFIED",
    },
    select: {
      id: true,
      userId: true,
      headline: true,
      bio: true,
      yearsExperience: true,
      gradeLabel: true,
      achievements: true,
      hourlyRateMinVnd: true,
      hourlyRateMaxVnd: true,
      certifiedByUnion: true,
      acceptingRequests: true,
      verificationStatus: true,
      user: { select: { displayName: true } },
      specialties: {
        select: { specialty: { select: { name: true, slug: true } } },
      },
      availabilityRules: {
        where: { active: true },
        select: {
          weekday: true,
          startsAtLocal: true,
          endsAtLocal: true,
          timezone: true,
          capacity: true,
          active: true,
        },
      },
      availabilityExceptions: {
        where: {
          startsAt: { lt: input.to },
          endsAt: { gt: input.from },
        },
        select: { startsAt: true, endsAt: true, kind: true },
      },
      appointmentTypes: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          description: true,
          durationMinutes: true,
          capacity: true,
          requiresApproval: true,
        },
        orderBy: { durationMinutes: "asc" },
      },
    },
  });
  if (!profile) return null;

  const busyAppointments = await db.appointment.findMany({
    where: {
      schoolId: actor.schoolId,
      mentorUserId: profile.userId,
      status: { in: ["REQUESTED", "CONFIRMED"] },
      startsAt: { lt: input.to },
      endsAt: { gt: input.from },
    },
    select: { startsAt: true, endsAt: true },
  });
  const durationMinutes =
    input.durationMinutes ?? profile.appointmentTypes[0]?.durationMinutes ?? 60;
  const slots = calculateAvailabilitySlots({
    from: input.from,
    to: input.to,
    durationMinutes,
    rules: profile.availabilityRules,
    exceptions: profile.availabilityExceptions,
    busyAppointments,
  });

  return { ...profile, slots };
}

export async function listMentoringAppointments(
  actor: AuthorizationContext,
  input: Readonly<{
    from?: Date;
    to?: Date;
    status?: string;
  }> = {},
) {
  requireDirectoryActor(actor, permissions.mentorAppointmentRead);
  const linkedStudentIds = actor.schoolRoles.includes("PARENT_GUARDIAN")
    ? (
        await db.parentStudentLink.findMany({
          where: {
            schoolId: actor.schoolId,
            parentUserId: actor.userId,
            status: "ACTIVE",
            startsAt: { lte: new Date() },
            OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
          },
          select: { studentUserId: true },
        })
      ).map(({ studentUserId }) => studentUserId)
    : [];
  const status =
    input.status &&
    ["REQUESTED", "CONFIRMED", "WAITLISTED", "COMPLETED", "CANCELLED", "DECLINED"].includes(
      input.status,
    )
      ? (input.status as
          | "REQUESTED"
          | "CONFIRMED"
          | "WAITLISTED"
          | "COMPLETED"
          | "CANCELLED"
          | "DECLINED")
      : undefined;
  return db.appointment.findMany({
    where: {
      schoolId: actor.schoolId,
      ...(input.from || input.to
        ? {
            startsAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lt: input.to } : {}),
            },
          }
        : {}),
      ...(status ? { status } : {}),
      ...scopedAppointmentWhere(actor, linkedStudentIds),
    },
    orderBy: { startsAt: "asc" },
    take: 200,
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      status: true,
      location: true,
      studentMessage: true,
      organizerUserId: true,
      student: { select: { id: true, displayName: true } },
      mentor: { select: { id: true, displayName: true } },
      appointmentType: { select: { id: true, name: true, durationMinutes: true } },
      waitlistEntry: { select: { position: true, status: true } },
      attendance: { select: { userId: true, status: true } },
    },
  });
}

export async function getMentoringAppointment(
  actor: AuthorizationContext,
  appointmentId: string,
) {
  const appointments = await listMentoringAppointments(actor);
  return appointments.find(({ id }) => id === appointmentId) ?? null;
}

export async function getMentoringDashboard(actor: AuthorizationContext) {
  requireDirectoryActor(actor, permissions.mentorAppointmentRead);
  const now = new Date();
  const linkedStudentIds = actor.schoolRoles.includes("PARENT_GUARDIAN")
    ? (
        await db.parentStudentLink.findMany({
          where: {
            schoolId: actor.schoolId,
            parentUserId: actor.userId,
            status: "ACTIVE",
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          },
          select: { studentUserId: true },
        })
      ).map(({ studentUserId }) => studentUserId)
    : [];
  const [appointments, cases, pendingRequests, tasks] = await Promise.all([
    listMentoringAppointments(actor, {
      from: now,
      to: new Date(now.getTime() + 14 * 24 * 60 * 60_000),
    }),
    db.mentoringCase.count({
      where: {
        schoolId: actor.schoolId,
        status: { in: ["OPEN", "ON_HOLD"] },
        ...scopedCaseWhere(actor, linkedStudentIds),
      },
    }),
    actor.schoolRoles.some((role) =>
      ["MENTOR_COUNSELOR", "SCHOOL_ADMIN", "APPROVER_REVIEWER"].includes(role),
    )
      ? db.appointment.count({
          where: {
            schoolId: actor.schoolId,
            status: "REQUESTED",
            ...(actor.schoolRoles.includes("MENTOR_COUNSELOR")
              ? { mentorUserId: actor.userId }
              : {}),
          },
        })
      : Promise.resolve(0),
    actor.schoolRoles.includes("MENTOR_COUNSELOR")
      ? db.mentoringTask.count({
          where: {
            schoolId: actor.schoolId,
            assigneeUserId: actor.userId,
            status: { in: ["TODO", "IN_PROGRESS"] },
          },
        })
      : Promise.resolve(0),
  ]);
  return {
    appointments,
    openCases: cases,
    pendingRequests,
    openTasks: tasks,
  };
}
