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

- [ ] Lập inventory toàn bộ copy/route user-facing.
- [ ] Chuyển toàn bộ metadata và copy sang tiếng Việt tự nhiên.
- [ ] Xoá mọi thương hiệu cũ; chuẩn hoá EduTech.
- [ ] Chuẩn hoá thuật ngữ Việt cho role, status và action.
- [ ] Hoàn thiện navigation map marketing/app theo vai trò.

### Token và nền truy cập

- [ ] Xây token màu semantic, typography, spacing, radius, border, elevation và motion.
- [ ] Xây breakpoint/content-width responsive.
- [ ] Thêm global reset và baseline typography.
- [ ] Thêm skip link và semantic landmarks.
- [ ] Chuẩn hoá `:focus-visible`.
- [ ] Thêm reduced-motion rules.
- [ ] Kiểm tra contrast của text/control/status.
- [ ] Thêm utility cho visually-hidden và screen-reader status.

### Component library

- [ ] Hoàn thiện Button và IconButton với variants/loading/disabled.
- [ ] Hoàn thiện Link và navigation link.
- [ ] Hoàn thiện Input, Textarea và Field.
- [ ] Thêm Select/Combobox.
- [ ] Thêm Checkbox, Radio và Switch.
- [ ] Hoàn thiện Badge/Status indicator không phụ thuộc màu.
- [ ] Thêm Alert và inline feedback.
- [ ] Hoàn thiện Card chỉ cho hierarchy phù hợp.
- [ ] Thêm responsive Table và row actions.
- [ ] Thêm Tabs.
- [ ] Thêm Breadcrumb.
- [ ] Thêm Pagination.
- [ ] Thêm Dialog với focus trap/restore.
- [ ] Thêm Drawer/Sheet responsive.
- [ ] Thêm Menu/Dropdown.
- [ ] Thêm Tooltip cho supplementary content.
- [ ] Thêm Toast/live-region feedback.
- [ ] Thêm Skeleton/loading state.
- [ ] Thêm EmptyState/ErrorState/ForbiddenState.
- [ ] Thêm Avatar.
- [ ] Thêm Timeline/Activity item.
- [ ] Thêm file upload primitive.
- [ ] Thêm date/time and calendar primitives cần thiết.

### Marketing UI

- [ ] Rebuild responsive header và accessible mobile menu.
- [ ] Rebuild footer với sitemap và support links.
- [ ] Hoàn thiện trang chủ với hero, product preview, modules, roles, trust và CTA.
- [ ] Hoàn thiện trang Cố vấn.
- [ ] Hoàn thiện trang Tài nguyên.
- [ ] Hoàn thiện trang Lịch hẹn.
- [ ] Thêm trang Quy trình.
- [ ] Hoàn thiện trang Câu lạc bộ & sự kiện.
- [ ] Hoàn thiện Bảng giá.
- [ ] Hoàn thiện Bảo mật.
- [ ] Hoàn thiện Câu chuyện khách hàng.
- [ ] Hoàn thiện Trung tâm trợ giúp.
- [ ] Hoàn thiện form Đăng ký tư vấn với validation/success/error.
- [ ] Thêm SEO/social metadata, sitemap và robots.

### Authenticated shell

- [ ] Xây sidebar desktop responsive/collapsible.
- [ ] Xây mobile navigation drawer.
- [ ] Xây top bar, breadcrumb, search trigger, quick action, notification và user menu.
- [ ] Xây active-school presentation/switcher slot.
- [ ] Lọc navigation theo role/permission.
- [ ] Xây page header và content layouts.
- [ ] Xây loading, error, not-found và forbidden boundaries.
- [ ] Xây mobile table/list adaptation.
- [ ] Xây dashboard visual foundation theo vai trò.

### Gate Phase 1

- [ ] Unit/component tests cho primitives quan trọng.
- [ ] E2E marketing/app shell desktop.
- [ ] E2E mobile navigation.
- [ ] Keyboard-only menu/dialog/form checks.
- [ ] Reduced-motion check.
- [ ] Responsive check 320/375/768/1024/1440 px.
- [ ] Không còn copy tiếng Anh ngoài ngoại lệ có chủ ý.
- [ ] Không còn horizontal overflow bất ngờ.
- [ ] Lint, typecheck, tests và build xanh.
- [ ] Cập nhật docs giao diện.
- [ ] Đóng gate Phase 1.

