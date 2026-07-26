# Danh sách triển khai tổng thể EduTech

> Quy tắc: chỉ đánh dấu hoàn thành khi đáp ứng Definition of Done trong `tasks/plan.md`. Thực hiện theo thứ tự; mỗi lát cắt phải có schema → policy → service → UI → test → docs → gate.

## Phase 0 — Nền tảng và môi trường

### Hiện trạng đã có

- [x] Baseline prototype Next.js.
- [x] Cấu hình environment và validation.
- [x] Docker Compose cho PostgreSQL và Redis.
- [x] Prisma schema nền tảng identity/tenancy/audit/outbox.
- [x] Migration đầu tiên và deterministic seed.
- [x] Permission registry và policy helpers nền tảng.
- [x] Credentials/session foundation.
- [x] Local file storage và email-outbox adapters.
- [x] Vitest, lint, typecheck, build và database scripts.
- [x] Unit/integration tests nền tảng (18 test).

### Cài đặt và kiểm chứng

- [x] Kiểm tra Homebrew, Docker daemon và công cụ hệ thống.
- [x] Cài Docker Desktop nếu thiếu.
- [x] Khởi động Docker Desktop và xác nhận daemon hoạt động.
- [x] Tạo `.env` từ `.env.example` nếu thiếu.
- [x] Khởi động PostgreSQL và Redis bằng Compose.
- [x] Xác nhận health của PostgreSQL và Redis.
- [x] Chạy migration trên database sạch.
- [x] Generate Prisma client.
- [x] Chạy seed và xác nhận hai trường/mọi vai trò.
- [x] Xác nhận seed có thể chạy lại an toàn theo thiết kế.
- [x] Cài Playwright và Chromium.
- [x] Thêm Playwright config, web server và smoke test.
- [x] Chạy unit/integration tests.
- [x] Chạy lint.
- [x] Chạy typecheck.
- [x] Chạy production build.
- [x] Chạy Playwright smoke test.
- [x] Cập nhật README thiết lập và tài khoản demo.
- [x] Đóng gate Phase 0.

## Phase 1 — Giao diện tiếng Việt, design system và shell

### Nội dung và thương hiệu

- [x] Lập inventory toàn bộ copy/route user-facing.
- [x] Chuyển toàn bộ metadata và copy sang tiếng Việt tự nhiên.
- [x] Xoá mọi thương hiệu cũ; chuẩn hoá EduTech.
- [x] Chuẩn hoá thuật ngữ Việt cho role, status và action.
- [x] Hoàn thiện navigation map marketing/app theo vai trò.

### Token và nền truy cập

- [x] Xây token màu semantic, typography, spacing, radius, border, elevation và motion.
- [x] Xây breakpoint/content-width responsive.
- [x] Thêm global reset và baseline typography.
- [x] Thêm skip link và semantic landmarks.
- [x] Chuẩn hoá `:focus-visible`.
- [x] Thêm reduced-motion rules.
- [x] Kiểm tra contrast của text/control/status.
- [x] Thêm utility cho visually-hidden và screen-reader status.

### Component library

- [x] Hoàn thiện Button và IconButton với variants/loading/disabled.
- [x] Hoàn thiện Link và navigation link.
- [x] Hoàn thiện Input, Textarea và Field.
- [x] Thêm Select/Combobox.
- [x] Thêm Checkbox, Radio và Switch.
- [x] Hoàn thiện Badge/Status indicator không phụ thuộc màu.
- [x] Thêm Alert và inline feedback.
- [x] Hoàn thiện Card chỉ cho hierarchy phù hợp.
- [x] Thêm responsive Table và row actions.
- [x] Thêm Tabs.
- [x] Thêm Breadcrumb.
- [x] Thêm Pagination.
- [x] Thêm Dialog với focus trap/restore.
- [x] Thêm Drawer/Sheet responsive.
- [x] Thêm Menu/Dropdown.
- [x] Thêm Tooltip cho supplementary content.
- [x] Thêm Toast/live-region feedback.
- [x] Thêm Skeleton/loading state.
- [x] Thêm EmptyState/ErrorState/ForbiddenState.
- [x] Thêm Avatar.
- [x] Thêm Timeline/Activity item.
- [x] Thêm file upload primitive.
- [x] Thêm date/time and calendar primitives cần thiết.

