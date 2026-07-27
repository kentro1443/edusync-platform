import "server-only";

import { db } from "@/lib/db";
import type { AuthorizationContext } from "@/lib/auth/policies";
import type {
  MentorOfferStatus,
  MentorPaymentStatus,
  MentorRequestStatus,
} from "@/generated/prisma/enums";

export type OpenRequestView = {
  id: string;
  title: string;
  description: string;
  preferredSessions: number;
  budgetHintVnd: number | null;
  specialtyName: string | null;
  studentName: string;
  offerCount: number;
  createdAt: string;
  alreadyOffered: boolean;
};

export type OfferOnRequestView = {
  id: string;
  mentorName: string;
  mentorProfileId: string;
  pricePerSessionVnd: number;
  message: string;
  status: MentorOfferStatus;
};

export type MyRequestView = {
  id: string;
  title: string;
  description: string;
  preferredSessions: number;
  budgetHintVnd: number | null;
  specialtyName: string | null;
  status: MentorRequestStatus;
  createdAt: string;
  offers: OfferOnRequestView[];
  engagement: {
    id: string;
    mentorName: string;
    totalAmountVnd: number;
    sessions: number;
    paymentStatus: MentorPaymentStatus;
  } | null;
};

export type MyOfferView = {
  id: string;
  requestId: string;
  requestTitle: string;
  studentName: string;
  pricePerSessionVnd: number;
  status: MentorOfferStatus;
  createdAt: string;
};

export type MentorIncomeView = {
  id: string;
  studentName: string;
  requestTitle: string;
  totalAmountVnd: number;
  sessions: number;
  paymentStatus: MentorPaymentStatus;
  createdAt: string;
};

/** The current user's own active, verified mentor profile — enables offering. */
export async function getActorMentorProfile(
  actor: AuthorizationContext,
): Promise<{ id: string; acceptingRequests: boolean } | null> {
  if (!actor.schoolId) return null;
  const profile = await db.mentorProfile.findFirst({
    where: {
      schoolId: actor.schoolId,
      userId: actor.userId,
      active: true,
      verificationStatus: "VERIFIED",
    },
    select: { id: true, acceptingRequests: true },
  });
  return profile;
}

/** Open requests a mentor can bid on (excludes the actor's own requests). */
export async function listOpenRequests(
  actor: AuthorizationContext,
): Promise<OpenRequestView[]> {
  if (!actor.schoolId) return [];
  const requests = await db.mentorRequest.findMany({
    where: {
      schoolId: actor.schoolId,
      status: "OPEN",
      studentUserId: { not: actor.userId },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      description: true,
      preferredSessions: true,
      budgetHintVnd: true,
      createdAt: true,
      student: { select: { displayName: true } },
      specialty: { select: { name: true } },
      offers: { select: { id: true, mentorUserId: true } },
    },
  });
  return requests.map((request) => ({
    id: request.id,
    title: request.title,
    description: request.description,
    preferredSessions: request.preferredSessions,
    budgetHintVnd: request.budgetHintVnd,
    specialtyName: request.specialty?.name ?? null,
    studentName: request.student.displayName,
    offerCount: request.offers.length,
    createdAt: request.createdAt.toISOString(),
    alreadyOffered: request.offers.some((offer) => offer.mentorUserId === actor.userId),
  }));
}

/** The actor's own requests, each with its offers and any settled engagement. */
export async function listMyRequests(
  actor: AuthorizationContext,
): Promise<MyRequestView[]> {
  if (!actor.schoolId) return [];
  const requests = await db.mentorRequest.findMany({
    where: { schoolId: actor.schoolId, studentUserId: actor.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      description: true,
      preferredSessions: true,
      budgetHintVnd: true,
      status: true,
      createdAt: true,
      specialty: { select: { name: true } },
      offers: {
        orderBy: { pricePerSessionVnd: "asc" },
        select: {
          id: true,
          pricePerSessionVnd: true,
          message: true,
          status: true,
          mentorProfileId: true,
          mentor: { select: { displayName: true } },
        },
      },
      engagement: {
        select: {
          id: true,
          totalAmountVnd: true,
          sessions: true,
          paymentStatus: true,
          mentor: { select: { displayName: true } },
        },
      },
    },
  });
  return requests.map((request) => ({
    id: request.id,
    title: request.title,
    description: request.description,
    preferredSessions: request.preferredSessions,
    budgetHintVnd: request.budgetHintVnd,
    specialtyName: request.specialty?.name ?? null,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    offers: request.offers.map((offer) => ({
      id: offer.id,
      mentorName: offer.mentor.displayName,
      mentorProfileId: offer.mentorProfileId,
      pricePerSessionVnd: offer.pricePerSessionVnd,
      message: offer.message,
      status: offer.status,
    })),
    engagement: request.engagement
      ? {
          id: request.engagement.id,
          mentorName: request.engagement.mentor.displayName,
          totalAmountVnd: request.engagement.totalAmountVnd,
          sessions: request.engagement.sessions,
          paymentStatus: request.engagement.paymentStatus,
        }
      : null,
  }));
}

/** The actor's own submitted offers (mentor view). */
export async function listMyOffers(
  actor: AuthorizationContext,
): Promise<MyOfferView[]> {
  if (!actor.schoolId) return [];
  const offers = await db.mentorOffer.findMany({
    where: { schoolId: actor.schoolId, mentorUserId: actor.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      pricePerSessionVnd: true,
      status: true,
      createdAt: true,
      requestId: true,
      request: { select: { title: true, student: { select: { displayName: true } } } },
    },
  });
  return offers.map((offer) => ({
    id: offer.id,
    requestId: offer.requestId,
    requestTitle: offer.request.title,
    studentName: offer.request.student.displayName,
    pricePerSessionVnd: offer.pricePerSessionVnd,
    status: offer.status,
    createdAt: offer.createdAt.toISOString(),
  }));
}

/** Engagements where the actor is the mentor — the passive-income tracker. */
export async function listMentorIncome(
  actor: AuthorizationContext,
): Promise<MentorIncomeView[]> {
  if (!actor.schoolId) return [];
  const engagements = await db.mentorEngagement.findMany({
    where: { schoolId: actor.schoolId, mentorUserId: actor.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      totalAmountVnd: true,
      sessions: true,
      paymentStatus: true,
      createdAt: true,
      student: { select: { displayName: true } },
      request: { select: { title: true } },
    },
  });
  return engagements.map((engagement) => ({
    id: engagement.id,
    studentName: engagement.student.displayName,
    requestTitle: engagement.request.title,
    totalAmountVnd: engagement.totalAmountVnd,
    sessions: engagement.sessions,
    paymentStatus: engagement.paymentStatus,
    createdAt: engagement.createdAt.toISOString(),
  }));
}

export function specialtyOptions(schoolId: string) {
  return db.mentorSpecialty.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
