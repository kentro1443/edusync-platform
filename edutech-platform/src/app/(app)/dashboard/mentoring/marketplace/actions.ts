"use server";

import { redirect } from "next/navigation";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  MarketplaceAuthorizationError,
  acceptMentorOffer,
  cancelMentorRequest,
  postMentorRequest,
  submitMentorOffer,
  updateEngagementPayment,
  withdrawMentorOffer,
} from "@/lib/marketplace/marketplace-service";
import {
  MarketplaceStateError,
  MarketplaceValidationError,
} from "@/lib/marketplace/marketplace-domain";

const HUB = "/dashboard/mentoring/marketplace";

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberOrNull(formData: FormData, key: string): number | null {
  const raw = stringValue(formData, key);
  if (!raw) return null;
  const parsed = Number(raw.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function redirectError(tab: string, error: unknown): never {
  if (error instanceof MarketplaceValidationError) redirect(`${HUB}?tab=${tab}&error=invalid`);
  if (error instanceof MarketplaceStateError) redirect(`${HUB}?tab=${tab}&error=state`);
  if (error instanceof MarketplaceAuthorizationError) redirect(`${HUB}?tab=${tab}&error=forbidden`);
  throw error;
}

export async function postRequestAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.marketplaceRequestCreate);
  try {
    await postMentorRequest(actor, {
      title: stringValue(formData, "title"),
      description: stringValue(formData, "description"),
      preferredSessions: Number(stringValue(formData, "preferredSessions") || 1),
      specialtyId: stringValue(formData, "specialtyId") || null,
      budgetHintVnd: numberOrNull(formData, "budgetHintVnd"),
    });
  } catch (error) {
    redirectError("requests", error);
  }
  redirect(`${HUB}?tab=requests&result=requested`);
}

export async function submitOfferAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.marketplaceOfferCreate);
  try {
    await submitMentorOffer(actor, {
      requestId: stringValue(formData, "requestId"),
      mentorProfileId: stringValue(formData, "mentorProfileId"),
      pricePerSessionVnd: Number(numberOrNull(formData, "pricePerSessionVnd") ?? 0),
      message: stringValue(formData, "message"),
    });
  } catch (error) {
    redirectError("browse", error);
  }
  redirect(`${HUB}?tab=browse&result=offered`);
}

export async function acceptOfferAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.marketplaceRead);
  try {
    await acceptMentorOffer(actor, stringValue(formData, "offerId"));
  } catch (error) {
    redirectError("requests", error);
  }
  redirect(`${HUB}?tab=requests&result=accepted`);
}

export async function withdrawOfferAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.marketplaceRead);
  try {
    await withdrawMentorOffer(actor, stringValue(formData, "offerId"));
  } catch (error) {
    redirectError("offers", error);
  }
  redirect(`${HUB}?tab=offers&result=withdrawn`);
}

export async function cancelRequestAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.marketplaceRead);
  try {
    await cancelMentorRequest(actor, stringValue(formData, "requestId"));
  } catch (error) {
    redirectError("requests", error);
  }
  redirect(`${HUB}?tab=requests&result=cancelled`);
}

export async function markPaymentAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.marketplaceRead);
  const status = stringValue(formData, "status") === "WAIVED" ? "WAIVED" : "PAID";
  try {
    await updateEngagementPayment(actor, stringValue(formData, "engagementId"), status);
  } catch (error) {
    redirectError("requests", error);
  }
  redirect(`${HUB}?tab=requests&result=paid`);
}
