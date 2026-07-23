# Kế hoạch triển khai tổng thể EduTech

## 1. Tầm nhìn sản phẩm

EduTech là nền tảng vận hành trường học đa tenant, bảo mật và thân thiện, phục vụ học sinh, phụ huynh, cố vấn, giáo viên/nhân viên, trưởng câu lạc bộ, người phê duyệt, quản trị viên trường và quản trị viên nền tảng.

Sản phẩm hoàn thiện phải:

- Cung cấp giao diện tiếng Việt tự nhiên, nhất quán và dễ hiểu.
- Cô lập tuyệt đối dữ liệu giữa các trường.
- Chỉ hiển thị dữ liệu và hành động đúng với vai trò, quan hệ và phạm vi được cấp.
- Hỗ trợ toàn bộ vòng đời của cố vấn, tài nguyên, lịch, quy trình, câu lạc bộ/sự kiện và cộng tác.
- Có trải nghiệm xuất sắc trên máy tính, máy tính bảng và điện thoại.
- Đạt chuẩn truy cập WCAG 2.2 AA trong phạm vi có thể kiểm thử.
- Có trạng thái tải, trống, lỗi, cấm truy cập và thành công rõ ràng.
- Có nhật ký kiểm toán cho mọi thao tác nhạy cảm.
- Có bộ kiểm thử đơn vị, tích hợp và E2E bao phủ các luồng quan trọng.
- Có tài liệu thiết lập, vận hành, tài khoản demo và khắc phục sự cố.

## 2. Nguyên tắc triển khai bắt buộc

### 2.1. Lát cắt dọc

Mỗi lát cắt được hoàn thành theo thứ tự:

1. Mô hình dữ liệu và migration.
2. Permission, policy và tenant scope.
3. Domain service và transaction.
4. Server action/API với xác thực đầu vào.
5. UI tiếng Việt và mọi trạng thái.
6. Unit/integration test.
7. E2E test cho luồng chính và luồng từ chối.
8. Cập nhật tài liệu.
9. Chạy gate trước khi sang lát cắt tiếp theo.

Không xây dựng UI giả mà không có persistence và authorization tương ứng.

### 2.2. Bảo mật mặc định

- Mọi truy vấn dữ liệu trường phải có `schoolId` lấy từ session đã xác thực, không lấy trực tiếp từ dữ liệu không tin cậy.
- Mọi mutation phải kiểm tra session, membership đang hoạt động, role/permission, ownership và trạng thái domain.
- Parent chỉ truy cập học sinh có liên kết đang hoạt động và chỉ các trường dữ liệu được phép.
- Ghi chú riêng tư, file riêng tư, tin nhắn và export phải có policy riêng.
- Không trả về bí mật, password hash, session token hoặc dữ liệu tenant khác.
- Các thao tác cạnh tranh dùng transaction, unique constraint hoặc lock phù hợp.
- Upload được giới hạn dung lượng, MIME, tên file và quyền truy cập.
- Thao tác nhạy cảm sinh audit event.
- Rate limit các điểm đăng nhập, reset mật khẩu, upload và mutation có nguy cơ lạm dụng.

### 2.3. Chất lượng UX/UI

Phong cách “editorial-tech”: điềm tĩnh, đáng tin, hiện đại, có chiều sâu, thân thiện nhưng không trẻ con.

- Nền sáng ấm, chữ navy/charcoal, accent xanh lam/xanh ngọc có kiểm soát.
- Màu trạng thái có nhãn/icon, không phụ thuộc duy nhất vào màu.
- Typography rõ ràng; độ dài dòng hợp lý; khoảng trắng có chủ đích.
- Border mảnh, radius vừa phải, shadow tiết chế.
- Không lạm dụng gradient, glassmorphism, animation hoặc card nổi.
- Giao diện ứng dụng ưu tiên hiệu suất thao tác và ngữ cảnh.
- Tất cả control có hover, active, focus-visible, disabled, loading và error khi phù hợp.
- Tôn trọng `prefers-reduced-motion`.
- Không có chức năng quan trọng chỉ dùng hover.
- Bảng chuyển thành danh sách/card hợp lý trên mobile.
- Form có label, mô tả, required marker, validation tại chỗ và error summary.
- Action phá huỷ yêu cầu xác nhận rõ hậu quả.
- UI luôn hiển thị trường đang hoạt động và phạm vi thao tác.

