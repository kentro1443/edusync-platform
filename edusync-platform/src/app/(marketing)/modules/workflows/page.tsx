import type { Metadata } from "next";

import { ModulePageLayout, type ModulePageContent } from "@/components/marketing/ModulePageLayout";
import { WorkflowIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Quy trình số",
  description: "Thiết kế biểu mẫu và luồng phê duyệt nhiều cấp cho trường học, minh bạch thời hạn và lịch sử xử lý.",
};

const content: ModulePageContent = {
  key: "workflows",
  eyebrow: "Mô-đun Quy trình số",
  heroTitle: "Quy trình đi đúng người, đúng hạn và luôn tra cứu được",
  heroDescription: "EduSync chuyển các biểu mẫu giấy và chuỗi tin nhắn rời rạc thành quy trình số có điều kiện, người chịu trách nhiệm, thời hạn và lịch sử quyết định rõ ràng.",
  problemTitle: "Khi quy trình nằm trong giấy tờ và tin nhắn",
  problemPoints: [
    "Người nộp không biết hồ sơ đang ở bước nào hoặc ai đang xử lý.",
    "Mỗi phòng ban dùng một biểu mẫu khác nhau, khó kiểm soát phiên bản.",
    "Phê duyệt chậm nhưng không có cơ chế nhắc việc hoặc chuyển cấp.",
    "Lịch sử thay đổi và lý do từ chối không đủ để kiểm toán.",
  ],
  workflow: [
    { title: "Thiết kế biểu mẫu", detail: "Chọn trường dữ liệu, quy tắc bắt buộc và điều kiện hiển thị phù hợp với từng thủ tục." },
    { title: "Cấu hình luồng duyệt", detail: "Gán người duyệt theo vai trò, tuần tự hoặc song song, cùng thời hạn cho từng bước." },
    { title: "Nộp và theo dõi", detail: "Người dùng lưu nháp, đính kèm hồ sơ và theo dõi trạng thái ngay trong không gian trường." },
    { title: "Quyết định có lưu vết", detail: "Mọi phê duyệt, yêu cầu chỉnh sửa và từ chối đều có lý do, thời gian và người thực hiện." },
  ],
  features: [
    { title: "Thư viện biểu mẫu", detail: "Khởi tạo nhanh từ mẫu nghỉ phép, mượn phòng, đề xuất hoạt động và thủ tục nội bộ." },
    { title: "Điều kiện thông minh", detail: "Hiển thị trường dữ liệu và rẽ nhánh theo câu trả lời, vai trò hoặc đơn vị." },
    { title: "Phê duyệt nhiều cấp", detail: "Hỗ trợ bước tuần tự, song song, người thay thế và phạm vi theo trường." },
    { title: "Nhắc hạn tự động", detail: "Thông báo trước hạn, khi quá hạn và khi hồ sơ cần bổ sung thông tin." },
    { title: "Phiên bản bất biến", detail: "Hồ sơ đã nộp luôn gắn với đúng phiên bản biểu mẫu tại thời điểm gửi." },
    { title: "Nhật ký kiểm toán", detail: "Tra cứu đầy đủ thay đổi, quyết định và thời gian xử lý cho từng hồ sơ." },
  ],
  metrics: [
    { value: "24/7", label: "Theo dõi trạng thái" },
    { value: "100%", label: "Quyết định có lưu vết" },
    { value: "1 nơi", label: "Quản lý mọi biểu mẫu" },
  ],
};

export default function WorkflowsPage() {
  return <ModulePageLayout content={content} icon={WorkflowIcon} />;
}