### Marketing UI

- [x] Rebuild responsive header và accessible mobile menu.
- [x] Rebuild footer với sitemap và support links.
- [x] Hoàn thiện trang chủ với hero, product preview, modules, roles, trust và CTA.
- [x] Hoàn thiện trang Cố vấn.
- [x] Hoàn thiện trang Tài nguyên.
- [x] Hoàn thiện trang Lịch hẹn.
- [x] Thêm trang Quy trình.
- [x] Hoàn thiện trang Câu lạc bộ & sự kiện.
- [x] Hoàn thiện Bảng giá.
- [x] Hoàn thiện Bảo mật.
- [x] Hoàn thiện Câu chuyện khách hàng.
- [x] Hoàn thiện Trung tâm trợ giúp.
- [x] Hoàn thiện form Đăng ký tư vấn với validation/success/error.
- [x] Thêm SEO/social metadata, sitemap và robots.

### Authenticated shell

- [x] Xây sidebar desktop responsive/collapsible.
- [x] Xây mobile navigation drawer.
- [x] Xây top bar, breadcrumb, search trigger, quick action, notification và user menu.
- [x] Xây active-school presentation/switcher slot.
- [x] Lọc navigation theo role/permission.
- [x] Xây page header và content layouts.
- [x] Xây loading, error, not-found và forbidden boundaries.
- [x] Xây mobile table/list adaptation.
- [x] Xây dashboard visual foundation theo vai trò.

### Gate Phase 1

- [x] Unit/component tests cho primitives quan trọng.
- [x] E2E marketing/app shell desktop.
- [x] E2E mobile navigation.
- [x] Keyboard-only menu/dialog/form checks.
- [x] Reduced-motion check.
- [x] Responsive check 320/375/768/1024/1440 px.
- [x] Không còn copy tiếng Anh ngoài ngoại lệ có chủ ý.
- [x] Không còn horizontal overflow bất ngờ.
- [x] Lint, typecheck, tests và build xanh.
- [x] Cập nhật docs giao diện.
- [x] Đóng gate Phase 1.

## Phase 2 — Danh tính, tenant và quản trị

### Schema và migration

- [x] Rà soát/hoàn thiện User, School, Membership và role assignments.
- [x] Rà soát/hoàn thiện ParentStudentLink.
- [x] Hoàn thiện Invitation lifecycle fields/indexes.
- [x] Hoàn thiện Session revocation/expiry fields/indexes.
- [x] Hoàn thiện PasswordResetToken.
- [x] Thêm password-change-required state.
- [x] Thêm audit indexes cần thiết.
- [x] Tạo/chạy migration và cập nhật seed.

### Auth service và route

- [x] Xây login service với Argon2id và generic error.
- [x] Xây secure session creation/cookie.
- [x] Xây logout current session.
- [x] Xây revoke other/all sessions.
- [x] Xây current-session resolver.
- [x] Xây active-school context persistence.
- [x] Xây forced first-login password change.
- [x] Xây forgot-password request với non-enumerating response.
- [x] Xây reset-password consume-once flow.
- [x] Xây invitation create/send/resend/revoke/accept/expire flow.
- [x] Thêm auth rate limits.
- [x] Thêm route guards cho anonymous/authenticated/school/platform.
- [x] Thêm CSRF-safe mutation approach.
- [x] Thêm audit cho auth/admin actions.

### Authorization

- [x] Chuẩn hoá typed permissions cho toàn bộ role.
- [x] Xây tenant-scoped repository/service pattern.
- [x] Kiểm tra active membership ở mọi school route.
- [x] Xây ownership/assignment checks.
- [x] Xây parent-linked-student projection.
- [x] Tách platform scope và school scope rõ ràng.
- [x] Thêm forbidden/not-found response an toàn.