## 3. Kiến trúc trải nghiệm

### 3.1. Website công khai

- Header responsive: thương hiệu, Sản phẩm, Giải pháp, Bảo mật, Bảng giá, Câu chuyện khách hàng, Trợ giúp, Đăng nhập, Đăng ký tư vấn.
- Trang chủ: hero rõ giá trị, preview sản phẩm thật, lợi ích theo vai trò, module, bảo mật, bằng chứng, triển khai, CTA.
- Trang module: Cố vấn, Tài nguyên, Lịch hẹn, Quy trình, Câu lạc bộ & sự kiện.
- Trang Bảo mật, Bảng giá, Câu chuyện khách hàng, Trung tâm trợ giúp và Đăng ký tư vấn.
- Mobile menu có focus management, Escape để đóng và aria semantics.
- SEO metadata, social metadata, sitemap/robots khi phát hành.

### 3.2. Workspace đã xác thực

Desktop:

- Sidebar cố định/có thể thu gọn.
- Nhận diện trường và bộ chuyển trường.
- Navigation theo quyền.
- Top bar với breadcrumb, tìm kiếm, tạo nhanh, thông báo, trợ giúp và menu người dùng.
- Content canvas theo loại công việc, không ép mọi thứ vào card.
- Drawer/panel ngữ cảnh khi có lợi.

Mobile:

- Sidebar thành drawer truy cập được bằng bàn phím.
- Có thể dùng bottom navigation cho điểm đến cốt lõi.
- Form một cột; action chính dễ chạm.
- Table ưu tiên cột hoặc thành list/card.
- Calendar dùng agenda/ngày thay vì ép weekly grid.
- Target chạm tối thiểu phù hợp.

### 3.3. Mẫu màn hình chuẩn

Trang danh sách:

- Tiêu đề, mô tả, CTA.
- Search, filter, sort, saved view nếu hữu ích.
- Bulk selection/action.
- Pagination.
- Loading skeleton, empty state có hướng dẫn, error/retry.
- Responsive table/list.

Trang chi tiết:

- Tiêu đề, status, metadata, action đúng quyền.
- Tab/section có URL hoặc state ổn định.
- Timeline, related records, comments, attachments và audit nếu được phép.
- Not-found và forbidden phân biệt rõ.

Form:

- Label tiếng Việt tự nhiên.
- Validation schema dùng chung client/server khi hợp lý.
- Error summary có liên kết tới field.
- Draft/autosave khi luồng dài.
- Cảnh báo thay đổi chưa lưu.
- Success feedback và điều hướng sau lưu có chủ ý.

## 4. Vai trò và luồng sử dụng tổng quát

### Học sinh

1. Đăng nhập và đổi mật khẩu lần đầu nếu cần.
2. Chọn trường nếu có nhiều membership.
3. Xem dashboard cá nhân.
4. Tìm cố vấn và đặt lịch.
5. Xem tài nguyên được phép; bookmark/collection.
6. Tham gia câu lạc bộ hoặc đăng ký sự kiện.
7. Điền biểu mẫu/quy trình và theo dõi phê duyệt.
8. Nhận thông báo và trao đổi trong phạm vi cho phép.
9. Xem lịch sử hoạt động/điểm danh của mình.

### Phụ huynh/người giám hộ

1. Đăng nhập và chọn con đã liên kết.
2. Xem thông tin được phép của con.
3. Phê duyệt consent, xem lịch/sự kiện và thông báo.
4. Không được truy cập ghi chú cố vấn riêng tư hoặc dữ liệu học sinh không liên kết.

### Cố vấn

1. Xem lịch hôm nay, học sinh được phân công và case cần theo dõi.
2. Quản lý availability.
3. Duyệt/đổi/huỷ lịch và ghi nhận attendance.
4. Cập nhật mục tiêu, session outcome, task, referral và note theo visibility.
5. Nhận nhắc việc và escalation.

### Giáo viên/nhân viên

- Truy cập người học, tài nguyên, lịch, form và sự kiện theo assignment/permission.
- Tạo nội dung, phản hồi và vận hành quy trình được giao.

### Trưởng câu lạc bộ

- Quản lý đúng câu lạc bộ được giao.
- Xử lý thành viên, announcement, task, event proposal, registration, attendance, budget và report.

