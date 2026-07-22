import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  MentorIcon,
  BookIcon,
  CalendarIcon,
  BuildingIcon,
  CheckIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Bảng điều khiển",
};

const summary = [
  {
    icon: MentorIcon,
    label: "Buổi cố vấn tuần này",
    value: "48",
    tone: "brand" as const,
  },
  {
    icon: BookIcon,
    label: "Tài liệu chờ kiểm duyệt",
    value: "12",
    tone: "warning" as const,
  },
  {
    icon: CalendarIcon,
    label: "Lịch hẹn hôm nay",
    value: "23",
    tone: "success" as const,
  },
  {
    icon: BuildingIcon,
    label: "Đơn CLB đang chờ duyệt",
    value: "6",
    tone: "danger" as const,
  },
];

const activity = [
  {
    text: "Mentor Trần Minh Anh vừa hoàn thành xác minh hồ sơ.",
    time: "10 phút trước",
  },
  {
    text: "Đơn xin tổ chức 'Ngày hội STEM' đã được duyệt cấp 1/2.",
    time: "45 phút trước",
  },
  {
    text: "3 tài liệu mới được đóng góp cho môn Hóa học lớp 12.",
    time: "2 giờ trước",
  },
  {
    text: "Phụ huynh Nguyễn Thị Lan đã xác nhận đồng ý cho buổi cố vấn mới.",
    time: "3 giờ trước",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink-900)]">
          Chào mừng trở lại
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          Tổng quan hoạt động của trường trong 7 ngày qua.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
                <s.icon width={20} height={20} />
              </span>
              <Badge tone={s.tone}>Live</Badge>
            </div>
            <p className="mt-4 text-3xl font-bold text-[var(--color-ink-900)]">
              {s.value}
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="font-semibold text-[var(--color-ink-900)]">
            Hoạt động gần đây
          </h2>
          <ul className="mt-5 space-y-4">
            {activity.map((a) => (
              <li key={a.text} className="flex gap-3 text-sm">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-50)] text-[var(--color-success-600)]">
                  <CheckIcon width={14} height={14} />
                </span>
                <div>
                  <p className="text-[var(--color-ink-700)]">{a.text}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-400)]">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold text-[var(--color-ink-900)]">
            Cần xử lý
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-[var(--color-ink-600)]">
            <li className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-warning-50)] px-3 py-2.5">
              <span>5 hồ sơ mentor mới cần duyệt</span>
              <Badge tone="warning">Ưu tiên</Badge>
            </li>
            <li className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2.5">
              <span>12 tài liệu chờ kiểm duyệt</span>
              <Badge tone="neutral">Bình thường</Badge>
            </li>
            <li className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-danger-50)] px-3 py-2.5">
              <span>2 báo cáo an toàn cần xem xét</span>
              <Badge tone="danger">Khẩn cấp</Badge>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}