## Phase 2 — Danh tính, tenant và quản trị

### Schema và migration

- [ ] Rà soát/hoàn thiện User, School, Membership và role assignments.
- [ ] Rà soát/hoàn thiện ParentStudentLink.
- [ ] Hoàn thiện Invitation lifecycle fields/indexes.
- [ ] Hoàn thiện Session revocation/expiry fields/indexes.
- [ ] Hoàn thiện PasswordResetToken.
- [ ] Thêm password-change-required state.
- [ ] Thêm audit indexes cần thiết.
- [ ] Tạo/chạy migration và cập nhật seed.

### Auth service và route

- [x] Xây login service với Argon2id và generic error.
- [x] Xây secure session creation/cookie.
- [x] Xây logout current session.
- [ ] Xây revoke other/all sessions.
- [x] Xây current-session resolver.
- [x] Xây active-school context persistence.
- [ ] Xây forced first-login password change.
- [ ] Xây forgot-password request với non-enumerating response.
- [ ] Xây reset-password consume-once flow.
- [ ] Xây invitation create/send/resend/revoke/accept/expire flow.
- [ ] Thêm auth rate limits.
- [ ] Thêm route guards cho anonymous/authenticated/school/platform (đã bảo vệ shell authenticated; còn school/platform guard dùng chung).
- [ ] Thêm CSRF-safe mutation approach.
- [ ] Thêm audit cho auth/admin actions.

### Authorization

- [ ] Chuẩn hoá typed permissions cho toàn bộ role.
- [ ] Xây tenant-scoped repository/service pattern.
- [ ] Kiểm tra active membership ở mọi school route.
- [ ] Xây ownership/assignment checks.
- [ ] Xây parent-linked-student projection.
- [ ] Tách platform scope và school scope rõ ràng.
- [ ] Thêm forbidden/not-found response an toàn.

### UI auth

- [x] Trang đăng nhập hoạt động thật.
- [x] Trang đổi mật khẩu lần đầu.
- [ ] Trang quên mật khẩu.
- [ ] Trang đặt lại mật khẩu.
- [ ] Trang chấp nhận lời mời.
- [x] Trang chọn/đổi trường.
- [ ] Trang membership inactive.
- [ ] Trang 403.
- [ ] Profile và security settings.
- [ ] Danh sách/quản lý session.

### UI quản trị

- [ ] School member list/search/filter/pagination.
- [ ] Invite-member form.
- [ ] Membership detail.
- [ ] Role assignment dialog.
- [ ] Membership deactivate/reactivate flow.
- [ ] Parent-student link management.
- [ ] School settings.
- [ ] Platform school directory.
- [ ] Platform school provisioning/detail.
- [ ] Visual warning khi thao tác platform scope.

### Gate Phase 2

- [ ] Unit tests password/session/token/policy.
- [ ] Integration tests login/session/revoke/invitation/reset.
- [ ] Integration tests tenant-scoped queries.
- [ ] Negative tests School A ↔ School B.
- [ ] Negative tests inactive membership.
- [ ] Negative tests parent/unlinked student/private projection.
- [ ] E2E mọi demo role đăng nhập/logout.
- [ ] E2E forced password change.
- [ ] E2E invitation và password reset.
- [ ] E2E active-school switching.
- [ ] E2E school/platform admin.
- [ ] Lint, typecheck, tests, E2E và build xanh.
- [ ] Cập nhật permissions/data-model/README.
- [ ] Đóng gate Phase 2.

## Phase 3 — Cố vấn và tư vấn

### Schema và domain

- [ ] Thêm MentorProfile, specialty và verification.
- [ ] Thêm MentorStudentAssignment.
- [ ] Thêm AvailabilityRule và AvailabilityException.
- [ ] Thêm AppointmentType, Appointment và AppointmentTransition.
- [ ] Thêm AppointmentWaitlist và Attendance.
- [ ] Thêm MentoringCase, Goal, SessionOutcome, Task và Referral.
- [ ] Thêm MentoringNote với visibility.
- [ ] Thêm constraints/indexes chống conflict.
- [ ] Tạo/chạy migration và seed dữ liệu cố vấn.