### UI auth

- [x] Trang đăng nhập hoạt động thật.
- [x] Trang đổi mật khẩu lần đầu.
- [x] Trang quên mật khẩu.
- [x] Trang đặt lại mật khẩu.
- [x] Trang chấp nhận lời mời.
- [x] Trang chọn/đổi trường.
- [x] Trang membership inactive.
- [x] Trang 403.
- [x] Profile và security settings.
- [x] Danh sách/quản lý session.

### UI quản trị

- [x] School member list/search/filter/pagination.
- [x] Invite-member form.
- [x] Membership detail.
- [x] Role assignment dialog.
- [x] Membership deactivate/reactivate flow.
- [x] Parent-student link management.
- [x] School settings.
- [x] Platform school directory.
- [x] Platform school provisioning/detail.
- [x] Visual warning khi thao tác platform scope.

### Gate Phase 2

- [x] Unit tests password/session/token/policy.
- [x] Integration tests login/session/revoke/invitation/reset.
- [x] Integration tests tenant-scoped queries.
- [x] Negative tests School A ↔ School B.
- [x] Negative tests inactive membership.
- [x] Negative tests parent/unlinked student/private projection.
- [x] E2E mọi demo role đăng nhập/logout.
- [x] E2E forced password change.
- [x] E2E invitation và password reset.
- [x] E2E active-school switching.
- [x] E2E school/platform admin.
- [x] Lint, typecheck, tests, E2E và build xanh.
- [x] Cập nhật permissions/data-model/README.
- [x] Đóng gate Phase 2.

## Phase 3 — Cố vấn và tư vấn

### Lát dọc 1 — Domain foundation

- [x] RED unit tests availability, appointment transition và note projection.
- [x] Prisma enums/models/relations/indexes Phase 3.
- [x] PostgreSQL exclusion constraints chống lịch chồng lấn.
- [x] Migration, Prisma client và demo seed cố vấn.
- [x] GREEN unit tests + Prisma validate/generate.

### Lát dọc 2 — Discovery và booking

- [x] RED integration concurrent booking/waitlist/audit/outbox.
- [x] Mentor directory/profile/availability services.
- [x] Transactional booking và deterministic waitlist.
- [x] Directory, profile và booking UI.
- [x] GREEN integration tests, lint, typecheck.

### Lát dọc 3 — Appointment operations

- [x] RED tests approve/reschedule/cancel/attendance.
- [x] Appointment lifecycle service và actions.
- [x] Agenda ngày/tuần và appointment detail.
- [x] Dashboard học sinh/cố vấn/quản trị.
- [x] GREEN tests và E2E lifecycle.

### Lát dọc 4 — Counseling cases và privacy

- [x] RED tests case lifecycle/goals/tasks/referral/note visibility.
- [x] Case services, session outcome và activity projection.
- [x] Case list/detail UI đủ tabs/states.
- [x] Confidential-note editor/marker/explanation.
- [x] GREEN negative privacy tests mọi role/tenant và E2E parent privacy.

### Lát dọc 5 — Closeout

- [x] Responsive 320/768/1024/1440, keyboard và reduced-motion.
- [x] Cập nhật docs/README/checklist.
- [x] Chạy full verification gate và browser verification.
- [x] Code review correctness/readability/architecture/security/performance.

### Schema và domain

- [x] Thêm MentorProfile, specialty và verification.
- [x] Thêm MentorStudentAssignment.
- [x] Thêm AvailabilityRule và AvailabilityException.
- [x] Thêm AppointmentType, Appointment và AppointmentTransition.
- [x] Thêm AppointmentWaitlist và Attendance.
- [x] Thêm MentoringCase, Goal, SessionOutcome, Task và Referral.
- [x] Thêm MentoringNote với visibility.
- [x] Thêm constraints/indexes chống conflict.
- [x] Tạo/chạy migration và seed dữ liệu cố vấn.

