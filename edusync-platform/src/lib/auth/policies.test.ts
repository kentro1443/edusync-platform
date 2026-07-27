import { describe, expect, it } from "vitest";

import {
  getSchoolPermissions,
  permissions,
} from "@/lib/auth/permissions";
import {
  can,
  canAccessLinkedStudentField,
  canReadCounselingNote,
  type AuthorizationContext,
} from "@/lib/auth/policies";

const schoolActor: AuthorizationContext = {
  userId: "user-1",
  schoolId: "school-1",
  membershipId: "membership-1",
  schoolRoles: ["STUDENT"],
  platformRoles: [],
};

describe("school permissions", () => {
  it("does not grant identity administration to students, parents or teachers", () => {
    for (const role of ["STUDENT", "PARENT_GUARDIAN", "TEACHER_STAFF"] as const) {
      const actor: AuthorizationContext = {
        ...schoolActor,
        schoolRoles: [role],
      };
      expect(can(actor, permissions.schoolUserRead)).toBe(false);
      expect(can(actor, permissions.schoolUserInvite)).toBe(false);
      expect(can(actor, permissions.schoolRoleAssign)).toBe(false);
      expect(can(actor, permissions.schoolAuditRead)).toBe(false);
    }
  });

  it("unions permissions from multiple roles without duplicates", () => {
    const effective = getSchoolPermissions([
      "STUDENT",
      "CLUB_LEADER",
    ]);

    expect(effective).toContain(permissions.clubCreate);
    expect(effective).toContain(permissions.clubMembershipReview);
    expect(new Set(effective).size).toBe(effective.length);
  });

  it("denies a permitted action when the actor has no active school context", () => {
    const actor: AuthorizationContext = {
      ...schoolActor,
      schoolId: null,
      membershipId: null,
    };

    expect(can(actor, permissions.resourceRead)).toBe(false);
  });

  it("denies access to a resource owned by another school", () => {
    expect(
      can(schoolActor, permissions.resourceRead, {
        schoolId: "school-2",
      }),
    ).toBe(false);
  });

  it("allows a role permission within the active school", () => {
    expect(
      can(schoolActor, permissions.resourceRead, {
        schoolId: "school-1",
      }),
    ).toBe(true);
  });
});

describe("parent-linked student fields", () => {
  it("allows only explicitly visible fields during an active relationship", () => {
    const actor: AuthorizationContext = {
      ...schoolActor,
      userId: "parent-1",
      schoolRoles: ["PARENT_GUARDIAN"],
    };
    const relationship = {
      schoolId: "school-1",
      parentUserId: "parent-1",
      studentUserId: "student-1",
      isActive: true,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2027-01-01T00:00:00.000Z"),
      visibleFields: {
        attendance: true,
        counselingNotes: false,
      },
    };
    const now = new Date("2026-07-01T00:00:00.000Z");

    expect(
      canAccessLinkedStudentField(
        actor,
        relationship,
        "student-1",
        "attendance",
        now,
      ),
    ).toBe(true);
    expect(
      canAccessLinkedStudentField(
        actor,
        relationship,
        "student-1",
        "counselingNotes",
        now,
      ),
    ).toBe(false);
  });

  it("treats the relationship end timestamp as exclusive", () => {
    const actor: AuthorizationContext = {
      ...schoolActor,
      userId: "parent-1",
      schoolRoles: ["PARENT_GUARDIAN"],
    };
    const endsAt = new Date("2026-07-01T00:00:00.000Z");

    expect(
      canAccessLinkedStudentField(
        actor,
        {
          schoolId: "school-1",
          parentUserId: "parent-1",
          studentUserId: "student-1",
          isActive: true,
          startsAt: new Date("2026-01-01T00:00:00.000Z"),
          endsAt,
          visibleFields: { attendance: true },
        },
        "student-1",
        "attendance",
        endsAt,
      ),
    ).toBe(false);
  });
});

describe("counseling note privacy", () => {
  const note = {
    schoolId: "school-1",
    authorUserId: "author-1",
    studentUserId: "student-1",
    visibility: "PRIVATE_AUTHOR" as const,
  };

  it("allows the author to read a private note", () => {
    expect(
      canReadCounselingNote({
        actor: { ...schoolActor, userId: "author-1" },
        note,
        assignedStaffUserIds: [],
        supportTeamUserIds: [],
        sessionParticipantUserIds: [],
      }),
    ).toBe(true);
  });

  it("denies a private note to non-authors regardless of broad school role", () => {
    expect(
      canReadCounselingNote({
        actor: {
          ...schoolActor,
          userId: "admin-1",
          schoolRoles: ["SCHOOL_ADMIN"],
        },
        note,
        assignedStaffUserIds: ["admin-1"],
        supportTeamUserIds: ["admin-1"],
        sessionParticipantUserIds: ["admin-1"],
      }),
    ).toBe(false);
  });

  it("allows only actors listed by the selected visibility mode", () => {
    const actor = {
      ...schoolActor,
      userId: "counselor-1",
      schoolRoles: ["MENTOR_COUNSELOR"] as const,
    };

    expect(
      canReadCounselingNote({
        actor,
        note: { ...note, visibility: "ASSIGNED_STAFF" },
        assignedStaffUserIds: ["counselor-1"],
        supportTeamUserIds: [],
        sessionParticipantUserIds: [],
      }),
    ).toBe(true);
    expect(
      canReadCounselingNote({
        actor,
        note: { ...note, visibility: "SESSION_PARTICIPANTS" },
        assignedStaffUserIds: ["counselor-1"],
        supportTeamUserIds: [],
        sessionParticipantUserIds: [],
      }),
    ).toBe(false);
  });

  it("denies listed actors when the note belongs to another school", () => {
    expect(
      canReadCounselingNote({
        actor: { ...schoolActor, userId: "staff-1" },
        note: {
          ...note,
          schoolId: "school-2",
          visibility: "ASSIGNED_STAFF",
        },
        assignedStaffUserIds: ["staff-1"],
        supportTeamUserIds: [],
        sessionParticipantUserIds: [],
      }),
    ).toBe(false);
  });
});