### Policy/service/API

- [ ] Mentor directory/search policy.
- [ ] Availability calculation service.
- [ ] Transactional booking service.
- [ ] Approval/reschedule/cancel transitions.
- [ ] Deterministic waitlist promotion.
- [ ] Attendance recording.
- [ ] Case lifecycle service.
- [ ] Goal/task/referral services.
- [ ] Note visibility projection.
- [ ] Audit/outbox events.
- [ ] Validation và rate/abuse limits phù hợp.

### UI và luồng

- [ ] Dashboard học sinh cho lịch/case/action.
- [ ] Dashboard cố vấn cho lịch/follow-up/case.
- [ ] Dashboard quản trị module.
- [ ] Mentor directory/search/filter.
- [ ] Mentor profile.
- [ ] Booking flow.
- [ ] Agenda/day/week views.
- [ ] Appointment detail/approval/reschedule/cancel.
- [ ] Waitlist state và promotion feedback.
- [ ] Attendance controls.
- [ ] Case list/search/filter.
- [ ] Case detail: tổng quan, mục tiêu, buổi gặp, công việc, file, hoạt động.
- [ ] Session outcome editor.
- [ ] Confidential note editor/marker/explanation.
- [ ] Referral flow.
- [ ] Loading/empty/error/conflict/forbidden states.

### Gate Phase 3

- [ ] Unit tests transitions/availability/privacy.
- [ ] Integration concurrent-booking test.
- [ ] Integration waitlist/audit/outbox tests.
- [ ] Negative note-visibility tests cho mọi role.
- [ ] E2E student → booking → mentor approval → session → attendance.
- [ ] E2E reschedule/cancel/waitlist.
- [ ] E2E parent privacy.
- [ ] Responsive/keyboard/a11y checks.
- [ ] Lint, typecheck, tests, E2E và build xanh.
- [ ] Cập nhật docs.
- [ ] Đóng gate Phase 3.

## Phase 4 — Tài nguyên và file

### Schema và domain

- [ ] Thêm Resource, ResourceVersion, Category và Tag.
- [ ] Hoàn thiện StoredFile/FileVersion/FileLink liên kết resource.
- [ ] Thêm moderation lifecycle và transitions.
- [ ] Thêm Comment, ResourceReport, Bookmark và Collection.
- [ ] Thêm analytics events/counters.
- [ ] Thêm constraints/indexes.
- [ ] Tạo/chạy migration và seed.

### Policy/service/API

- [ ] Resource visibility policy.
- [ ] Upload validation dung lượng/MIME/tên file.
- [ ] Authorized upload/download/preview.
- [ ] Draft/review/publish/reject/archive service.
- [ ] Immutable version enforcement.
- [ ] Rollback bằng version mới.
- [ ] Comment/report moderation.
- [ ] Bookmark/collection service.
- [ ] Analytics aggregation.
- [ ] Audit/outbox events.

### UI và luồng

- [ ] Library grid/list search-first.
- [ ] Category/tag/status filters.
- [ ] Resource detail/preview.
- [ ] Upload/editor flow với progress/retry.
- [ ] Moderation queue.
- [ ] Version history và rollback.
- [ ] Access/privacy settings.
- [ ] Comment/report flow.
- [ ] Bookmarks và collections.
- [ ] Analytics view.
- [ ] Loading/empty/error/forbidden states.

### Gate Phase 4

- [ ] Unit tests lifecycle/file rules.
- [ ] Integration upload/storage/version tests.
- [ ] Cross-tenant/private-file negative tests.
- [ ] Published immutability test.
- [ ] E2E author → reviewer → publish → reader → rollback.
- [ ] E2E invalid upload/recovery.
- [ ] Responsive/keyboard/a11y checks.
- [ ] Lint, typecheck, tests, E2E và build xanh.
- [ ] Cập nhật docs.
- [ ] Đóng gate Phase 4.

## Phase 5 — Lịch và đặt chỗ

### Schema và domain

