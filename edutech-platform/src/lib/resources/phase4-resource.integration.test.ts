import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { db } from "@/lib/db";
import {
  addResourceComment,
  createResource,
  createResourceVersion,
  getAuthorizedFile,
  getResource,
  reportResource,
  rollbackResourceVersion,
  toggleResourceBookmark,
  transitionResource,
} from "@/lib/resources/resource-service";
import { LocalFileStorage } from "@/lib/storage/file-storage";

describe.sequential("Phase 4 resource integration", () => {
  const suffix = randomUUID().slice(0, 8);
  const schoolId = randomUUID();
  const otherSchoolId = randomUUID();
  const authorId = randomUUID();
  const studentId = randomUUID();
  const otherStudentId = randomUUID();
  const adminId = randomUUID();
  const membershipIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  const passwordHash = "phase4-test";
  let resourceId = "";
  let firstVersionId = "";
  let secondVersionId = "";
  let storageKey = "";

  const actor = (userId: string, membershipId: string, roles: AuthorizationContext["schoolRoles"], scopedSchoolId = schoolId): AuthorizationContext => ({
    userId,
    schoolId: scopedSchoolId,
    membershipId,
    schoolRoles: roles,
    platformRoles: [],
  });
  const authorActor = actor(authorId, membershipIds[0], ["TEACHER_STAFF"]);
  const studentActor = actor(studentId, membershipIds[1], ["STUDENT"]);
  const adminActor = actor(adminId, membershipIds[2], ["SCHOOL_ADMIN"]);
  const otherStudentActor = actor(otherStudentId, membershipIds[3], ["STUDENT"], otherSchoolId);

  beforeAll(async () => {
    await db.school.createMany({
      data: [
        { id: schoolId, slug: `phase4-${suffix}`, name: "Trường tài nguyên", shortName: "P4" },
        { id: otherSchoolId, slug: `phase4-other-${suffix}`, name: "Trường khác", shortName: "P4X" },
      ],
    });
    await db.user.createMany({
      data: [
        { id: authorId, email: `author-${suffix}@phase4.local`, normalizedEmail: `author-${suffix}@phase4.local`, displayName: "Tác giả tài nguyên", passwordHash, mustChangePassword: false },
        { id: studentId, email: `student-${suffix}@phase4.local`, normalizedEmail: `student-${suffix}@phase4.local`, displayName: "Học sinh tài nguyên", passwordHash, mustChangePassword: false },
        { id: otherStudentId, email: `other-student-${suffix}@phase4.local`, normalizedEmail: `other-student-${suffix}@phase4.local`, displayName: "Học sinh trường khác", passwordHash, mustChangePassword: false },
        { id: adminId, email: `admin-${suffix}@phase4.local`, normalizedEmail: `admin-${suffix}@phase4.local`, displayName: "Quản trị tài nguyên", passwordHash, mustChangePassword: false },
      ],
    });
    await db.schoolMembership.createMany({
      data: [
        { id: membershipIds[0], schoolId, userId: authorId, status: "ACTIVE", joinedAt: new Date() },
        { id: membershipIds[1], schoolId, userId: studentId, status: "ACTIVE", joinedAt: new Date() },
        { id: membershipIds[2], schoolId, userId: adminId, status: "ACTIVE", joinedAt: new Date() },
        { id: membershipIds[3], schoolId: otherSchoolId, userId: otherStudentId, status: "ACTIVE", joinedAt: new Date() },
      ],
    });
    await db.schoolRoleAssignment.createMany({
      data: [
        { membershipId: membershipIds[0], role: "TEACHER_STAFF" },
        { membershipId: membershipIds[1], role: "STUDENT" },
        { membershipId: membershipIds[2], role: "SCHOOL_ADMIN" },
        { membershipId: membershipIds[3], role: "STUDENT" },
      ],
    });
  });

  afterAll(async () => {
    const files = await db.storedFile.findMany({ where: { schoolId }, select: { storageKey: true } });
    await Promise.all(files.map((file) => new LocalFileStorage().remove(file.storageKey).catch(() => undefined)));
    await db.auditEvent.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.domainOutboxEvent.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
    await db.resourceAnalyticsEvent.deleteMany({ where: { schoolId } });
    await db.resourceAnalyticsCounter.deleteMany({ where: { resource: { schoolId } } });
    await db.resourceBookmark.deleteMany({ where: { schoolId } });
    await db.resourceComment.deleteMany({ where: { schoolId } });
    await db.resourceReport.deleteMany({ where: { schoolId } });
    await db.fileLink.deleteMany({ where: { schoolId } });
    await db.fileVersion.deleteMany({ where: { file: { schoolId } } });
    await db.storedFile.deleteMany({ where: { schoolId } });
    await db.resourceTransition.deleteMany({ where: { schoolId } });
    await db.resourceVersion.deleteMany({ where: { resource: { schoolId } } });
    await db.resource.deleteMany({ where: { schoolId } });
    await db.schoolRoleAssignment.deleteMany({ where: { membershipId: { in: membershipIds } } });
    await db.schoolMembership.deleteMany({ where: { id: { in: membershipIds } } });
    await db.user.deleteMany({ where: { id: { in: [authorId, studentId, otherStudentId, adminId] } } });
    await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  });

  it("author → review → publish → reader → immutable version and private file scope", async () => {
    resourceId = await createResource(authorActor, {
      title: "Cẩm nang học tập Phase 4",
      summary: "Tài nguyên integration",
      body: "Nội dung phiên bản đầu.",
      visibility: "SCHOOL",
    });
    const draft = await db.resource.findUnique({ where: { id: resourceId }, include: { currentVersion: true } });
    firstVersionId = draft?.currentVersion?.id ?? "";
    expect(draft?.status).toBe("DRAFT");
    await expect(getResource(studentActor, resourceId)).rejects.toThrow();

    await transitionResource(authorActor, resourceId, "SUBMIT_REVIEW");
    await transitionResource(adminActor, resourceId, "APPROVE");
    const published = await getResource(studentActor, resourceId);
    expect(published.status).toBe("PUBLISHED");
    expect(published.currentVersion?.body).toContain("phiên bản đầu");

    secondVersionId = await createResourceVersion(authorActor, resourceId, {
      title: "Cẩm nang học tập Phase 4 — cập nhật",
      summary: "Bản mới",
      body: "Nội dung phiên bản hai.",
      file: {
        originalName: "cam-nang.pdf",
        mimeType: "application/pdf",
        content: new TextEncoder().encode("demo file"),
      },
    });
    const latest = await db.resource.findUnique({ where: { id: resourceId }, include: { currentVersion: true } });
    expect(latest?.currentVersionId).toBe(secondVersionId);
    expect(await db.resourceVersion.findUnique({ where: { id: firstVersionId } })).not.toBeNull();
    const file = await getAuthorizedFile(studentActor, resourceId, secondVersionId);
    storageKey = file.storageKey;
    expect(await new LocalFileStorage().exists(storageKey)).toBe(true);
    await expect(getResource(otherStudentActor, resourceId)).rejects.toThrow();
    const rollbackVersionId = await rollbackResourceVersion(authorActor, resourceId, firstVersionId);
    const rolledBack = await db.resource.findUnique({ where: { id: resourceId }, include: { currentVersion: true } });
    expect(rollbackVersionId).not.toBe(firstVersionId);
    expect(rolledBack?.currentVersion?.body).toContain("phiên bản đầu");
  });

  it("supports bookmark, comment and report in same tenant", async () => {
    await expect(toggleResourceBookmark(studentActor, resourceId)).resolves.toBe(true);
    await expect(toggleResourceBookmark(studentActor, resourceId)).resolves.toBe(false);
    await expect(addResourceComment(studentActor, resourceId, "Tài liệu dễ dùng.")).resolves.toBeTypeOf("string");
    await expect(reportResource(studentActor, resourceId, "Cần kiểm tra nội dung.")).resolves.toBeTypeOf("string");
  });
});
