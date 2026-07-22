import type { Metadata } from "next";
import { ModulePageLayout, type ModulePageContent } from "@/components/marketing/ModulePageLayout";
import { BuildingIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "CLB, Sự kiện & Cơ sở vật chất",
  description:
    "Số hóa quy trình duyệt đơn mượn phòng, tổ chức sự kiện với luồng phê duyệt cấu hình được và đặt phòng theo thời gian thực.",
};

const content: ModulePageContent = {
  key: "clubs-events",
  eyebrow: "Mô-đun Clubs & Facilities",
  heroTitle: "Duyệt đơn CLB và sự kiện chỉ trong 24–48 giờ",
  heroDescription:
    "Thay thế quy trình xin chữ ký giấy qua bốn cấp bằng một luồng phê duyệt số hóa, cấu hình linh hoạt theo cơ cấu tổ chức của từng trường, kèm đặt phòng theo thời gian thực.",
  problemTitle: "Vấn đề hiện tại",
  problemPoints: [
    "Đơn xin mượn phòng, tổ chức sự kiện phải in giấy và xin chữ ký tuần tự qua nhiều cấp quản lý.",
    "Mất từ vài ngày đến hơn một tuần chỉ để hoàn tất phê duyệt cho một sự kiện nhỏ.",
    "Không có cách nào tra cứu lại lịch sử phê duyệt hoặc tình trạng phòng đã được đặt.",
    "Dễ xảy ra trùng lịch giữa các CLB do thiếu hệ thống theo dõi tập trung.",
  ],
  workflow: [
    {
      title: "Cấu hình luồng phê duyệt",
      detail:
        "Nhà trường thiết lập số cấp phê duyệt và người phụ trách từng cấp tùy theo loại sự kiện hoặc cơ sở vật chất.",
    },
    {
      title: "Ban chủ nhiệm CLB nộp đơn",
      detail:
        "Điền thông tin sự kiện, chọn phòng/hội trường mong muốn và thời gian, hệ thống tự kiểm tra trùng lịch.",
    },
    {
      title: "Phê duyệt tuần tự trực tuyến",
      detail:
        "Đơn được chuyển tự động qua từng cấp phê duyệt; mỗi người phụ trách nhận thông báo và xử lý trên thiết bị của mình.",
    },
    {
      title: "Xác nhận & lưu vết",
      detail:
        "Sau khi được duyệt, phòng tự động khóa lịch cho sự kiện; toàn bộ lịch sử được lưu trữ để tra cứu và kiểm toán.",
    },
  ],
  features: [
    {
      title: "Luồng phê duyệt tùy biến",
      detail: "Cấu hình số cấp và người phê duyệt theo loại sự kiện, không cần lập trình lại.",
    },
    {
      title: "Đặt phòng thời gian thực",
      detail: "Lịch cơ sở vật chất cập nhật tức thời, ngăn chặn trùng lịch giữa các CLB.",
    },
    {
      title: "Thông báo tự động",
      detail: "Người phê duyệt nhận cảnh báo ngay khi có đơn mới cần xử lý.",
    },
    {
      title: "Bảng điều khiển ban giám hiệu",
      detail: "Tổng quan toàn bộ đơn đang chờ, đã duyệt và bị từ chối trên một màn hình.",
    },
    {
      title: "Lưu vết đầy đủ",
      detail: "Mọi thao tác phê duyệt được ghi log với thời gian và người thực hiện.",
    },
    {
      title: "Mẫu đơn theo loại sự kiện",
      detail: "Biểu mẫu khác nhau cho sự kiện nội bộ, sự kiện có khách mời ngoài hoặc hoạt động ngoại khóa.",
    },
  ],
  metrics: [
    { value: "24–48h", label: "Thời gian duyệt đơn trung bình" },
    { value: "0", label: "Trùng lịch phòng/hội trường" },
    { value: "100%", label: "Lịch sử phê duyệt có thể tra cứu" },
  ],
};

export default function ClubsEventsPage() {
  return <ModulePageLayout content={content} icon={BuildingIcon} />;
}