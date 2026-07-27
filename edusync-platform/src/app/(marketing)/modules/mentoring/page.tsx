import type { Metadata } from "next";
import { ModulePageLayout, type ModulePageContent } from "@/components/marketing/ModulePageLayout";
import { MentorIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Cố vấn & Gia sư",
  description:
    "Thị trường cố vấn học tập có kiểm soát: mentor được xác minh, phụ huynh xác nhận đồng ý, thanh toán minh bạch.",
};

const content: ModulePageContent = {
  key: "mentoring",
  eyebrow: "Mô-đun Cố vấn",
  heroTitle: "Cố vấn học tập an toàn, có xác minh và minh bạch",
  heroDescription:
    "Thay vì để học sinh tự tìm gia sư qua mạng xã hội, EduSync tạo ra một thị trường cố vấn khép kín do nhà trường quản lý — nơi mọi mentor đều được xác minh, mọi buổi học đều có sự đồng ý của phụ huynh.",
  problemTitle: "Vấn đề hiện tại",
  problemPoints: [
    "Học sinh liên hệ mentor qua Facebook, Zalo — không qua kiểm chứng thành tích hay lý lịch.",
    "Phụ huynh không biết con đang học với ai, học phí trả trực tiếp không có hóa đơn hay hồ sơ.",
    "Không có cơ chế xử lý khiếu nại, hoàn tiền hay đánh giá chất lượng buổi học.",
    "Nhà trường không thể giám sát hoặc bảo vệ học sinh khỏi rủi ro tiếp xúc không phù hợp.",
  ],
  workflow: [
    {
      title: "Nhà trường duyệt mentor",
      detail:
        "Anh chị khóa trên đăng ký làm mentor, cung cấp minh chứng thành tích; phòng đào tạo xét duyệt trước khi kích hoạt hồ sơ.",
    },
    {
      title: "Phụ huynh xác nhận đồng ý",
      detail:
        "Trước lượt đặt lịch đầu tiên, phụ huynh nhận yêu cầu xác nhận qua ứng dụng hoặc email, có thể thu hồi bất kỳ lúc nào.",
    },
    {
      title: "Đặt lịch & thanh toán trong hệ thống",
      detail:
        "Học sinh đặt buổi học theo khung giờ trống của mentor; thanh toán, hóa đơn và lịch sử được lưu trữ tập trung.",
    },
    {
      title: "Đánh giá & giám sát liên tục",
      detail:
        "Sau mỗi buổi học, học sinh và phụ huynh đánh giá chất lượng; đội ngũ vận hành theo dõi các chỉ số bất thường.",
    },
  ],
  features: [
    {
      title: "Xác minh mentor hai lớp",
      detail: "Kiểm tra minh chứng học tập và phỏng vấn trước khi mentor được kích hoạt.",
    },
    {
      title: "Đồng ý số của phụ huynh",
      detail: "Luồng xác nhận điện tử có thể thu hồi, lưu vết đầy đủ cho mục đích kiểm toán.",
    },
    {
      title: "Chat có kiểm duyệt",
      detail: "Toàn bộ trao đổi diễn ra trong nền tảng, được lọc từ khóa và có thể xem lại khi cần.",
    },
    {
      title: "Thanh toán & đối soát",
      detail: "Thu hộ học phí, giữ hoa hồng nền tảng, đối soát tự động cho mentor theo kỳ.",
    },
    {
      title: "Hồ sơ buổi học",
      detail: "Ghi nhận thời lượng, nội dung và đánh giá của từng buổi cố vấn.",
    },
    {
      title: "Cảnh báo bất thường",
      detail: "Hệ thống gắn cờ các mẫu hành vi bất thường để đội ngũ an toàn học đường xem xét.",
    },
  ],
  metrics: [
    { value: "100%", label: "Mentor được xác minh" },
    { value: "0", label: "Liên hệ ngoài nền tảng" },
    { value: "24h", label: "Thời gian xét duyệt hồ sơ mentor" },
  ],
};

export default function MentoringPage() {
  return <ModulePageLayout content={content} icon={MentorIcon} />;
}
