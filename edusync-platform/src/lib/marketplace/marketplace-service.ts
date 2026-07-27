import "server-only";

import { randomUUID } from "node:crypto";

import type { AuthorizationContext } from "@/lib/auth/policies";
import { can } from "@/lib/auth/policies";
import { permissions } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { MentorPaymentStatus } from "@/generated/prisma/enums";
import {
  assertNotSelfOffer,
  assertOfferAcceptable,
  assertOfferWithdrawable,
  assertPaymentTransition,
  assertRequestAcceptsOffers,
  assertRequestCancellable,
  totalAmountVnd,
  validateOfferInput,
  validateRequestInput,
} from "@/lib/marketplace/marketplace-domain";

export class MarketplaceAuthorizationError extends Error {}

type SchoolActor = AuthorizationContext & {
  schoolId: string;
  membershipId: string;
};

function requireSchoolActor(
  actor: AuthorizationContext,
  permission: Parameters<typeof can>[1],
): asserts actor is SchoolActor {
  if (actor.schoolId === null || actor.membershipId === null || !can(actor, permission)) {
    throw new MarketplaceAuthorizationError("Bạn không có quyền thực hiện thao tác này.");
  }
}

async function lockRequest(
  transaction: Prisma.TransactionClient,
  schoolId: string,
  requestId: string,
): Promise<void> {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`marketplace-request:${schoolId}:${requestId}`}, 0))
  `;
}

async function writeRecords(
  transaction: Prisma.TransactionClient,
  input: {
    schoolId: string;
    actorUserId: string;
    entityType: string;
    entityId: string;
    action: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    after?: object;
    payload?: object;
  },
): Promise<void> {
  const requestId = randomUUID();
  await transaction.auditEvent.create({
    data: {
      schoolId: input.schoolId,
      actorUserId: input.actorUserId,
      actorType: "USER",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      afterJson: input.after,
      requestId,
    },
  });
  await transaction.domainOutboxEvent.create({
    data: {
      schoolId: input.schoolId,
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payloadJson: {
        actorUserId: input.actorUserId,
        requestId,
        ...input.payload,
      },
    },
  });
}

export type PostRequestInput = Readonly<{
  title: string;
  description: string;
  preferredSessions: number;
  specialtyId?: string | null;
  budgetHintVnd?: number | null;
}>;

/** A student (or guardian) posts an open request describing the help they need. */
export async function postMentorRequest(
  actor: AuthorizationContext,
  input: PostRequestInput,
): Promise<string> {
  requireSchoolActor(actor, permissions.marketplaceRequestCreate);
  const schoolId = actor.schoolId;
  const clean = validateRequestInput(input);

  return db.$transaction(async (transaction) => {
    let specialtyId: string | null = null;
    if (input.specialtyId) {
      const specialty = await transaction.mentorSpecialty.findFirst({
        where: { id: input.specialtyId, schoolId },
        select: { id: true },
      });
      if (!specialty) {
        throw new MarketplaceAuthorizationError("Chuyên môn không hợp lệ.");
      }
      specialtyId = specialty.id;
    }

    const request = await transaction.mentorRequest.create({
      data: {
        schoolId,
        studentUserId: actor.userId,
        specialtyId,
        title: clean.title,
        description: clean.description,
        preferredSessions: clean.preferredSessions,
        budgetHintVnd: clean.budgetHintVnd,
      },
      select: { id: true },
    });

    await writeRecords(transaction, {
      schoolId,
      actorUserId: actor.userId,
      entityType: "MentorRequest",
      entityId: request.id,
      action: "marketplace.request.create",
      eventType: "marketplace.request.created",
      aggregateType: "MentorRequest",
      aggregateId: request.id,
      after: { title: clean.title, preferredSessions: clean.preferredSessions },
    });

    return request.id;
  });
}

export type SubmitOfferInput = Readonly<{
  requestId: string;
  mentorProfileId: string;
  pricePerSessionVnd: number;
  message: string;
}>;

/** A verified, accepting mentor submits a priced offer on an open request. */
export async function submitMentorOffer(
  actor: AuthorizationContext,
  input: SubmitOfferInput,
): Promise<string> {
  requireSchoolActor(actor, permissions.marketplaceOfferCreate);
  const schoolId = actor.schoolId;
  const clean = validateOfferInput(input);

  return db.$transaction(async (transaction) => {
    await lockRequest(transaction, schoolId, input.requestId);

    const request = await transaction.mentorRequest.findFirst({
      where: { id: input.requestId, schoolId },
      select: { id: true, status: true, studentUserId: true },
    });
    if (!request) {
      throw new MarketplaceAuthorizationError("Không tìm thấy yêu cầu.");
    }
    assertRequestAcceptsOffers(request.status);
    assertNotSelfOffer(request.studentUserId, actor.userId);

    const profile = await transaction.mentorProfile.findFirst({
      where: {
        id: input.mentorProfileId,
        schoolId,
        userId: actor.userId,
        active: true,
        acceptingRequests: true,
        verificationStatus: "VERIFIED",
      },
      select: { id: true },
    });
    if (!profile) {
      throw new MarketplaceAuthorizationError(
        "Chỉ cố vấn đã xác minh và đang nhận yêu cầu mới được gửi đề xuất.",
      );
    }

    const existing = await transaction.mentorOffer.findFirst({
      where: { requestId: input.requestId, mentorProfileId: input.mentorProfileId },
      select: { id: true },
    });
    if (existing) {
      throw new MarketplaceAuthorizationError("Bạn đã gửi đề xuất cho yêu cầu này.");
    }

    const offer = await transaction.mentorOffer.create({
      data: {
        schoolId,
        requestId: input.requestId,
        mentorProfileId: input.mentorProfileId,
        mentorUserId: actor.userId,
        pricePerSessionVnd: clean.pricePerSessionVnd,
        message: clean.message,
      },
      select: { id: true },
    });

    await writeRecords(transaction, {
      schoolId,
      actorUserId: actor.userId,
      entityType: "MentorOffer",
      entityId: offer.id,
      action: "marketplace.offer.create",
      eventType: "marketplace.offer.created",
      aggregateType: "MentorRequest",
      aggregateId: input.requestId,
      after: { pricePerSessionVnd: clean.pricePerSessionVnd },
      payload: { studentUserId: request.studentUserId, offerId: offer.id },
    });

    return offer.id;
  });
}

/**
 * The requesting student accepts one offer. Transactional and locked on the
 * request: the winning offer is accepted, every sibling offer is declined, the
 * request is marked matched and a settled engagement (payment pending) is created.
 */
export async function acceptMentorOffer(
  actor: AuthorizationContext,
  offerId: string,
): Promise<string> {
  requireSchoolActor(actor, permissions.marketplaceRead);
  const schoolId = actor.schoolId;

  return db.$transaction(async (transaction) => {
    const offer = await transaction.mentorOffer.findFirst({
      where: { id: offerId, schoolId },
      select: {
        id: true,
        status: true,
        requestId: true,
        mentorProfileId: true,
        mentorUserId: true,
        pricePerSessionVnd: true,
      },
    });
    if (!offer) {
      throw new MarketplaceAuthorizationError("Không tìm thấy đề xuất.");
    }

    await lockRequest(transaction, schoolId, offer.requestId);

    const request = await transaction.mentorRequest.findFirst({
      where: { id: offer.requestId, schoolId },
      select: { id: true, status: true, studentUserId: true, preferredSessions: true },
    });
    if (!request) {
      throw new MarketplaceAuthorizationError("Không tìm thấy yêu cầu.");
    }
    if (request.studentUserId !== actor.userId) {
      throw new MarketplaceAuthorizationError("Bạn không thể chấp nhận đề xuất của yêu cầu này.");
    }
    assertOfferAcceptable(request.status, offer.status);

    await transaction.mentorOffer.update({
      where: { id: offer.id },
      data: { status: "ACCEPTED" },
    });
    await transaction.mentorOffer.updateMany({
      where: { requestId: request.id, status: "PENDING", id: { not: offer.id } },
      data: { status: "DECLINED" },
    });
    await transaction.mentorRequest.update({
      where: { id: request.id },
      data: { status: "MATCHED" },
    });

    const sessions = request.preferredSessions;
    const engagement = await transaction.mentorEngagement.create({
      data: {
        schoolId,
        requestId: request.id,
        offerId: offer.id,
        mentorProfileId: offer.mentorProfileId,
        mentorUserId: offer.mentorUserId,
        studentUserId: request.studentUserId,
        agreedPricePerSessionVnd: offer.pricePerSessionVnd,
        sessions,
        totalAmountVnd: totalAmountVnd(offer.pricePerSessionVnd, sessions),
      },
      select: { id: true },
    });

    await writeRecords(transaction, {
      schoolId,
      actorUserId: actor.userId,
      entityType: "MentorEngagement",
      entityId: engagement.id,
      action: "marketplace.offer.accept",
      eventType: "marketplace.offer.accepted",
      aggregateType: "MentorRequest",
      aggregateId: request.id,
      after: { offerId: offer.id, totalAmountVnd: totalAmountVnd(offer.pricePerSessionVnd, sessions) },
      payload: { mentorUserId: offer.mentorUserId, engagementId: engagement.id },
    });

    return engagement.id;
  });
}

/** A mentor withdraws their own still-pending offer. */
export async function withdrawMentorOffer(
  actor: AuthorizationContext,
  offerId: string,
): Promise<void> {
  requireSchoolActor(actor, permissions.marketplaceRead);
  const schoolId = actor.schoolId;

  await db.$transaction(async (transaction) => {
    const offer = await transaction.mentorOffer.findFirst({
      where: { id: offerId, schoolId },
      select: { id: true, status: true, mentorUserId: true, requestId: true },
    });
    if (!offer || offer.mentorUserId !== actor.userId) {
      throw new MarketplaceAuthorizationError("Bạn không thể rút đề xuất này.");
    }
    assertOfferWithdrawable(offer.status);
    await transaction.mentorOffer.update({
      where: { id: offer.id },
      data: { status: "WITHDRAWN" },
    });
    await writeRecords(transaction, {
      schoolId,
      actorUserId: actor.userId,
      entityType: "MentorOffer",
      entityId: offer.id,
      action: "marketplace.offer.withdraw",
      eventType: "marketplace.offer.withdrawn",
      aggregateType: "MentorRequest",
      aggregateId: offer.requestId,
    });
  });
}

/** The requesting student cancels their still-open request, declining pending offers. */
export async function cancelMentorRequest(
  actor: AuthorizationContext,
  requestId: string,
): Promise<void> {
  requireSchoolActor(actor, permissions.marketplaceRead);
  const schoolId = actor.schoolId;

  await db.$transaction(async (transaction) => {
    await lockRequest(transaction, schoolId, requestId);
    const request = await transaction.mentorRequest.findFirst({
      where: { id: requestId, schoolId },
      select: { id: true, status: true, studentUserId: true },
    });
    if (!request || request.studentUserId !== actor.userId) {
      throw new MarketplaceAuthorizationError("Bạn không thể hủy yêu cầu này.");
    }
    assertRequestCancellable(request.status);
    await transaction.mentorOffer.updateMany({
      where: { requestId: request.id, status: "PENDING" },
      data: { status: "DECLINED" },
    });
    await transaction.mentorRequest.update({
      where: { id: request.id },
      data: { status: "CANCELLED" },
    });
    await writeRecords(transaction, {
      schoolId,
      actorUserId: actor.userId,
      entityType: "MentorRequest",
      entityId: request.id,
      action: "marketplace.request.cancel",
      eventType: "marketplace.request.cancelled",
      aggregateType: "MentorRequest",
      aggregateId: request.id,
    });
  });
}

/** The student marks a settled engagement as paid or waived (settled offline). */
export async function updateEngagementPayment(
  actor: AuthorizationContext,
  engagementId: string,
  nextStatus: MentorPaymentStatus,
): Promise<void> {
  requireSchoolActor(actor, permissions.marketplaceRead);
  const schoolId = actor.schoolId;

  await db.$transaction(async (transaction) => {
    const engagement = await transaction.mentorEngagement.findFirst({
      where: { id: engagementId, schoolId },
      select: { id: true, paymentStatus: true, studentUserId: true },
    });
    if (!engagement || engagement.studentUserId !== actor.userId) {
      throw new MarketplaceAuthorizationError("Bạn không thể cập nhật thanh toán này.");
    }
    assertPaymentTransition(engagement.paymentStatus, nextStatus);
    await transaction.mentorEngagement.update({
      where: { id: engagement.id },
      data: { paymentStatus: nextStatus },
    });
    await writeRecords(transaction, {
      schoolId,
      actorUserId: actor.userId,
      entityType: "MentorEngagement",
      entityId: engagement.id,
      action: "marketplace.payment.update",
      eventType: "marketplace.payment.updated",
      aggregateType: "MentorEngagement",
      aggregateId: engagement.id,
      after: { paymentStatus: nextStatus },
    });
  });
}
