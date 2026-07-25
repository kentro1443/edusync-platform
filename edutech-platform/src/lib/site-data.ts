export type ModuleKey =
  | "mentoring"
  | "resources"
  | "appointments"
  | "workflows"
  | "clubs-events";

export interface ModuleSummary {
  key: ModuleKey;
  href: string;
  name: string;
  tagline: string;
  description: string;
  icon: "mentor" | "book" | "calendar" | "workflow" | "building";
  outcomes: string[];
}

export const modules: ModuleSummary[] = [
  {
    key: "mentoring",
    href: "/modules/mentoring",
    name: "Cố vấn & Gia sư",
    tagline: "Chợ cố vấn ngang hàng: học sinh đăng nhu cầu, anh chị khóa trên đề xuất mức phí",
    description:
      "Một thị trường cố vấn có kiểm soát: học sinh đăng yêu cầu, anh chị khóa trên đã xác minh (SAT, IELTS, du học…) gửi đề xuất kèm mức phí, hai bên chốt thỏa thuận minh bạch — nhà trường duyệt mentor, mọi bước được ghi nhận.",
    icon: "mentor",
    outcomes: [
      "Mentor được xác minh thành tích (SAT/IELTS/du học) bởi nhà trường",
      "Học sinh đăng nhu cầu, mentor đấu giá bằng đề xuất mức phí",
      "Thỏa thuận và trạng thái thanh toán minh bạch trong hệ thống",
      "Chứng nhận đóng góp cộng đồng từ Ban Liên chi Đoàn cho mentor",
    ],
  },
  {
    key: "resources",
    href: "/modules/resources",
    name: "Kho tài liệu",
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
    name: "Lịch hẹn & Đơn từ",
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
    key: "workflows",
    href: "/modules/workflows",
    name: "Quy trình số",
    tagline: "Thiết kế biểu mẫu và luồng phê duyệt không cần viết mã",
    description:
      "Chuẩn hóa đơn từ nội bộ bằng biểu mẫu có điều kiện, thời hạn xử lý và luồng phê duyệt nhiều cấp được cấu hình theo từng trường.",
    icon: "workflow",
    outcomes: [
      "Tạo biểu mẫu từ thư viện trường dữ liệu kiểm soát",
      "Phê duyệt tuần tự hoặc song song theo vai trò",
      "Theo dõi thời hạn, nhắc việc và lý do quyết định",
      "Lưu vết đầy đủ mọi phiên bản và thao tác",
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
  {
    href: "/modules/mentoring",
    label: "Sản phẩm",
    children: modules,
  },
  { href: "/solutions", label: "Giải pháp" },
  { href: "/security", label: "Bảo mật & An toàn" },
  { href: "/pricing", label: "Bảng giá" },
  { href: "/case-studies", label: "Câu chuyện khách hàng" },
  { href: "/help", label: "Trợ giúp" },
];

export const footerLinks = {
  product: [
    { href: "/modules/mentoring", label: "Cố vấn & Gia sư" },
    { href: "/modules/resources", label: "Kho tài liệu" },
    { href: "/modules/appointments", label: "Lịch hẹn & Đơn từ" },
    { href: "/modules/workflows", label: "Quy trình số" },
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