- [ ] Thêm Calendar, CalendarSource và membership/visibility.
- [ ] Thêm CalendarEvent/Reservation.
- [ ] Thêm RecurrenceRule và RecurrenceException.
- [ ] Thêm Room/BookableResource và BlockedPeriod.
- [ ] Thêm Capacity/Waitlist/Attendance/Reminder.
- [ ] Thêm constraints/indexes.
- [ ] Tạo/chạy migration và seed.

### Policy/service/API

- [ ] Scoped-calendar policy.
- [ ] Recurrence expansion service.
- [ ] Conflict-detection service.
- [ ] Transactional reservation.
- [ ] Deterministic waitlist promotion.
- [ ] Attendance service.
- [ ] Reminder scheduling/outbox.
- [ ] Authorized iCalendar export.
- [ ] Real-time invalidation với durable fallback.
- [ ] Audit events.

### UI và luồng

- [ ] Month view.
- [ ] Week/day view.
- [ ] Mobile agenda.
- [ ] Calendar filters.
- [ ] Booking create/detail/edit.
- [ ] Conflict explanation và alternative.
- [ ] Capacity/waitlist state.
- [ ] Room/resource management.
- [ ] Recurrence/exception editor.
- [ ] Attendance check-in.
- [ ] Reminder settings.
- [ ] iCal export.
- [ ] Loading/empty/error/offline states.

### Gate Phase 5

- [ ] Unit tests recurrence/conflict/waitlist.
- [ ] Integration concurrent reservation.
- [ ] Integration recurrence exceptions.
- [ ] Export authorization tests.
- [ ] E2E booking/conflict/waitlist/promotion.
- [ ] E2E recurrence exception.
- [ ] Responsive/keyboard/a11y checks.
- [ ] Lint, typecheck, tests, E2E và build xanh.
- [ ] Cập nhật docs.
- [ ] Đóng gate Phase 5.

## Phase 6 — Công cụ tạo quy trình không-code

### Schema và domain

- [ ] Thêm WorkflowTemplate và immutable WorkflowVersion.
- [ ] Thêm FieldDefinition và validation/conditional rules.
- [ ] Thêm ApprovalStep/edge/assignment.
- [ ] Thêm Submission và SubmissionValue.
- [ ] Thêm SubmissionStep/Decision/Delegation.
- [ ] Thêm submission attachment/comment/history.
- [ ] Thêm deadline/escalation jobs.
- [ ] Thêm constraints/indexes.
- [ ] Tạo/chạy migration và seed ba workflow mẫu.

### Policy/service/API

- [ ] Builder/admin policy.
- [ ] Publish/version service.
- [ ] Runtime form-schema validation.
- [ ] Conditional visibility/routing evaluator.
- [ ] Sequential/parallel approval engine.
- [ ] Reviewer assignment.
- [ ] Draft/autosave/submit service.
- [ ] Approve/reject/request-changes.
- [ ] Deadline/escalation/delegation.
- [ ] Historical-version preservation.
- [ ] Analytics/authorized CSV export.
- [ ] Audit/outbox events.

### UI builder

- [ ] Template settings.
- [ ] Field palette.
- [ ] Ordered form canvas.
- [ ] Field configuration.
- [ ] Validation rules.
- [ ] Conditional rules.
- [ ] Approval graph/step editor.
- [ ] Reviewer/deadline settings.
- [ ] Preview.
- [ ] Draft/publish/version history.

### UI submission/review

- [ ] Submission form renderer.
- [ ] Draft/autosave feedback.
- [ ] Validation summary.
- [ ] Attachment/comment.
- [ ] Review-before-submit.
- [ ] Confirmation/status timeline.
- [ ] Reviewer queue/filter/deadline.
- [ ] Decision flow với reason.
- [ ] Delegation/escalation UI.
- [ ] Workflow analytics/export.
- [ ] Loading/empty/error/forbidden states.

### Gate Phase 6

- [ ] Unit tests evaluator/routing/state transitions.
- [ ] Published immutability/historical-version tests.
- [ ] Unauthorized approver negative tests.
- [ ] Integration sequential/parallel/escalation tests.
- [ ] E2E ba workflow mẫu.
- [ ] E2E request-changes/resubmit.
- [ ] Responsive/keyboard/a11y checks.
- [ ] Lint, typecheck, tests, E2E và build xanh.
- [ ] Cập nhật docs.
- [ ] Đóng gate Phase 6.