### Người phê duyệt

- Xem queue được phép.
- Đọc context cần thiết.
- Phê duyệt, từ chối hoặc yêu cầu chỉnh sửa có lý do.
- Không quyết định step không được phân công.

### Quản trị viên trường

- Quản lý profile trường, membership, invitation, role, parent link và session.
- Cấu hình module, workflow, notification và quota.
- Xem báo cáo và audit trong trường.

### Quản trị viên nền tảng

- Provision/quản lý trường.
- Theo dõi sức khoẻ và usage.
- Thực hiện chức năng platform-scope có audit và cảnh báo phạm vi rõ ràng.

---

# 5. Các giai đoạn triển khai

## Phase 0 — Nền tảng chạy được và kiểm chứng được

### Chức năng

- Docker Compose cho PostgreSQL và Redis.
- Environment validation.
- Prisma client, migration và deterministic seed.
- Storage local và email outbox adapter.
- Script lint, typecheck, unit/integration, build.
- Playwright E2E foundation.
- Tài khoản demo cho hai trường và mọi vai trò.

### Công cụ

- Cài Docker Desktop bằng Homebrew nếu thiếu.
- Mở Docker Desktop và chờ daemon sẵn sàng.
- Cài Playwright và browser Chromium.
- Tạo `.env` từ `.env.example` nếu thiếu.

### Gate

- Clean install thành công.
- PostgreSQL/Redis healthy.
- Migration chạy trên database sạch.
- Seed chạy thành công và idempotent theo thiết kế.
- Prisma client generate thành công.
- Unit/integration, lint, typecheck và build xanh.
- Playwright smoke test mở được ứng dụng.

## Phase 1 — Thương hiệu, design system và shell

### Deliverables

- Toàn bộ copy người dùng bằng tiếng Việt; không còn thương hiệu cũ.
- Token: màu, typography, spacing, radius, border, elevation, motion, breakpoint, content width và focus.
- Component: button/icon button, link, input, textarea, select/combobox, checkbox/radio/switch, badge, alert, card, table, tabs, breadcrumb, pagination, dialog, drawer, menu, tooltip, toast, skeleton, empty state, avatar, file upload, timeline.
- Marketing shell hoàn thiện.
- Authenticated shell responsive.
- Skip link, landmarks, focus management và reduced-motion.
- Error, not-found, forbidden và loading boundaries.

### UI gate

- Render đúng ở 320, 375, 768, 1024 và 1440 px.
- Keyboard sử dụng được menu, dialog, form và navigation.
- Focus-visible rõ.
- Contrast đạt yêu cầu.
- Không horizontal overflow ngoài component chủ ý.
- Không còn copy tiếng Anh trong user-facing route ngoại trừ tên riêng/thuật ngữ cần thiết.

## Phase 2 — Danh tính, tenant và quản trị

### Mô hình

Hoàn thiện school, user, membership, role assignment, parent-student link, invitation, session, password-reset token và audit.

### Chức năng

- Đăng nhập credentials bằng Argon2id.
- Session cookie an toàn, logout và revoke.
- Bắt buộc đổi mật khẩu tạm.
- Quên/đặt lại mật khẩu qua outbox.
- Invitation lifecycle: tạo, gửi, chấp nhận, hết hạn, thu hồi.
- Chọn trường đang hoạt động và kiểm tra membership.
- Route guard school/platform.
- Quản trị user, membership, role và parent link.
- Session management và security history.

### UI

- Đăng nhập, quên mật khẩu, đặt lại mật khẩu, chấp nhận lời mời.
- Chọn trường.
- Trang 403 và membership inactive.
- Trang quản trị thành viên có search/filter/bulk action.
- Modal role assignment và revoke có cảnh báo.
- Profile/security và danh sách session.
- Feedback tiếng Việt cho mọi lỗi xác thực.

### Gate

- Mọi demo role đăng nhập được.
- School A không đọc/mutate School B.
- Membership inactive bị chặn.
- Parent chỉ xem linked student.
- Session revoke có hiệu lực.
- Auth rate limit hoạt động.
- Unit, integration và E2E auth/tenant xanh.

## Phase 3 — Cố vấn và tư vấn

### Kế hoạch lát dọc

