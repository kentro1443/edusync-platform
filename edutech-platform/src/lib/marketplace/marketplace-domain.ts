import type {
  MentorOfferStatus,
  MentorPaymentStatus,
  MentorRequestStatus,
} from "@/generated/prisma/enums";

export class MarketplaceValidationError extends Error {}
export class MarketplaceStateError extends Error {}

export const MIN_PRICE_PER_SESSION_VND = 1_000;
export const MAX_PRICE_PER_SESSION_VND = 5_000_000;
export const MAX_SESSIONS = 50;
export const MAX_BUDGET_HINT_VND = 100_000_000;

type RequestInput = Readonly<{
  title: string;
  description: string;
  preferredSessions: number;
  budgetHintVnd?: number | null;
}>;

/** Validate and normalise a student's request-for-mentor input. Throws on bad input. */
export function validateRequestInput(input: RequestInput): {
  title: string;
  description: string;
  preferredSessions: number;
  budgetHintVnd: number | null;
} {
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 4 || title.length > 160) {
    throw new MarketplaceValidationError("Tiêu đề yêu cầu phải từ 4 đến 160 ký tự.");
  }
  if (description.length < 10 || description.length > 4_000) {
    throw new MarketplaceValidationError("Mô tả yêu cầu phải từ 10 đến 4000 ký tự.");
  }
  if (
    !Number.isInteger(input.preferredSessions) ||
    input.preferredSessions < 1 ||
    input.preferredSessions > MAX_SESSIONS
  ) {
    throw new MarketplaceValidationError("Số buổi mong muốn không hợp lệ.");
  }
  const budgetHintVnd =
    input.budgetHintVnd === undefined || input.budgetHintVnd === null
      ? null
      : input.budgetHintVnd;
  if (
    budgetHintVnd !== null &&
    (!Number.isInteger(budgetHintVnd) ||
      budgetHintVnd < 0 ||
      budgetHintVnd > MAX_BUDGET_HINT_VND)
  ) {
    throw new MarketplaceValidationError("Ngân sách tham khảo không hợp lệ.");
  }
  return { title, description, preferredSessions: input.preferredSessions, budgetHintVnd };
}

type OfferInput = Readonly<{
  pricePerSessionVnd: number;
  message: string;
}>;

/** Validate and normalise a mentor's offer input. Throws on bad input. */
export function validateOfferInput(input: OfferInput): {
  pricePerSessionVnd: number;
  message: string;
} {
  const message = input.message.trim();
  if (
    !Number.isInteger(input.pricePerSessionVnd) ||
    input.pricePerSessionVnd < MIN_PRICE_PER_SESSION_VND ||
    input.pricePerSessionVnd > MAX_PRICE_PER_SESSION_VND
  ) {
    throw new MarketplaceValidationError("Mức giá đề xuất không hợp lệ.");
  }
  if (message.length < 5 || message.length > 2_000) {
    throw new MarketplaceValidationError("Lời nhắn đề xuất phải từ 5 đến 2000 ký tự.");
  }
  return { pricePerSessionVnd: input.pricePerSessionVnd, message };
}

/** A mentor may only submit an offer while the request is still open. */
export function assertRequestAcceptsOffers(status: MentorRequestStatus): void {
  if (status !== "OPEN") {
    throw new MarketplaceStateError("Yêu cầu này không còn nhận đề xuất.");
  }
}

/** A mentor cannot bid on their own request. */
export function assertNotSelfOffer(requestStudentUserId: string, mentorUserId: string): void {
  if (requestStudentUserId === mentorUserId) {
    throw new MarketplaceStateError("Bạn không thể gửi đề xuất cho yêu cầu của chính mình.");
  }
}

/** Accepting an offer requires an open request and a pending offer belonging to it. */
export function assertOfferAcceptable(
  requestStatus: MentorRequestStatus,
  offerStatus: MentorOfferStatus,
): void {
  if (requestStatus !== "OPEN") {
    throw new MarketplaceStateError("Yêu cầu này đã được xử lý.");
  }
  if (offerStatus !== "PENDING") {
    throw new MarketplaceStateError("Đề xuất này không còn hiệu lực.");
  }
}

/** An offer can only be withdrawn while still pending. */
export function assertOfferWithdrawable(offerStatus: MentorOfferStatus): void {
  if (offerStatus !== "PENDING") {
    throw new MarketplaceStateError("Chỉ có thể rút đề xuất khi đang chờ phản hồi.");
  }
}

/** A request can only be cancelled while still open. */
export function assertRequestCancellable(status: MentorRequestStatus): void {
  if (status !== "OPEN") {
    throw new MarketplaceStateError("Chỉ có thể hủy yêu cầu khi đang mở.");
  }
}

const paymentTransitions: Record<MentorPaymentStatus, readonly MentorPaymentStatus[]> = {
  PENDING: ["PAID", "WAIVED"],
  PAID: [],
  WAIVED: [],
};

/** Validate a payment-status change on a settled engagement. */
export function assertPaymentTransition(
  from: MentorPaymentStatus,
  to: MentorPaymentStatus,
): void {
  if (!paymentTransitions[from].includes(to)) {
    throw new MarketplaceStateError("Không thể thay đổi trạng thái thanh toán này.");
  }
}

/** Total agreed amount for an engagement. */
export function totalAmountVnd(pricePerSessionVnd: number, sessions: number): number {
  return pricePerSessionVnd * sessions;
}