## Phase 7 — Câu lạc bộ và sự kiện

### Schema và domain

- [ ] Thêm Club, ClubApplication, ClubMembership và ClubRole.
- [ ] Thêm ClubAnnouncement và ClubTask.
- [ ] Thêm EventProposal liên kết workflow.
- [ ] Thêm Event, Registration, Consent, Waitlist và Attendance.
- [ ] Thêm ClubBudget, Expense, SafetyPlan và PostEventReport.
- [ ] Thêm constraints/indexes.
- [ ] Tạo/chạy migration và seed.

### Policy/service/API

- [ ] Club ownership/leadership policy.
- [ ] Application/membership transitions.
- [ ] Announcement/task services.
- [ ] Event proposal/workflow integration.
- [ ] Event conflict/capacity checks.
- [ ] Registration/waitlist.
- [ ] Parent-linked consent.
- [ ] Attendance.
- [ ] Budget/expense controls.
- [ ] Safety/report service.
- [ ] Analytics.
- [ ] Audit/outbox events.

### UI và luồng

- [ ] Club directory/profile.
- [ ] Join/application flow.
- [ ] Leader workspace.
- [ ] Roster/role management.
- [ ] Announcement/task UI.
- [ ] Event proposal/approval status.
- [ ] Event directory/detail.
- [ ] Registration/waitlist.
- [ ] Parent consent.
- [ ] Attendance check-in.
- [ ] Budget/expense UI.
- [ ] Safety plan/post-event report.
- [ ] Analytics.
- [ ] Loading/empty/error/forbidden states.

### Gate Phase 7

- [ ] Unit tests transitions/consent/budget.
- [ ] Leader ownership negative tests.
- [ ] Parent-unlinked consent negative tests.
- [ ] Event conflict integration test.
- [ ] E2E proposal → approval → registration → consent → attendance → report.
- [ ] E2E waitlist.
- [ ] Responsive/keyboard/a11y checks.
- [ ] Lint, typecheck, tests, E2E và build xanh.
- [ ] Cập nhật docs.
- [ ] Đóng gate Phase 7.

## Phase 8 — Cộng tác, thông báo và thời gian thực

### Schema và domain

- [ ] Thêm Conversation, Participant và Message.
- [ ] Thêm MessageAttachment, Mention và generic Comment.
- [ ] Thêm Notification và NotificationPreference.
- [ ] Hoàn thiện DomainOutboxEvent/EmailOutbox idempotency.
- [ ] Thêm ActivityFeed projection.
- [ ] Thêm constraints/indexes.
- [ ] Tạo/chạy migration và seed.

### Policy/service/API

- [ ] Conversation participant policy.
- [ ] Message send/read service.
- [ ] Attachment authorization.
- [ ] Mention/comment service.
- [ ] Domain event dispatcher.
- [ ] Idempotent notification fan-out.
- [ ] Preference-aware delivery.
- [ ] Email outbox worker/retry.
- [ ] Authenticated real-time channels.
- [ ] Reconnect/catch-up/durable fallback.
- [ ] Audit events.

### UI và luồng

- [ ] Notification dropdown.
- [ ] Notification history/filter/read state.
- [ ] Notification preference.
- [ ] Conversation list/detail.
- [ ] Message composer/attachment/mention.
- [ ] Contextual comments.
- [ ] Activity timeline/feed.
- [ ] Optimistic state chỉ nơi an toàn.
- [ ] Reconnecting/offline/failure states.
- [ ] Mobile messaging experience.

### Gate Phase 8

- [ ] Unit tests idempotency/preferences.
- [ ] Unauthorized subscribe/read/send negative tests.
- [ ] Integration outbox/retry tests.
- [ ] Integration real-time-down persistence test.
- [ ] E2E real-time delivery.
- [ ] E2E reconnect/fallback.
- [ ] Responsive/keyboard/a11y checks.
- [ ] Lint, typecheck, tests, E2E và build xanh.
- [ ] Cập nhật docs.
- [ ] Đóng gate Phase 8.