### Policy/service/API

- [x] Mentor directory/search policy.
- [x] Availability calculation service.
- [x] Transactional booking service.
- [x] Approval/reschedule/cancel transitions.
- [x] Deterministic waitlist promotion.
- [x] Attendance recording.
- [x] Case lifecycle service.
- [x] Goal/task/referral services.
- [x] Note visibility projection.
- [x] Audit/outbox events.
- [x] Validation và rate/abuse limits phù hợp.

### UI và luồng

- [x] Dashboard học sinh cho lịch/case/action.
- [x] Dashboard cố vấn cho lịch/follow-up/case.
- [x] Dashboard quản trị module.
- [x] Mentor directory/search/filter.
- [x] Mentor profile.
- [x] Booking flow.
- [x] Agenda/day/week views.
- [x] Appointment detail/approval/reschedule/cancel.
- [x] Waitlist state và promotion feedback.
- [x] Attendance controls.
- [x] Case list/search/filter.
- [x] Case detail: tổng quan, mục tiêu, buổi gặp, công việc, file, hoạt động.
- [x] Session outcome editor.
- [x] Confidential note editor/marker/explanation.
- [x] Referral flow.
- [x] Loading/empty/error/conflict/forbidden states.

### Gate Phase 3

- [x] Unit tests transitions/availability/privacy.
- [x] Integration concurrent-booking test.
- [x] Integration waitlist/audit/outbox tests.
- [x] Negative note-visibility tests cho mọi role.
- [x] E2E student → booking → mentor approval → session → attendance.
- [x] E2E reschedule/cancel/waitlist.
- [x] E2E parent privacy.
- [x] Responsive/keyboard/a11y checks.
- [x] Lint, typecheck, tests, E2E và build xanh.
- [x] Cập nhật docs.
- [x] Đóng gate Phase 3.

## Phase 4 — Tài nguyên và file

### Schema và domain

- [x] Thêm Resource, ResourceVersion, Category và Tag.
- [x] Hoàn thiện StoredFile/FileVersion/FileLink liên kết resource.
- [x] Thêm moderation lifecycle và transitions.
- [x] Thêm Comment, ResourceReport, Bookmark và Collection.
- [x] Thêm analytics events/counters.
- [x] Thêm constraints/indexes.
- [x] Tạo/chạy migration và seed.

### Policy/service/API

- [x] Resource visibility policy.
- [x] Upload validation dung lượng/MIME/tên file.
- [x] Authorized upload/download/preview.
- [x] Draft/review/publish/reject/archive service.
- [x] Immutable version enforcement.
- [x] Rollback bằng version mới.
- [x] Comment/report moderation.
- [x] Bookmark/collection service.
- [x] Analytics aggregation.
- [x] Audit/outbox events.

### UI và luồng

- [x] Library grid/list search-first.
- [x] Category/tag/status filters.
- [x] Resource detail/preview.
- [x] Upload/editor flow với progress/retry.
- [x] Moderation queue.
- [x] Version history và rollback.
- [x] Access/privacy settings.
- [x] Comment/report flow.
- [x] Bookmarks và collections.
- [x] Analytics view.
- [x] Loading/empty/error/forbidden states.

### Gate Phase 4

- [x] Unit tests lifecycle/file rules.
- [x] Integration upload/storage/version tests.
- [x] Cross-tenant/private-file negative tests.
- [x] Published immutability test.
- [x] E2E author → reviewer → publish → reader → rollback.
- [x] E2E invalid upload/recovery.
- [x] Responsive/keyboard/a11y checks.
- [x] Lint, typecheck, tests, E2E và build xanh.
- [x] Cập nhật docs.
- [x] Đóng gate Phase 4.

## Phase 5 — Lịch và đặt chỗ

### Delivery slice completed

