import type { Metadata } from "next";
import { ModulePageLayout, type ModulePageContent } from "@/components/marketing/ModulePageLayout";
import { CalendarIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Lịch hẹn & Đơn từ (Appointments & Forms)",
  description:
    "Đặt lịch tư vấn với giáo viên và nộp đơn từ trực tuyến với luồng phê duyệt rõ ràng, theo dõi trạng thái theo thời gian thực.",
};

const content: ModulePageContent = {
  key: "appointments",
  eyebrow: "Mô-đun Appointments & Forms",
  heroTitle: "Đặt lịch và nộp đơn từ chỉ trong vài cú chạm",
  heroDescription:
    "Không còn tin nhắn cá nhân hay xếp hàng chờ trước phòng giáo viên. Học sinh xem giờ trống, đặt lịch hẹn và nộp đơn từ hoàn toàn trực tuyến, với trạng thái xử lý minh bạch theo thời gian thực.",
  problemTitle: "Vấn đề hiện tại",
  problemPoints: [
    "Học sinh phải nhắn tin riêng hoặc xếp hàng chờ để xin gặp giáo viên tư vấn.",
    "Đơn xin nghỉ học, đơn xác nhận, đơn khiếu nại đều xử lý bằng giấy hoặc email rời rạc.",
    "Không có cách nào để học sinh biết đơn của mình đang ở giai đoạn xử lý nào.",
    "Giáo viên mất nhiều thời gian quản lý lịch hẹn thủ công qua sổ tay hoặc bảng tính.",
  ],
  workflow: [
    {
      title: "Xem giờ trống theo thời gian thực",
      detail:
        "Giáo viên thiết lập khung giờ tư vấn khả dụng; học sinh xem và đặt lịch ngay lập tức, không trùng lặp.",
    },
    {
      title: "Nộp đơn theo biểu mẫu chuẩn",
      detail:
        "Mỗi loại đơn từ có biểu mẫu riêng do nhà trường cấu hình, đảm bảo đủ thông tin ngay từ đầu.",
    },
    {
      title: "Theo dõi trạng thái phê duyệt",
      detail:
        "Học sinh và phụ huynh nhận thông báo tức thời khi đơn được xem, phê duyệt hoặc cần bổ sung thông tin.",
    },
    {
      title: "Nhắc lịch tự động",
      detail:
        "Hệ thống gửi nhắc nhở qua email và thông báo đẩy trước mỗi lịch hẹn để giảm tỷ lệ vắng mặt.",
    },
  ],
  features: [
    {
      title: "Lịch trống thời gian thực",
      detail: "Đồng bộ khung giờ giáo viên, tránh đặt trùng và tự động khóa slot đã đặt.",
    },
    {
      title: "Biểu mẫu tùy biến",
      detail: "Nhà trường tự cấu hình các loại đơn từ theo nhu cầu riêng, không cần lập trình.",
    },
    {
      title: "Theo dõi trạng thái trực quan",
      detail: "Thanh tiến trình rõ ràng: đã nộp, đang xét duyệt, đã phê duyệt hoặc từ chối.",
    },
    {
      title: "Nhắc lịch đa kênh",
      detail: "Gửi nhắc nhở qua email, thông báo đẩy trên ứng dụng và tùy chọn SMS.",
    },
    {
      title: "Quản lý trên di động",
      detail: "Giáo viên duyệt đơn và quản lý lịch hẹn nhanh chóng ngay trên điện thoại.",
    },
    {
      title: "Lịch sử đầy đủ",
      detail: "Lưu trữ toàn bộ lịch hẹn và đơn từ đã xử lý để tra cứu khi cần thiết.",
    },
  ],
  metrics: [
    { value: "<1p", label: "Thời gian đặt lịch trung bình" },
    { value: "100%", label: "Đơn từ có trạng thái theo dõi" },
    { value: "-70%", label: "Giảm tỷ lệ vắng mặt lịch hẹn" },
  ],
};

export default function AppointmentsPage() {
  return <ModulePageLayout content={content} icon={CalendarIcon} />;
}