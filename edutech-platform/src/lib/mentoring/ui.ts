import type { AppointmentStatus } from "@/lib/mentoring/appointment-domain";

export function translateAppointmentStatus(status: AppointmentStatus): string {
  return {
    REQUESTED: "Chờ duyệt",
    CONFIRMED: "Đã xác nhận",
    WAITLISTED: "Danh sách chờ",
    COMPLETED: "Đã hoàn tất",
    CANCELLED: "Đã hủy",
    DECLINED: "Đã từ chối",
  }[status];
}

export function appointmentTone(
  status: AppointmentStatus,
): "brand" | "success" | "warning" | "danger" | "neutral" {
  if (status === "CONFIRMED" || status === "COMPLETED") return "success";
  if (status === "REQUESTED" || status === "WAITLISTED") return "warning";
  if (status === "CANCELLED" || status === "DECLINED") return "danger";
  return "neutral";
}

export function formatMentoringDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  },
): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    ...options,
  }).format(date);
}

export function translateCaseStatus(status: "OPEN" | "ON_HOLD" | "CLOSED") {
  return {
    OPEN: "Đang mở",
    ON_HOLD: "Tạm giữ",
    CLOSED: "Đã đóng",
  }[status];
}