- [x] Scoped school calendar with day/week/month views and calendar filter.
- [x] Conflict-safe event creation with tenant authorization.
- [x] Recurrence rule storage and recurrence-domain expansion with exceptions.
- [x] Recurrence exception editor for cancel/move of one occurrence.
- [x] Capacity-aware booking/waitlist and deterministic positions.
- [x] Attendance check-in UI and authorized iCalendar export.
- [x] Phase 5 unit/E2E coverage.

Room CRUD, reminder worker/outbox, and real-time invalidation remain follow-up tasks.

### Schema và domain

- [x] Thêm Calendar, CalendarSource và membership/visibility.
- [x] Thêm CalendarEvent/Reservation.
- [x] Thêm RecurrenceRule và RecurrenceException.
- [x] Thêm Room/BookableResource và BlockedPeriod.
- [x] Thêm Capacity/Waitlist/Attendance/Reminder.
- [x] Thêm constraints/indexes.
- [x] Tạo/chạy migration và seed.

### Policy/service/API

- [x] Scoped-calendar policy.
- [x] Recurrence expansion service.
- [x] Conflict-detection service.
- [x] Transactional reservation.
- [x] Deterministic waitlist promotion.
- [x] Attendance service.
- [ ] Reminder scheduling/outbox.
- [x] Authorized iCalendar export.
- [ ] Real-time invalidation với durable fallback.
- [x] Audit events.

### UI và luồng

- [x] Month view.
- [x] Week/day view.
- [x] Mobile agenda.
- [x] Calendar filters.
- [x] Booking create/detail/edit.
- [x] Conflict explanation và alternative.
- [x] Capacity/waitlist state.
- [x] Room/resource management.
- [x] Recurrence/exception editor.
- [x] Attendance check-in.
- [ ] Reminder settings.
- [x] iCal export.
- [x] Loading/empty/error/offline states.

### Gate Phase 5

- [x] Unit tests recurrence/conflict/waitlist.
- [ ] Integration concurrent reservation.
- [x] Integration recurrence exceptions.
- [ ] Export authorization tests.
- [ ] E2E booking/conflict/waitlist/promotion.
- [x] E2E recurrence exception.
- [x] Responsive/keyboard/a11y checks.
- [x] Lint, typecheck, tests, E2E và build xanh.
- [x] Cập nhật docs.
- [x] Đóng gate Phase 5.

## Phase 6 — Công cụ tạo quy trình không-code

### Delivery slice completed

- [x] Tenant-scoped template, draft version, field definition, and approval-step schema.
- [x] Immutable publish creates a new draft version and preserves source version on submissions.
- [x] Runtime required-field validation, conditional routing, and sequential/parallel approval state machine.
- [x] Builder, submission form, reviewer decision UI, status timeline, and authorized CSV export.
- [x] Tenant-scoped submission comments, processing history UI, and role-aware record visibility.
- [x] Individual reviewer delegation with role validation, assignment locking, and audit history.
- [x] Secure submission attachments with shared storage, authorized download, and inline PDF preview.
- [x] Phase 6 unit/E2E coverage.

Deadline/escalation workers and advanced analytics remain follow-up tasks.

### Schema và domain

- [x] Thêm WorkflowTemplate và immutable WorkflowVersion.
- [x] Thêm FieldDefinition và validation/conditional rules.
- [x] Thêm ApprovalStep/edge/assignment.
- [x] Thêm Submission và SubmissionValue.
- [x] Thêm SubmissionStep/Decision.
- [x] Thêm Delegation.
- [x] Thêm submission comment/history.
- [x] Thêm submission attachment bằng FileLink/StoredFile dùng chung.
- [ ] Thêm deadline/escalation jobs.
- [x] Thêm constraints/indexes.
- [x] Tạo/chạy migration và seed ba workflow mẫu.

### Policy/service/API

