import type {
  MentorOfferStatus,
  MentorPaymentStatus,
  MentorRequestStatus,
} from "@/generated/prisma/enums";

type Tone = "brand" | "success" | "warning" | "danger" | "neutral";

export function formatVnd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Thỏa thuận";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMarketplaceDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

const requestStatusLabels: Record<MentorRequestStatus, string> = {
  OPEN: "Đang mở",
  MATCHED: "Đã ghép cố vấn",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã hủy",
};

const requestStatusTones: Record<MentorRequestStatus, Tone> = {
  OPEN: "success",
  MATCHED: "brand",
  CLOSED: "neutral",
  CANCELLED: "danger",
};

export function translateRequestStatus(status: MentorRequestStatus): {
  label: string;
  tone: Tone;
} {
  return { label: requestStatusLabels[status], tone: requestStatusTones[status] };
}

const offerStatusLabels: Record<MentorOfferStatus, string> = {
  PENDING: "Đang chờ phản hồi",
  ACCEPTED: "Đã được chọn",
  DECLINED: "Không được chọn",
  WITHDRAWN: "Đã rút",
};

const offerStatusTones: Record<MentorOfferStatus, Tone> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "neutral",
  WITHDRAWN: "neutral",
};

export function translateOfferStatus(status: MentorOfferStatus): {
  label: string;
  tone: Tone;
} {
  return { label: offerStatusLabels[status], tone: offerStatusTones[status] };
}

const paymentStatusLabels: Record<MentorPaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  WAIVED: "Miễn phí",
};

const paymentStatusTones: Record<MentorPaymentStatus, Tone> = {
  PENDING: "warning",
  PAID: "success",
  WAIVED: "neutral",
};

export function translatePaymentStatus(status: MentorPaymentStatus): {
  label: string;
  tone: Tone;
} {
  return { label: paymentStatusLabels[status], tone: paymentStatusTones[status] };
}

export const marketplaceResultMessages: Record<string, { tone: Tone; message: string }> = {
  requested: { tone: "success", message: "Đã đăng yêu cầu tìm cố vấn." },
  offered: { tone: "success", message: "Đã gửi đề xuất tới học sinh." },
  accepted: { tone: "success", message: "Đã chọn cố vấn và tạo thỏa thuận." },
  withdrawn: { tone: "neutral", message: "Đã rút đề xuất." },
  cancelled: { tone: "neutral", message: "Đã hủy yêu cầu." },
  paid: { tone: "success", message: "Đã cập nhật trạng thái thanh toán." },
};

export const marketplaceErrorMessages: Record<string, string> = {
  invalid: "Thông tin không hợp lệ. Vui lòng kiểm tra lại.",
  state: "Thao tác không còn hợp lệ với trạng thái hiện tại.",
  forbidden: "Bạn không có quyền thực hiện thao tác này.",
};
