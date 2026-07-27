import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng | EduSync",
  description:
    "Hướng dẫn theo vai trò và quy trình vận hành toàn bộ nền tảng EduSync.",
};

const roles = [
  [
    "Quản trị nền tảng",
    "Khởi tạo, tạm dừng và khôi phục không gian trường.",
    "Danh mục trường",
  ],
  [
    "Quản trị trường",
    "Thành viên, phân quyền, cấu hình, báo cáo và kiểm toán.",
    "Toàn trường",
  ],
  [
    "Giáo viên / nhân viên",
    "Học liệu, lịch, quy trình, tin nhắn và hoạt động.",
    "Theo quyền được cấp",
  ],
  [
    "Cố vấn",
    "Hồ sơ cố vấn, lịch rảnh, lịch hẹn, ca hỗ trợ và đề xuất.",
    "Học sinh được phân công",
  ],
  [
    "Học sinh",
    "Học liệu, lịch, đơn từ, CLB, cố vấn và giao tiếp cá nhân.",
    "Dữ liệu của mình",
  ],
  [
    "Phụ huynh",
    "Theo dõi dữ liệu được phép của học sinh đã liên kết.",
    "Học sinh liên kết",
  ],
  [
    "Trưởng CLB",
    "Thành viên, sự kiện, công việc, thông báo và ngân sách CLB.",
    "CLB được quản lý",
  ],
  [
    "Người phê duyệt",
    "Hàng đợi duyệt, yêu cầu chỉnh sửa và lịch sử quyết định.",
    "Bước được giao",
  ],
  [
    "Quản trị đa trường",
    "Chọn trường đang làm việc và giữ dữ liệu tách biệt.",
    "Một trường mỗi phiên",
  ],
] as const;