1. **Nền tảng domain**
   - Mở rộng Prisma schema, migration và demo seed cho hồ sơ cố vấn, lịch rảnh, lịch hẹn, waitlist, hồ sơ tư vấn và ghi chú.
   - Viết unit test trước cho availability, state transition và note visibility.
   - Gate: Prisma validate/generate, unit test domain, lint và typecheck.
2. **Khám phá cố vấn và đặt lịch**
   - Directory có tìm kiếm/lọc, trang hồ sơ, slot khả dụng và booking ngắn gọn.
   - Booking chạy trong transaction, constraint PostgreSQL chặn trùng lịch cố vấn/học sinh; conflict có lựa chọn waitlist.
   - Mọi mutation tạo audit event và domain outbox trong cùng transaction.
   - Gate: integration test concurrent booking, waitlist, audit và outbox.
3. **Vận hành lịch hẹn**
   - Agenda ngày/tuần, duyệt, đổi lịch, hủy, attendance và promotion waitlist deterministic.
   - Dashboard theo vai trò học sinh, cố vấn và quản trị.
   - Gate: integration test transition hợp lệ/không hợp lệ và E2E vòng đời lịch hẹn.
4. **Hồ sơ tư vấn**
   - Case list/detail; Overview, Goals, Sessions, Tasks, Files và Activity.
   - Session outcome, referral, confidential note với projection theo role/relationship.
   - Gate: negative privacy test mọi role/tenant và E2E parent privacy.
5. **Đóng phase**
   - Responsive, keyboard, reduced-motion, empty/loading/error/conflict/forbidden.
   - Cập nhật data model, permission matrix, README và checklist.
   - Chạy unit, lint, typecheck, build, E2E, diff check; kiểm tra trình duyệt và code review năm trục.

### Acceptance criteria chi tiết

- Hai request đồng thời không thể tạo hai lịch hẹn chồng lấn cho cùng cố vấn hoặc học sinh.
- Mỗi transition lịch hẹn/case tạo history, audit và outbox tương ứng.
- Waitlist luôn được xếp/promote theo `joinedAt`, sau đó `id`; promotion không vượt capacity.
- Học sinh/phụ huynh không nhận trường dữ liệu của note không được phép trong query projection, UI hoặc export.
- Directory, booking, agenda và case hoạt động bằng dữ liệu thật, không có nút chính giả.
- Luồng học sinh đặt lịch, cố vấn duyệt, ghi kết quả và điểm danh chạy hoàn chỉnh.

### Mô hình/chức năng

- Mentor profile, verification, specialty.
- Mentor-student assignment.
- Availability rule và exception.
- Appointment type, booking, approval, reschedule, cancel, waitlist, attendance.
- Case, goal, session outcome, task, referral và note visibility.
- Transaction chống double booking.
- Audit và notification.

### UI

- Directory tìm cố vấn với filter.
- Profile cố vấn và availability.
- Booking flow theo bước ngắn gọn.
- Agenda/ngày/tuần.
- Dashboard học sinh, cố vấn và quản trị.
- Case list/detail với Overview, Goals, Sessions, Tasks, Files, Activity.
- Confidential-note marker và giải thích quyền.
- Empty/loading/error/conflict/waitlist states.

### Gate

- Concurrent conflict bị từ chối transactionally.
- Note riêng tư không lộ qua UI, API hoặc export.
- Mọi transition hợp lệ và được audit.
- E2E toàn vòng đời học sinh → cố vấn xanh.

## Phase 4 — Thư viện tài nguyên và file

### Mô hình/chức năng

- Resource metadata, category, tag.
- Stored file, immutable version và link.
- Draft, review, published, archived/rejected lifecycle.
- Upload/download/preview có authorization.
- Version history và rollback tạo version mới.
- Comments, report, bookmark, collection và analytics.
- MIME/size validation và safe filename.

### UI

- Library search-first với grid/list.
- Filter category/tag/status.
- Resource detail và preview.
- Upload progress, retry và recovery.
- Editor/moderation queue.
- Version history/compare metadata.
- Access settings và privacy explanation.
- Personal bookmarks/collections.

### Gate

- Cross-school file access thất bại.
- Private download cần permission.
- Published version không mutate.
- Upload limit/MIME hoạt động.
- E2E author → reviewer → reader → rollback xanh.

### Phase 4 implementation checkpoint