- [x] Builder/admin policy.
- [x] Publish/version service.
- [x] Runtime form-schema validation.
- [x] Conditional visibility/routing evaluator.
- [x] Sequential/parallel approval engine.
- [x] Reviewer assignment.
- [ ] Draft/autosave/submit service.
- [x] Approve/reject/request-changes.
- [x] Delegation.
- [ ] Deadline/escalation.
- [x] Historical-version preservation.
- [x] Analytics/authorized CSV export.
- [x] Audit/outbox events.

### UI builder

- [x] Template settings.
- [ ] Field palette.
- [x] Ordered form canvas.
- [x] Field configuration.
- [x] Validation rules.
- [x] Conditional rules.
- [x] Approval graph/step editor.
- [x] Reviewer/deadline settings.
- [ ] Preview.
- [x] Draft/publish/version history.

### UI submission/review

- [x] Submission form renderer.
- [ ] Draft/autosave feedback.
- [ ] Validation summary.
- [x] Comment and shared discussion history.
- [x] Attachment upload/download và PDF preview.
- [ ] Review-before-submit.
- [x] Confirmation/status timeline.
- [ ] Reviewer queue/filter/deadline.
- [x] Decision flow với reason.
- [x] Delegation UI.
- [ ] Escalation UI.
- [x] Workflow analytics/export.
- [x] Loading/empty/error/forbidden states.

### Gate Phase 6

- [x] Unit tests evaluator/routing/state transitions.
- [x] Published immutability/historical-version tests.
- [x] Unauthorized reader/approver negative tests.
- [x] Integration sequential/parallel routing tests.
- [ ] E2E ba workflow mẫu.
- [ ] E2E request-changes/resubmit.
- [x] Responsive/keyboard/a11y checks.
- [x] Lint, typecheck, tests, E2E và build xanh.
- [x] Cập nhật docs.
- [x] Đóng gate Phase 6.

## Phase 7 — Câu lạc bộ và sự kiện

### Delivery slice completed

- [x] Tenant-scoped club catalog and lifecycle (draft/active/archive-ready).
- [x] Club applications and membership review.
- [x] Event proposal, approval and conflict-safe range validation.
- [x] Capacity-aware registration with deterministic waitlist position.
- [x] Demo seed and responsive club/event UI.
- [x] Phase 7 domain/E2E coverage for admin and student paths.

Budget, safety-plan, post-event report and parent-consent UI remain follow-up tasks.

### Schema và domain

- [x] Thêm Club, ClubApplication, ClubMembership và ClubRole.
- [x] Thêm ClubAnnouncement và ClubTask.
- [x] Thêm EventProposal liên kết workflow.
- [x] Thêm Event, Registration, Consent, Waitlist và Attendance.
- [x] Thêm ClubBudget, Expense, SafetyPlan và PostEventReport.
- [x] Thêm constraints/indexes.
- [x] Tạo/chạy migration và seed.

### Policy/service/API

- [x] Club ownership/leadership policy.
- [x] Application/membership transitions.
- [x] Announcement/task services.
- [x] Event proposal/workflow integration.
- [x] Event conflict/capacity checks.
- [x] Registration/waitlist.
- [x] Parent-linked consent.
- [x] Attendance.
- [x] Budget/expense controls.
- [x] Safety/report service.
- [x] Analytics.
- [x] Audit/outbox events.

### UI và luồng

- [x] Club directory/profile.
- [x] Join/application flow.
- [x] Leader workspace.
- [x] Roster/role management.
- [x] Announcement/task UI.
- [x] Event proposal/approval status.
- [x] Event directory/detail.
- [x] Registration/waitlist.
- [x] Parent consent.
- [x] Attendance check-in.
- [x] Budget/expense UI.
- [x] Safety plan/post-event report.
- [x] Analytics.
- [x] Loading/empty/error/forbidden states.

### Gate Phase 7