const modules = [
  {
    id: "mentoring",
    title: "Cố vấn & chợ cố vấn",
    route: "/dashboard/mentoring",
    audience: "Học sinh · Cố vấn · Phụ huynh · Quản trị",
    purpose:
      "Quản lý hồ sơ cố vấn, lịch rảnh, ca hỗ trợ riêng tư, đặt lịch và giao dịch cố vấn ngang hàng.",
    steps: [
      "Cố vấn hoàn thiện hồ sơ, chuyên môn và bật trạng thái nhận yêu cầu.",
      "Học sinh tìm trong danh bạ hoặc đăng nhu cầu tại Chợ cố vấn.",
      "Cố vấn gửi đề xuất gồm lộ trình, số buổi và mức phí.",
      "Học sinh chọn đề xuất; hai bên theo dõi thỏa thuận và thanh toán.",
      "Với ca hỗ trợ, chỉ ghi chú có mức hiển thị phù hợp mới đến học sinh hoặc phụ huynh.",
    ],
    control:
      "Ghi chú riêng của cố vấn không hiển thị cho học sinh, phụ huynh hoặc quản trị ngoài phạm vi.",
  },
  {
    id: "resources",
    title: "Kho tài liệu",
    route: "/dashboard/resources",
    audience: "Tác giả · Người duyệt · Người đọc",
    purpose:
      "Soạn, phân loại, duyệt, xuất bản và theo dõi phiên bản học liệu trong đúng phạm vi trường.",
    steps: [
      "Chọn Tạo tài nguyên, nhập tiêu đề, tóm tắt, nội dung và tệp hợp lệ.",
      "Lưu bản nháp rồi gửi duyệt; người có quyền chọn duyệt hoặc yêu cầu sửa.",
      "Sau khi xuất bản, người đọc có thể tìm, lọc, lưu, bình luận hoặc báo cáo.",
      "Khi cập nhật, tạo phiên bản mới; phiên bản cũ vẫn bất biến để truy vết.",
      "Dùng khôi phục phiên bản khi cần quay lại nội dung trước mà không xóa lịch sử.",
    ],
    control:
      "Tệp riêng được kiểm tra quyền tại thời điểm tải; không chia sẻ đường dẫn lưu trữ trực tiếp.",
  },
  {
    id: "calendar",
    title: "Lịch, đặt chỗ & lịch hẹn",
    route: "/dashboard/calendar",
    audience: "Mọi vai trò trường",
    purpose:
      "Điều phối lịch trường, sự kiện lặp, phòng/tài nguyên, giữ chỗ, danh sách chờ và lịch cố vấn.",
    steps: [
      "Chọn chế độ ngày, tuần hoặc tháng và di chuyển đến đúng mốc thời gian.",
      "Tạo sự kiện với thời gian, địa điểm, sức chứa và tài nguyên nếu cần.",
      "Hệ thống chặn sự kiện trùng người, phòng hoặc khung giờ đã khóa.",
      "Người dùng đăng ký; khi đủ chỗ, yêu cầu tiếp theo vào danh sách chờ.",
      "Khi một chỗ bị hủy, người đầu danh sách chờ được tự động đôn và nhận thông báo.",
      "Xuất iCalendar khi cần đồng bộ với công cụ lịch bên ngoài.",
    ],
    control:
      "Lịch hẹn cố vấn có vòng đời yêu cầu, duyệt, điểm danh, hoàn tất hoặc hủy và lưu toàn bộ chuyển trạng thái.",
  },
  {
    id: "workflows",
    title: "Quy trình số",
    route: "/dashboard/workflows",
    audience: "Người nộp · Người duyệt · Quản trị",
    purpose:
      "Số hóa đơn từ bằng biểu mẫu no-code, các bước tuần tự/song song, điều kiện và hạn xử lý.",
    steps: [
      "Quản trị tạo mẫu, trường dữ liệu và các bước duyệt; kiểm tra rồi xuất bản phiên bản.",
      "Người dùng mở mẫu đã xuất bản, lưu nháp và gửi hồ sơ.",
      "Người duyệt xử lý bước được giao: duyệt, từ chối hoặc yêu cầu chỉnh sửa.",
      "Người nộp sửa hồ sơ bị trả về và gửi lại; bình luận/tệp đính kèm đi cùng hồ sơ.",
      "Theo dõi dòng thời gian để biết ai đã thực hiện thao tác nào và phiên bản mẫu nào được dùng.",
    ],
    control:
      "Hồ sơ đã nộp giữ nguyên phiên bản mẫu lịch sử; thay đổi mẫu mới không làm biến dạng hồ sơ cũ.",
  },
  {
    id: "clubs",
    title: "CLB & sự kiện",
    route: "/dashboard/clubs-events",
    audience: "Học sinh · Trưởng CLB · Quản trị",
    purpose:
      "Vận hành thành viên, đơn tham gia, sự kiện, an toàn, công việc, truyền thông và tài chính CLB.",
    steps: [
      "Tạo CLB, mô tả mục tiêu, sức chứa và trạng thái nhận đơn.",
      "Duyệt đơn tham gia và phân công trưởng CLB phù hợp.",
      "Lập đề xuất sự kiện; người có quyền duyệt trước khi mở đăng ký.",
      "Cập nhật kế hoạch an toàn, danh sách đăng ký và báo cáo sau sự kiện.",
      "Giao việc, đăng thông báo, lập ngân sách và ghi từng khoản chi.",
    ],
    control:
      "KPI đầu trang phản ánh thành viên, đơn chờ, sự kiện, tiến độ công việc và ngân sách còn lại.",
  },
  {
    id: "collaboration",
    title: "Tin nhắn & thông báo",
    route: "/dashboard/messages",
    audience: "Mọi thành viên trường",
    purpose:
      "Trao đổi theo cuộc hội thoại, gửi tệp đúng phạm vi và nhận thông báo có cấu hình.",
    steps: [
      "Mở Tin nhắn, chọn cuộc hội thoại hoặc tạo cuộc trao đổi được phép.",
      "Gửi nội dung và tệp; chỉ người tham gia mới đọc được luồng và tệp đính kèm.",
      "Theo dõi chuông thông báo hoặc trang Thông báo để xử lý việc mới.",
      "Đánh dấu đã đọc và điều chỉnh loại thông báo/kênh nhận theo nhu cầu.",
    ],
    control:
      "Thông báo dùng khóa chống trùng; tải tệp luôn kiểm tra tư cách người tham gia.",
  },
  {
    id: "administration",
    title: "Quản trị, báo cáo & kiểm toán",
    route: "/dashboard/reports",
    audience: "Quản trị trường · Quản trị nền tảng",
    purpose:
      "Quản lý thành viên, tenant, chỉ số vận hành, tìm kiếm và bằng chứng kiểm toán.",
    steps: [
      "Mời thành viên, gán nhiều vai trò và tạm dừng tư cách khi cần.",
      "Cấu hình thông tin trường; với đa trường, luôn kiểm tra trường đang hoạt động.",
      "Dùng Báo cáo để xem KPI, bộ lọc và lưu góc nhìn thường dùng.",
      "Dùng Nhật ký kiểm toán để tra hành động và xuất dữ liệu phục vụ đối soát.",
      "Quản trị nền tảng khởi tạo, tạm dừng hoặc khôi phục trường trong Danh mục trường.",
    ],
    control:
      "Không tự gỡ vai trò quản trị cuối cùng; thao tác nền tảng cần kiểm tra đúng tenant trước khi xác nhận.",
  },
] as const;