- `20260723070524_phase4_resources` adds the resource, taxonomy, version,
  file-link, collaboration and analytics tables with tenant indexes.
- `src/lib/resources/resource-service.ts` owns visibility, lifecycle,
  immutable version, storage authorization, comments/reports, bookmarks,
  collections and analytics mutations.
- `/dashboard/resources/**` exposes search-first library, detail/editor,
  moderation, bookmarks and analytics views.
- Unit, integration and Playwright coverage proves cross-tenant rejection,
  invalid upload recovery, publish flow and rollback-as-new-version.

## Phase 5 — Lịch và đặt chỗ

### Phase 5 delivery slice (2026-07-23)

- Extend the existing tenant-scoped appointment domain with a first-class
  school calendar view, month/week/agenda filters, conflict-safe event creation,
  recurrence exceptions, capacity/waitlist visibility, attendance, and
  authorized iCalendar export.
- Keep the existing mentoring booking transaction as the source of truth for
  mentor appointments; calendar events are a separate auditable aggregate.
- Ship responsive controls, explicit empty/error states, and keyboard-friendly
  forms before adding broader room/resource administration.

### Mô hình/chức năng

- Scoped calendar.
- Event/booking và recurrence rule.
- Recurrence exception.
- Room/resource, capacity và blocked period.
- Conflict detection.
- Waitlist promotion deterministic.
- Attendance, reminder và iCalendar export.
- Real-time invalidation/update với durable fallback.

### UI

- Month/week/day/agenda tùy thiết bị.
- Bộ lọc calendar/source/status.
- Booking drawer/page.
- Conflict explanation và alternative.
- Waitlist/capacity indicator.
- Attendance check-in.
- Reschedule/cancel confirmation.
- Mobile agenda tối ưu.

### Gate

- Reservation conflict fail safely.
- Recurrence exception render chính xác.
- Waitlist promotion deterministic/audited.
- iCal chỉ chứa event được phép.
- E2E scheduling xanh.

## Phase 6 — Công cụ tạo quy trình không-code

### Phase 6 delivery slice (2026-07-23)

- Add tenant-scoped workflow templates with immutable published versions,
  typed field definitions, ordered approval steps, submissions, decisions,
  request-changes, and historical source-version preservation.
- Ship a compact builder for template/field/step configuration plus a
  submission/reviewer experience; keep analytics/export as a follow-up slice
  after the runtime state machine is proven.

### Mô hình/chức năng

- Template và immutable published version.
- Field definition và validation.
- Conditional visibility/routing.
- Approval graph tuần tự/song song.
- Reviewer assignment, deadline, escalation, delegation.
- Submission draft, autosave, attachment, comment, decision, history.
- Analytics và CSV export có authorization.

### UI builder

- Cài đặt template.
- Field palette.
- Ordered canvas.
- Field configuration panel.
- Validation/conditional rule editor.
- Approval-step editor.
- Preview.
- Draft/publish/version history.

### UI người nộp/người duyệt

- Form có progress, autosave state và validation summary.
- Review trước khi gửi.
- Confirmation và status timeline.
- Queue có search/filter/deadline.
- Approve/reject/request-changes với reason.

### Gate

- Published definition immutable.
- Historical submission giữ source version.
- Routing đúng role/condition.
- Unauthorized approver bị chặn.
- E2E ít nhất ba quy trình mẫu xanh.

## Phase 7 — Câu lạc bộ và sự kiện

### Mô hình/chức năng

- Club, application, membership, role, announcement, task.
- Event proposal tích hợp workflow.
- Registration, parent consent, capacity, waitlist, attendance.
- Budget, expense, safety plan và post-event report.
- Analytics.

### UI

- Club directory và profile.
- Join/application flow.
- Leader workspace: roster, task, announcement.
- Event proposal and approval status.
- Registration/consent flow.
- Attendance check-in.
- Budget dashboard và expense table.
- Event report.

### Gate

- Leader chỉ quản lý club được giao.
- Event conflict bị chặn.
- Parent chỉ consent linked student.
- Budget/proposal history được audit.
- E2E proposal → approval → registration → consent → attendance → report xanh.

## Phase 8 — Cộng tác, thông báo và thời gian thực

### Mô hình/chức năng