- [x] Unit tests transitions/consent/budget.
- [x] Leader ownership negative tests.
- [x] Parent-unlinked consent negative tests.
- [x] Event conflict integration test.
- [x] E2E proposal → approval → registration → consent → attendance → report.
- [x] E2E waitlist.
- [x] Responsive/keyboard/a11y checks.
- [x] Lint, typecheck, tests, E2E và build xanh.
- [x] Cập nhật docs.
- [x] Đóng gate Phase 7.

## Phase 8 — Cộng tác, thông báo và thời gian thực

### Schema và domain

- [x] Thêm Conversation, Participant và Message.
- [x] Thêm MessageAttachment, Mention và generic Comment.
- [x] Thêm Notification và NotificationPreference.
- [x] Hoàn thiện DomainOutboxEvent/EmailOutbox idempotency.
- [x] Thêm ActivityFeed projection.
- [x] Thêm constraints/indexes.
- [x] Tạo/chạy migration và seed.

### Policy/service/API

- [x] Conversation participant policy.
- [x] Message send/read service.
- [x] Attachment authorization.
- [x] Mention/comment service.
- [x] Domain event dispatcher.
- [x] Idempotent notification fan-out.
- [x] Preference-aware delivery.
- [x] Email outbox worker/retry.
- [x] Authenticated real-time channels.
- [x] Reconnect/catch-up/durable fallback.
- [x] Audit events.

### UI và luồng

- [x] Notification dropdown.
- [x] Notification history/filter/read state.
- [x] Notification preference.
- [x] Conversation list/detail.
- [x] Message composer/attachment/mention.
- [x] Contextual comments.
- [x] Activity timeline/feed.
- [x] Optimistic state chỉ nơi an toàn.
- [x] Reconnecting/offline/failure states.
- [x] Mobile messaging experience.

### Gate Phase 8

- [x] Unit tests idempotency/preferences.
- [x] Unauthorized subscribe/read/send negative tests.
- [x] Integration outbox/retry tests.
- [x] Integration real-time-down persistence test.
- [x] E2E real-time delivery.
- [x] E2E reconnect/fallback.
- [x] Responsive/keyboard/a11y checks.
- [x] Lint, typecheck, tests, E2E và build xanh.
- [x] Cập nhật docs.
- [x] Đóng gate Phase 8.

## Phase 9 — Báo cáo, tìm kiếm, hardening và phát hành

### Dashboard và báo cáo

- [x] Dashboard học sinh dùng dữ liệu thật.
- [x] Dashboard phụ huynh dùng dữ liệu thật.
- [x] Dashboard cố vấn dùng dữ liệu thật.
- [x] Dashboard staff/club leader/reviewer dùng dữ liệu thật.
- [x] Dashboard school admin dùng dữ liệu thật.
- [x] Dashboard platform admin dùng dữ liệu thật.
- [x] Reporting attendance/engagement.
- [x] Reporting mentoring có privacy projection.
- [x] Reporting workflow.
- [x] Reporting resources.
- [x] Reporting clubs/events.
- [x] Chart có table/text alternative.
- [x] Date range/filter/saved view.
- [x] Authorized CSV export có audit.

### Search, audit và vận hành

- [x] Global search index/query theo tenant/permission.
- [x] Keyboard-first command palette.
- [x] Quick actions theo quyền.
- [x] Audit explorer/filter/detail/export.
- [x] Usage counters.
- [ ] Quota enforcement và UI.
- [x] Retention/cleanup jobs.
- [x] Health/readiness endpoints.
- [ ] Structured logging.
- [x] Backup/restore runbook.

### Security hardening

- [x] Secure headers.
- [x] CSP phù hợp.
- [x] Rate limits toàn bộ sensitive endpoint.
- [x] Abuse controls.
- [x] CSRF review.
- [x] Cookie/session review.
- [x] Input/output validation review.
- [x] Upload/path traversal/MIME review.
- [x] Tenant-query audit.
- [x] Secret/artifact repository scan.
- [x] Dependency vulnerability review.
- [x] Error message/data leakage review.
- [x] No critical/high known issue.

### UX/accessibility/performance polish

