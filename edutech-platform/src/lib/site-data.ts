export type ModuleKey =
  | "mentoring"
  | "resources"
  | "appointments"
  | "clubs-events";

export interface ModuleSummary {
  key: ModuleKey;
  href: string;
  name: string;
  tagline: string;
  description: string;
  icon: "mentor" | "book" | "calendar" | "building";
  outcomes: string[];
}

export const modules: ModuleSummary[] = [
  {
    key: "mentoring",
    href: "/modules/mentoring",
    name: "Cố vấn & Gia sư (Mentoring)",
    tagline: "Kết nối học sinh với anh chị khóa trên đã được xác minh",
    description:
      "Một thị trường cố vấn có kiểm soát: nhà trường duyệt mentor, phụ huynh xác nhận đồng ý, thanh toán và lịch sử buổi học minh bạch qua nền tảng.",
    icon: "mentor",
    outcomes: [
      "Mentor được xác minh thành tích và lý lịch bởi nhà trường",
      "Phụ huynh xác nhận đồng ý trước mỗi lượt đặt lịch",
      "Thanh toán, hoàn tiền và đối soát minh bạch trong hệ thống",
      "Chat có kiểm duyệt, không liên hệ ngoài nền tảng",
    ],
  },
  {
    key: "resources",
    href: "/modules/resources",
    name: "Kho tài liệu (Resource Library)",
    tagline: "Đề thi, tài liệu ôn tập được kiểm chứng nguồn gốc",
    description:
      "Kho tài liệu tập trung theo môn học, khối lớp và năm học, có quy trình kiểm duyệt và huy hiệu nguồn xác thực để học sinh yên tâm sử dụng.",
    icon: "book",
    outcomes: [
      "Tìm kiếm theo môn, khối, kỳ thi và năm học",
      "Huy hiệu 'nguồn xác thực' sau khi được duyệt",
      "Báo cáo tài liệu lỗi thời hoặc sai sót",
      "Phân quyền truy cập theo trường hoặc khối lớp",
    ],
  },
  {
    key: "appointments",
    href: "/modules/appointments",
    name: "Lịch hẹn & Đơn từ (Appointments & Forms)",
    tagline: "Đặt lịch với thầy cô, nộp đơn từ hoàn toàn trực tuyến",
    description:
      "Học sinh chủ động đặt lịch tư vấn theo giờ trống của giáo viên và nộp các loại đơn cá nhân với luồng phê duyệt rõ ràng, có thời hạn xử lý.",
    icon: "calendar",
    outcomes: [
      "Xem giờ trống và đặt lịch hẹn theo thời gian thực",
      "Biểu mẫu đơn từ tùy biến theo từng trường",
      "Theo dõi trạng thái phê duyệt theo thời gian thực",
      "Nhắc lịch tự động qua email và thông báo đẩy",
    ],
  },
  {
    key: "clubs-events",
    href: "/modules/clubs-events",
    name: "CLB, Sự kiện & Cơ sở vật chất",
    tagline: "Số hóa quy trình duyệt đơn mượn phòng và tổ chức sự kiện",
    description:
      "Thay thế quy trình xin chữ ký 4 cấp bằng luồng phê duyệt cấu hình được, đặt phòng theo thời gian thực và toàn bộ lịch sử minh bạch.",
    icon: "building",
    outcomes: [
      "Luồng phê duyệt nhiều cấp có thể tùy chỉnh theo trường",
      "Đặt phòng, hội trường theo thời gian thực, tránh trùng lịch",
      "Rút ngắn thời gian duyệt đơn xuống còn 24–48 giờ",
      "Toàn bộ lịch sử duyệt đơn được lưu vết đầy đủ",
    ],
  },
];

export interface RoleBenefit {
  role: string;
  benefit: string;
}

export const roleBenefits: RoleBenefit[] = [
  {
    role: "Học sinh",
    benefit: "Tiếp cận mentor, tài liệu và đặt lịch hẹn minh bạch, mọi lúc.",
  },
  {
    role: "Phụ huynh",
    benefit: "Xác nhận đồng ý và theo dõi hoạt động cố vấn của con em.",
  },
  {
    role: "Anh chị Mentor",
    benefit: "Thu nhập minh bạch và chứng nhận đóng góp cộng đồng.",
  },
  {
    role: "Giáo viên",
    benefit: "Quản lý lịch hẹn và duyệt đơn nhanh chóng trên di động.",
  },
  {
    role: "Ban chủ nhiệm CLB",
    benefit: "Số hóa 100% quy trình xin phê duyệt sự kiện và cơ sở vật chất.",
  },
  {
    role: "Phòng hành chính & Ban giám hiệu",
    benefit: "Một dashboard tập trung, minh bạch và có thể kiểm toán.",
  },
];

export const primaryNav = [
  { href: "/", label: "Trang chủ" },
  {
    href: "/modules/mentoring",
    label: "Sản phẩm",
    children: modules,
  },
  { href: "/security", label: "Bảo mật & An toàn" },
  { href: "/pricing", label: "Bảng giá" },
  { href: "/case-studies", label: "Trường hợp triển khai" },
  { href: "/help", label: "Trợ giúp" },
];

export const footerLinks = {
  product: [
    { href: "/modules/mentoring", label: "Cố vấn & Gia sư" },
    { href: "/modules/resources", label: "Kho tài liệu" },
    { href: "/modules/appointments", label: "Lịch hẹn & Đơn từ" },
    { href: "/modules/clubs-events", label: "CLB & Sự kiện" },
  ],
  company: [
    { href: "/case-studies", label: "Trường hợp triển khai" },
    { href: "/pricing", label: "Bảng giá" },
    { href: "/security", label: "Bảo mật & An toàn" },
  ],
  support: [
    { href: "/help", label: "Trung tâm trợ giúp" },
    { href: "/demo", label: "Yêu cầu demo" },
    { href: "/login", label: "Đăng nhập" },
  ],
};