- Conversation, participant, message và attachment.
- Comment, mention và activity feed.
- Durable domain event → notification/email outbox.
- Notification preference.
- Authenticated real-time channel.
- Idempotency và retry.
- Durable query fallback khi real-time lỗi.

### UI

- Notification center + trang lịch sử.
- Unread/category/filter/mark read.
- Conversation list/detail.
- Composer có attachment và mention.
- Contextual comment/activity timeline.
- Preference page.
- Reconnecting/offline/failure states.

### Gate

- Unauthorized subscribe/read/send bị chặn.
- Message vẫn persist khi real-time down.
- Duplicate event không tạo notification trùng.
- E2E real-time và fallback xanh.

## Phase 9 — Báo cáo, tìm kiếm, hardening và phát hành

### Chức năng

- Dashboard theo vai trò dùng dữ liệu thật.
- Global search/command palette được lọc theo tenant/permission.
- Audit explorer và export.
- Reporting module cho attendance, engagement, workflow, mentoring, resources, clubs/events.
- CSV export an toàn.
- Usage counters, quota và retention jobs.
- Rate limit, secure headers, CSP phù hợp, abuse control.
- Error boundaries và structured logging.
- Health/readiness endpoint.
- Data retention và cleanup.
- Backup/restore runbook.

### UI

- Dashboard ưu tiên action, không dùng vanity metrics.
- Report filter/date range, chart có table alternative.
- Export progress và audit.
- Audit explorer có actor/action/entity/time/filter.
- Search palette keyboard-first.
- Admin usage/quota screens.
- Platform scope có visual warning khác school scope.

### Final gate

- Tất cả unit/integration/E2E xanh.
- Lint, typecheck và production build xanh.
- Clean DB migration/seed xanh.
- Tenant-isolation review xanh.
- Keyboard, focus, screen-reader semantics và reduced-motion acceptance xanh.
- Responsive screenshots/checks ở breakpoint mục tiêu.
- Accessibility audit không còn lỗi nghiêm trọng.
- Performance audit đạt ngưỡng hợp lý cho môi trường local/production build.
- Không còn critical/high security issue đã biết.
- Không có console/network error trong happy paths.
- README và docs đầy đủ.
- Demo account và walkthrough hoạt động.
- Repository không chứa secret hoặc artifact local không mong muốn.

## 6. Chiến lược kiểm thử

### Unit

- State transition.
- Permission/policy.
- Validation.
- Date/recurrence/conflict.
- Waitlist ordering.
- Workflow condition/routing.
- Notification idempotency.
- File rules.

### Integration

- Prisma repository với DB thật.
- Transaction cạnh tranh.
- Tenant-scoped query.
- Session/revocation.
- Outbox.
- Upload/storage.
- Export.
- Retention/quota.

### E2E Playwright

- Login/logout/password/invitation.
- Active school and cross-tenant denial.
- Luồng từng vai trò.
- Mỗi vertical slice có happy path + permission denial + failure recovery.
- Mobile và desktop smoke.
- Keyboard-only critical paths.
- Axe accessibility scan nếu tích hợp.
- Console/network error assertion.

## 7. Definition of Done cho mỗi mục

Một mục chỉ được đánh dấu hoàn thành khi:

- Chức năng dùng persistence thật, không phải mock tạm.
- Server authorization và input validation đầy đủ.
- UI tiếng Việt hoàn chỉnh.
- Có loading, empty, error, success và forbidden khi phù hợp.
- Responsive và keyboard usable.
- Test mới được thêm và toàn bộ test hiện có vẫn xanh.
- Typecheck/lint/build không bị phá.
- Có audit/notification khi yêu cầu.
- Docs/schema/permission matrix được cập nhật.
- Không để TODO giả, nút chết hoặc route trình diễn thay cho chức năng đã tuyên bố.

## 8. Nguyên tắc vận hành tự động

Agent thực thi liên tục theo thứ tự phase và cập nhật `tasks/todo.md` sau từng gate. Chỉ dừng khi:

- Cần thao tác hệ điều hành yêu cầu xác nhận/password mà agent không thể tự cung cấp.
- Phụ thuộc bên ngoài yêu cầu credential thực không có trong dự án.
- Có quyết định sản phẩm không thể suy ra an toàn từ tài liệu.

Trong các trường hợp khác, agent tự chọn giải pháp đơn giản, an toàn, có kiểm thử và tiếp tục cho tới Final gate.
