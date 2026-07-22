import type { Metadata } from "next";
import { ModulePageLayout, type ModulePageContent } from "@/components/marketing/ModulePageLayout";
import { BookIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Kho tài liệu (Resource Library)",
  description:
    "Kho đề thi và tài liệu ôn tập được kiểm chứng nguồn gốc, phân loại theo môn học, khối lớp và năm học.",
};

const content: ModulePageContent = {
  key: "resources",
  eyebrow: "Mô-đun Resource Library",
  heroTitle: "Tài liệu ôn thi đáng tin cậy, dễ tìm kiếm",
  heroDescription:
    "Chấm dứt tình trạng đề thi trôi nổi trong các nhóm chat. LiênKếtHọc tổ chức toàn bộ tài liệu ôn tập theo môn học, khối lớp và năm học, với quy trình kiểm duyệt rõ ràng trước khi công bố.",
  problemTitle: "Vấn đề hiện tại",
  problemPoints: [
    "Tài liệu chia sẻ rời rạc qua nhiều nhóm Zalo/Facebook, không có phiên bản chuẩn.",
    "Không rõ nguồn gốc, dễ chứa lỗi sai hoặc đề thi đã lỗi thời qua nhiều năm.",
    "Học sinh mất nhiều thời gian tìm kiếm tài liệu đúng môn, đúng khối lớp.",
    "Nhà trường không có cách nào kiểm soát chất lượng tài liệu đang lưu hành.",
  ],
  workflow: [
    {
      title: "Đóng góp tài liệu",
      detail:
        "Giáo viên, mentor hoặc học sinh tải lên tài liệu kèm thông tin môn học, khối lớp, năm học và nguồn gốc.",
    },
    {
      title: "Kiểm duyệt nội dung",
      detail:
        "Đội ngũ chuyên môn của trường xét duyệt độ chính xác trước khi tài liệu được công khai trên kho.",
    },
    {
      title: "Gắn huy hiệu xác thực",
      detail:
        "Tài liệu đạt chuẩn được gắn nhãn 'nguồn xác thực', giúp học sinh yên tâm sử dụng để ôn tập.",
    },
    {
      title: "Phản hồi & cập nhật",
      detail:
        "Học sinh có thể báo cáo tài liệu lỗi thời hoặc sai sót; đội ngũ kiểm duyệt cập nhật hoặc gỡ bỏ kịp thời.",
    },
  ],
  features: [
    {
      title: "Tìm kiếm nâng cao",
      detail: "Lọc theo môn học, khối lớp, loại tài liệu, kỳ thi và năm học chỉ trong vài giây.",
    },
    {
      title: "Huy hiệu nguồn xác thực",
      detail: "Phân biệt rõ ràng tài liệu đã qua kiểm duyệt và tài liệu đang chờ xét duyệt.",
    },
    {
      title: "Báo cáo tài liệu lỗi",
      detail: "Học sinh dễ dàng gắn cờ tài liệu có vấn đề để đội ngũ xử lý nhanh chóng.",
    },
    {
      title: "Phân quyền theo trường/khối",
      detail: "Kiểm soát tài liệu nội bộ chỉ hiển thị cho đúng đối tượng học sinh liên quan.",
    },
    {
      title: "Xem trước không cần tải về",
      detail: "Xem nhanh nội dung tài liệu ngay trên trình duyệt trước khi quyết định tải xuống.",
    },
    {
      title: "Thống kê sử dụng",
      detail: "Nhà trường theo dõi tài liệu được truy cập nhiều nhất để định hướng bổ sung nội dung.",
    },
  ],
  metrics: [
    { value: "100%", label: "Tài liệu qua kiểm duyệt" },
    { value: "<5s", label: "Thời gian tìm kiếm trung bình" },
    { value: "1 nơi", label: "Kho tài liệu tập trung toàn trường" },
  ],
};

export default function ResourcesPage() {
  return <ModulePageLayout content={content} icon={BookIcon} />;
}