- [x] Rà soát tiếng Việt toàn ứng dụng.
- [x] Rà soát nút chết/route giả/TODO user-facing.
- [x] Rà soát loading/empty/error/success/forbidden.
- [x] Rà soát responsive 320/375/768/1024/1440 px.
- [x] Rà soát keyboard-only critical paths.
- [x] Rà soát focus order/restore.
- [x] Rà soát semantics/labels/live regions.
- [x] Rà soát contrast và color-only state.
- [x] Rà soát reduced motion.
- [ ] Accessibility automated audit.
- [ ] Performance audit production build.
- [ ] Tối ưu Core Web Vitals/bundle/query bottleneck có bằng chứng.
- [x] Không console/network error trong happy paths.

### Final test matrix

- [x] Reset database sạch.
- [x] Chạy toàn bộ migrations.
- [x] Chạy seed.
- [x] Chạy unit tests.
- [x] Chạy DB integration tests.
- [x] Chạy toàn bộ Playwright E2E desktop.
- [x] Chạy Playwright mobile smoke/critical paths.
- [x] Chạy tenant-isolation matrix.
- [x] Chạy parent-privacy matrix.
- [x] Chạy role-permission matrix.
- [x] Chạy concurrency tests.
- [x] Chạy upload/access-control tests.
- [x] Chạy outbox/idempotency tests.
- [x] Chạy lint.
- [x] Chạy typecheck.
- [x] Chạy production build.
- [x] Chạy accessibility audit.
- [x] Chạy performance audit.
- [x] Chạy security review.

### Tài liệu và phát hành

- [x] Cập nhật specification.
- [x] Cập nhật architecture.
- [x] Cập nhật data model.
- [x] Cập nhật permissions matrix.
- [x] Cập nhật README setup/troubleshooting.
- [x] Document demo accounts và role walkthrough.
- [x] Document migration/seed/reset.
- [x] Document storage/email/realtime adapters.
- [x] Document backup/restore.
- [x] Document deployment/environment variables.
- [x] Document known limitations (nếu có, không critical/high).
- [x] Xác nhận repository sạch, không secret/artifact.
- [x] Hoàn thành release checklist.
- [x] Đóng gate Phase 9 và Final gate.

## Phase 10 — Chợ cố vấn ngang hàng (PDF realignment)

### Mô hình và domain

- [x] Thêm MentorRequest, MentorOffer, MentorEngagement + enums và migration.
- [x] Mở rộng MentorProfile: gradeLabel, achievements, rate range, certifiedByUnion, acceptingRequests.
- [x] Pure state-machine (validate request/offer, accept/withdraw/cancel, payment transitions).

### Policy/service/API

- [x] Marketplace permissions cho STUDENT/PARENT/MENTOR + commonSchool read.
- [x] postMentorRequest, submitMentorOffer, acceptMentorOffer (transaction, khóa request, từ chối offer khác, tạo engagement), withdraw, cancel, updateEngagementPayment.
- [x] Read queries tenant-scoped (open requests, my requests+offers, income).
- [x] Audit + outbox cho mọi mutation.

### UI và luồng

- [x] Hub /dashboard/mentoring/marketplace theo vai trò (đăng yêu cầu, duyệt/đề xuất, chấp nhận, thu nhập).
- [x] Sidebar entry và CTA từ danh bạ cố vấn.
- [x] Reframe danh bạ cố vấn (thành tích, chứng nhận, mức phí) và kho đề thi.
- [x] Loading/empty/error/success states.

### Gate Phase 10

- [x] Unit tests state machine (accept khóa offer khác, không tự đề xuất, payment).
- [x] Integration concurrent-accept (đúng một engagement), cross-tenant reject, audit/outbox.
- [x] Lint, typecheck, tests và production build xanh.
- [x] Browser verification luồng đăng yêu cầu → đề xuất → chấp nhận → thanh toán.
- [x] Seed cố vấn khóa trên + yêu cầu mở/đã ghép + engagement.