## Phase 9 — Báo cáo, tìm kiếm, hardening và phát hành

### Dashboard và báo cáo

- [ ] Dashboard học sinh dùng dữ liệu thật.
- [ ] Dashboard phụ huynh dùng dữ liệu thật.
- [ ] Dashboard cố vấn dùng dữ liệu thật.
- [ ] Dashboard staff/club leader/reviewer dùng dữ liệu thật.
- [ ] Dashboard school admin dùng dữ liệu thật.
- [ ] Dashboard platform admin dùng dữ liệu thật.
- [ ] Reporting attendance/engagement.
- [ ] Reporting mentoring có privacy projection.
- [ ] Reporting workflow.
- [ ] Reporting resources.
- [ ] Reporting clubs/events.
- [ ] Chart có table/text alternative.
- [ ] Date range/filter/saved view.
- [ ] Authorized CSV export có audit.

### Search, audit và vận hành

- [ ] Global search index/query theo tenant/permission.
- [ ] Keyboard-first command palette.
- [ ] Quick actions theo quyền.
- [ ] Audit explorer/filter/detail/export.
- [ ] Usage counters.
- [ ] Quota enforcement và UI.
- [ ] Retention/cleanup jobs.
- [ ] Health/readiness endpoints.
- [ ] Structured logging.
- [ ] Backup/restore runbook.

### Security hardening

- [ ] Secure headers.
- [ ] CSP phù hợp.
- [ ] Rate limits toàn bộ sensitive endpoint.
- [ ] Abuse controls.
- [ ] CSRF review.
- [ ] Cookie/session review.
- [ ] Input/output validation review.
- [ ] Upload/path traversal/MIME review.
- [ ] Tenant-query audit.
- [ ] Secret/artifact repository scan.
- [ ] Dependency vulnerability review.
- [ ] Error message/data leakage review.
- [ ] No critical/high known issue.

### UX/accessibility/performance polish

- [ ] Rà soát tiếng Việt toàn ứng dụng.
- [ ] Rà soát nút chết/route giả/TODO user-facing.
- [ ] Rà soát loading/empty/error/success/forbidden.
- [ ] Rà soát responsive 320/375/768/1024/1440 px.
- [ ] Rà soát keyboard-only critical paths.
- [ ] Rà soát focus order/restore.
- [ ] Rà soát semantics/labels/live regions.
- [ ] Rà soát contrast và color-only state.
- [ ] Rà soát reduced motion.
- [ ] Accessibility automated audit.
- [ ] Performance audit production build.
- [ ] Tối ưu Core Web Vitals/bundle/query bottleneck có bằng chứng.
- [ ] Không console/network error trong happy paths.

### Final test matrix

- [ ] Reset database sạch.
- [ ] Chạy toàn bộ migrations.
- [ ] Chạy seed.
- [ ] Chạy unit tests.
- [ ] Chạy DB integration tests.
- [ ] Chạy toàn bộ Playwright E2E desktop.
- [ ] Chạy Playwright mobile smoke/critical paths.
- [ ] Chạy tenant-isolation matrix.
- [ ] Chạy parent-privacy matrix.
- [ ] Chạy role-permission matrix.
- [ ] Chạy concurrency tests.
- [ ] Chạy upload/access-control tests.
- [ ] Chạy outbox/idempotency tests.
- [ ] Chạy lint.
- [ ] Chạy typecheck.
- [ ] Chạy production build.
- [ ] Chạy accessibility audit.
- [ ] Chạy performance audit.
- [ ] Chạy security review.

### Tài liệu và phát hành

- [ ] Cập nhật specification.
- [ ] Cập nhật architecture.
- [ ] Cập nhật data model.
- [ ] Cập nhật permissions matrix.
- [ ] Cập nhật README setup/troubleshooting.
- [ ] Document demo accounts và role walkthrough.
- [ ] Document migration/seed/reset.
- [ ] Document storage/email/realtime adapters.
- [ ] Document backup/restore.
- [ ] Document deployment/environment variables.
- [ ] Document known limitations (nếu có, không critical/high).
- [ ] Xác nhận repository sạch, không secret/artifact.
- [ ] Hoàn thành release checklist.
- [ ] Đóng gate Phase 9 và Final gate.