const statuses = [
  [
    "Bản nháp",
    "Chỉ chủ sở hữu/người được cấp quyền thấy; vẫn có thể chỉnh sửa.",
  ],
  ["Chờ duyệt", "Đã gửi và đang đợi bước phê duyệt hiện tại."],
  ["Yêu cầu sửa", "Được trả về người nộp kèm lý do; cần sửa rồi gửi lại."],
  [
    "Đã duyệt / Đã xuất bản",
    "Đã qua kiểm soát và hiển thị cho đúng nhóm người dùng.",
  ],
  [
    "Danh sách chờ",
    "Chưa có chỗ; hệ thống giữ thứ tự và tự động đôn khi có chỗ.",
  ],
  ["Tạm dừng", "Không còn quyền hoạt động nhưng lịch sử vẫn được giữ."],
] as const;

export default function ManualPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Trung tâm vận hành"
        title="Hướng dẫn sử dụng EduSync"
        description="Tài liệu thực hành theo vai trò, bao phủ các luồng chính từ đăng nhập, cộng tác, phê duyệt đến kiểm toán. Nội dung bám đúng quyền và trạng thái đang dùng trong hệ thống."
      />

      <section className="grid gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card className="overflow-hidden p-0">
          <div className="bg-[linear-gradient(135deg,var(--color-brand-900),var(--color-brand-700))] px-6 py-7 text-white">
            <Badge tone="neutral" className="bg-white/15 text-white">
              Bắt đầu trong 5 phút
            </Badge>
            <ol className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                "Đăng nhập bằng tài khoản được cấp.",
                "Nếu có nhiều trường, chọn đúng trường làm việc.",
                "Kiểm tra vai trò và việc cần ưu tiên ở Tổng quan.",
                "Mở mô-đun từ thanh bên hoặc dùng ⌘/Ctrl + K.",
                "Xử lý việc rồi kiểm tra thông báo và lịch sử.",
              ].map((step, index) => (
                <li
                  key={step}
                  className="flex gap-3 text-sm leading-6 text-white/85"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-ink-400)]">
            Điều hướng nhanh
          </p>
          <nav
            aria-label="Mục lục hướng dẫn"
            className="mt-3 grid grid-cols-2 gap-2"
          >
            {[
              ["#roles", "Vai trò"],
              ["#modules", "Mô-đun"],
              ["#statuses", "Trạng thái"],
              ["#security", "Bảo mật"],
              ["#troubleshooting", "Xử lý lỗi"],
              ["#shortcuts", "Phím tắt"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-[var(--radius-sm)] border border-[var(--color-ink-200)] px-3 py-2 text-sm font-semibold text-[var(--color-ink-700)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)]"
              >
                {label}
              </a>
            ))}
          </nav>
        </Card>
      </section>

      <section id="roles" className="scroll-mt-24 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand-700)]">
            Phân quyền
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--color-ink-900)]">
            Vai trò và phạm vi
          </h2>
          <p className="mt-2 text-sm text-[var(--color-ink-500)]">
            Một người có thể có nhiều vai trò. Giao diện chỉ hiện chức năng mà
            tổ hợp vai trò hiện tại được phép dùng.
          </p>
        </div>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead className="bg-[var(--color-ink-50)] text-xs uppercase tracking-[0.1em] text-[var(--color-ink-500)]">
              <tr>
                <th className="px-5 py-3">Vai trò</th>
                <th className="px-5 py-3">Công việc chính</th>
                <th className="px-5 py-3">Phạm vi dữ liệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink-100)]">
              {roles.map(([role, work, scope]) => (
                <tr key={role}>
                  <th className="px-5 py-3 font-bold text-[var(--color-ink-900)]">
                    {role}
                  </th>
                  <td className="px-5 py-3 text-[var(--color-ink-600)]">
                    {work}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-ink-600)]">
                    {scope}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section id="modules" className="scroll-mt-24 space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand-700)]">
            Quy trình thực hành
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--color-ink-900)]">
            Hướng dẫn theo mô-đun
          </h2>
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-2">
          {modules.map((module, index) => (
            <Card key={module.id} id={module.id} className="scroll-mt-24">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-[var(--color-brand-700)]">
                    MÔ-ĐUN {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-[var(--color-ink-900)]">
                    {module.title}
                  </h2>
                </div>
                <Link
                  href={module.route}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-brand-200)] px-3 py-2 text-xs font-bold text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]"
                >
                  Mở mô-đun
                </Link>
              </div>
              <p className="mt-3 text-xs font-semibold text-[var(--color-ink-500)]">
                {module.audience}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-600)]">
                {module.purpose}
              </p>
              <ol className="mt-4 space-y-3">
                {module.steps.map((step, stepIndex) => (
                  <li
                    key={step}
                    className="flex gap-3 text-sm leading-6 text-[var(--color-ink-700)]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-800)]">
                      {stepIndex + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-warning-200)] bg-[var(--color-warning-50)] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-warning-900)]">
                  Điểm kiểm soát
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--color-warning-900)]">
                  {module.control}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid items-start gap-5 lg:grid-cols-2">
        <Card id="statuses" className="scroll-mt-24">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand-700)]">
            Thuật ngữ
          </p>
          <h2 className="mt-1 text-xl font-bold text-[var(--color-ink-900)]">
            Trạng thái thường gặp
          </h2>
          <dl className="mt-4 divide-y divide-[var(--color-ink-100)]">
            {statuses.map(([status, meaning]) => (
              <div
                key={status}
                className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]"
              >
                <dt className="font-bold text-[var(--color-ink-900)]">
                  {status}
                </dt>
                <dd className="text-sm leading-6 text-[var(--color-ink-600)]">
                  {meaning}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="space-y-5">
          <Card id="security" className="scroll-mt-24">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand-700)]">
              Tài khoản
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--color-ink-900)]">
              Bảo mật và phiên đăng nhập
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--color-ink-600)]">
              <li>
                • Không dùng chung tài khoản hoặc gửi mật khẩu qua tin nhắn.
              </li>
              <li>
                • Đổi mật khẩu ngay khi hệ thống yêu cầu ở lần đăng nhập đầu.
              </li>
              <li>
                • Mở Bảo mật để xem và thu hồi phiên đăng nhập không nhận ra.
              </li>
              <li>
                • Liên kết đặt lại mật khẩu và lời mời chỉ dùng một lần, có thời
                hạn.
              </li>
              <li>
                • Với tài khoản đa trường, kiểm tra tên trường trên đầu trang
                trước khi thao tác.
              </li>
            </ul>
            <Link
              href="/dashboard/security"
              className="mt-4 inline-flex text-sm font-bold text-[var(--color-brand-700)] hover:underline"
            >
              Mở cài đặt bảo mật →
            </Link>
          </Card>

          <Card id="shortcuts" className="scroll-mt-24">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand-700)]">
              Năng suất
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--color-ink-900)]">
              Điều hướng và phím tắt
            </h2>
            <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm">
              <dt>
                <kbd className="rounded border px-2 py-1">⌘ / Ctrl + K</kbd>
              </dt>
              <dd className="text-[var(--color-ink-600)]">
                Mở tìm kiếm trong ứng dụng.
              </dd>
              <dt>
                <kbd className="rounded border px-2 py-1">Esc</kbd>
              </dt>
              <dd className="text-[var(--color-ink-600)]">
                Đóng menu hoặc hộp thoại đang mở.
              </dd>
              <dt>Thanh bên</dt>
              <dd className="text-[var(--color-ink-600)]">
                Thu gọn trên desktop; dùng menu trên di động.
              </dd>
              <dt>Chuông</dt>
              <dd className="text-[var(--color-ink-600)]">
                Xem nhanh thông báo chưa đọc.
              </dd>
            </dl>
          </Card>
        </div>
      </section>

      <Card id="troubleshooting" className="scroll-mt-24">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand-700)]">
          Tự xử lý
        </p>
        <h2 className="mt-1 text-xl font-bold text-[var(--color-ink-900)]">
          Khi thao tác không thành công
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            [
              "Không thấy chức năng",
              "Kiểm tra vai trò hiện tại và trường đang hoạt động. Liên hệ quản trị trường nếu cần thêm quyền.",
            ],
            [
              "Không gửi được biểu mẫu",
              "Kiểm tra trường bắt buộc, định dạng ngày/giờ, dung lượng hoặc loại tệp và thông báo lỗi đầu trang.",
            ],
            [
              "Bị báo trùng lịch",
              "Đổi thời gian, người tham gia hoặc tài nguyên; kiểm tra khung giờ đã khóa.",
            ],
            [
              "Không mở được dữ liệu",
              "Dữ liệu có thể thuộc trường khác, không nằm trong phạm vi vai trò hoặc đã bị tạm dừng.",
            ],
            [
              "Không nhận thông báo",
              "Kiểm tra trang Thông báo, cài đặt loại thông báo và trạng thái đã đọc.",
            ],
            [
              "Nghi ngờ truy cập lạ",
              "Đổi mật khẩu, thu hồi phiên trong Bảo mật và báo quản trị ngay.",
            ],
          ].map(([title, answer]) => (
            <details
              key={title}
              className="rounded-[var(--radius-md)] border border-[var(--color-ink-200)] p-4"
            >
              <summary className="cursor-pointer font-bold text-[var(--color-ink-900)]">
                {title}
              </summary>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-600)]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
