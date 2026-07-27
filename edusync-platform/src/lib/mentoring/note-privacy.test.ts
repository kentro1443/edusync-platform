import { describe, expect, it } from "vitest";

import {
  canReadMentoringNote,
  projectMentoringNotes,
} from "@/lib/mentoring/note-privacy";

const note = {
  id: "note-1",
  schoolId: "school-a",
  studentUserId: "student-a",
  authorUserId: "mentor-a",
  visibility: "PRIVATE_COUNSELOR" as const,
  body: "Nội dung tuyệt mật",
};

describe("mentoring note privacy", () => {
  it("chỉ tác giả đọc ghi chú PRIVATE_COUNSELOR", () => {
    expect(
      canReadMentoringNote({
        actor: {
          userId: "mentor-a",
          schoolId: "school-a",
          roles: ["MENTOR_COUNSELOR"],
        },
        note,
        assignedStaffUserIds: ["mentor-a"],
        linkedGuardianUserIds: ["parent-a"],
      }),
    ).toBe(true);

    for (const actor of [
      { userId: "student-a", roles: ["STUDENT"] as const },
      { userId: "parent-a", roles: ["PARENT_GUARDIAN"] as const },
      { userId: "admin-a", roles: ["SCHOOL_ADMIN"] as const },
      { userId: "mentor-b", roles: ["MENTOR_COUNSELOR"] as const },
    ]) {
      expect(
        canReadMentoringNote({
          actor: { ...actor, schoolId: "school-a" },
          note,
          assignedStaffUserIds: ["mentor-a"],
          linkedGuardianUserIds: ["parent-a"],
        }),
      ).toBe(false);
    }
  });

  it("chỉ cho guardian đã liên kết đọc GUARDIAN_VISIBLE", () => {
    const guardianNote = { ...note, visibility: "GUARDIAN_VISIBLE" as const };
    expect(
      canReadMentoringNote({
        actor: {
          userId: "parent-a",
          schoolId: "school-a",
          roles: ["PARENT_GUARDIAN"],
        },
        note: guardianNote,
        assignedStaffUserIds: ["mentor-a"],
        linkedGuardianUserIds: ["parent-a"],
      }),
    ).toBe(true);
    expect(
      canReadMentoringNote({
        actor: {
          userId: "parent-b",
          schoolId: "school-a",
          roles: ["PARENT_GUARDIAN"],
        },
        note: guardianNote,
        assignedStaffUserIds: ["mentor-a"],
        linkedGuardianUserIds: ["parent-a"],
      }),
    ).toBe(false);
  });

  it("không trả note trái tenant hoặc trái quyền trong projection", () => {
    const visible = {
      ...note,
      id: "note-2",
      visibility: "STUDENT_VISIBLE" as const,
      body: "Nội dung học sinh được xem",
    };
    const projected = projectMentoringNotes({
      actor: {
        userId: "student-a",
        schoolId: "school-a",
        roles: ["STUDENT"],
      },
      notes: [
        note,
        visible,
        { ...visible, id: "note-school-b", schoolId: "school-b" },
      ],
      assignedStaffUserIds: ["mentor-a"],
      linkedGuardianUserIds: ["parent-a"],
    });

    expect(projected).toEqual([visible]);
    expect(JSON.stringify(projected)).not.toContain("Nội dung tuyệt mật");
  });
});
