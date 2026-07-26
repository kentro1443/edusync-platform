# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase5-6.spec.ts >> calendar tạo sự kiện, chặn trùng và xuất iCalendar
- Location: e2e/phase5-6.spec.ts:117:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /error=conflict/
Received string:  "http://127.0.0.1:3100/dashboard/calendar"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://127.0.0.1:3100/dashboard/calendar"

```

```yaml
- link "Chuyển đến nội dung chính":
  - /url: "#main-content"
- complementary:
  - link "EduTech - Trang chủ":
    - /url: /dashboard
    - text: EduTech Trường học kết nối
  - paragraph: Không gian làm việc
  - navigation "Điều hướng ứng dụng":
    - link "Tổng quan":
      - /url: /dashboard
    - link "Thành viên":
      - /url: /dashboard/admin/members
    - link "Cài đặt trường":
      - /url: /dashboard/admin/settings
    - link "Hồ sơ cá nhân":
      - /url: /dashboard/profile
    - link "Bảo mật":
      - /url: /dashboard/security
    - link "Cố vấn & Gia sư":
      - /url: /dashboard/mentoring
    - link "Chợ cố vấn":
      - /url: /dashboard/mentoring/marketplace
    - link "Kho tài liệu":
      - /url: /dashboard/resources
    - link "Lịch trường":
      - /url: /dashboard/calendar
    - link "Quy trình":
      - /url: /dashboard/workflows
    - link "Lịch hẹn & Đơn từ":
      - /url: /dashboard/appointments
    - link "CLB & Sự kiện":
      - /url: /dashboard/clubs-events
    - link "Tin nhắn":
      - /url: /dashboard/messages
    - link "Thông báo":
      - /url: /dashboard/notifications
    - link "Báo cáo":
      - /url: /dashboard/reports
    - link "Nhật ký kiểm toán":
      - /url: /dashboard/audit
  - button "Thu gọn thanh bên" [expanded]
  - text: ĐP
  - paragraph: E2E Điều phối
  - paragraph: Quản trị trường
- banner:
  - paragraph: Trường E2E Phase 5 6 71d65cfb
  - navigation "Đường dẫn trang":
    - list:
      - listitem:
        - link "Tổng quan":
          - /url: /dashboard
      - listitem: Lịch trường
  - button "Tìm kiếm trong ứng dụng": Tìm kiếm ⌘ K
  - link "Mời thành viên":
    - /url: /dashboard/admin/members?action=invite
  - group: Mở thông báo, 0 chưa đọc
  - group: Mở menu tài khoản ĐP
- main:
  - paragraph: Lịch & đặt chỗ
  - heading "Lịch trường rõ ràng, dễ điều phối" [level=1]
  - paragraph: Xem theo ngày, tuần hoặc tháng; tạo sự kiện, giữ chỗ và xuất lịch iCalendar trong phạm vi được phép.
  - link "Xuất iCalendar":
    - /url: /dashboard/calendar/ical?calendarId=68624fe8-ee9e-4b16-a794-4e07e23bf0af&from=2026-07-19T17:00:00.000Z&to=2026-07-26T17:00:00.000Z
  - link "Lịch hẹn cố vấn":
    - /url: /dashboard/appointments
  - link "Phòng & tài nguyên":
    - /url: /dashboard/calendar/resources
  - text: Hiển thị
  - combobox "Hiển thị":
    - option "Ngày"
    - option "Tuần" [selected]
    - option "Tháng"
  - text: Mốc thời gian
  - textbox "Mốc thời gian": 2026-07-26
  - text: Lịch
  - combobox "Lịch":
    - option "Lịch chung trường" [selected]
  - button "Áp dụng"
  - heading "Tuần làm việc" [level=2]
  - paragraph: 0 sự kiện trong phạm vi · múi giờ Asia/Ho_Chi_Minh
  - text: Lịch chung trường
  - status:
    - heading "Chưa có sự kiện" [level=3]
    - paragraph: Tạo lịch đầu tiên hoặc đổi mốc thời gian để xem dữ liệu.
  - heading "Tạo sự kiện" [level=2]
  - paragraph: Form ngắn, có kiểm tra trùng lịch và lặp lại tùy chọn.
  - text: Tên sự kiện (bắt buộc)
  - textbox "Tên sự kiện (bắt buộc)":
    - /placeholder: "Ví dụ: Họp tổ chuyên môn"
    - text: Sự kiện dùng phòng bị khóa
  - text: Bắt đầu (bắt buộc)
  - textbox "Bắt đầu (bắt buộc)": 2026-07-28T13:15
  - text: Kết thúc (bắt buộc)
  - textbox "Kết thúc (bắt buộc)": 2026-07-28T14:15
  - text: Địa điểm
  - textbox "Địa điểm":
    - /placeholder: Phòng 203 hoặc trực tuyến
  - text: Tài nguyên đặt chỗ
  - combobox "Tài nguyên đặt chỗ":
    - option "Không chọn tài nguyên"
    - option "Studio E2E · sức chứa 24" [selected]
  - text: Sức chứa (0 = không giới hạn)
  - spinbutton "Sức chứa (0 = không giới hạn)": "0"
  - text: Mô tả
  - textbox "Mô tả"
  - text: Lặp lại
  - combobox "Lặp lại":
    - option "Không lặp" [selected]
    - option "Mỗi tuần"
    - option "Mỗi ngày"
    - option "Mỗi tháng"
  - text: Số lần
  - spinbutton "Số lần"
  - button "Tạo sự kiện"
  - paragraph: Lịch riêng chỉ hiển thị với chủ sở hữu. Sự kiện đã hủy không xuất hiện trong iCalendar.
- alert
```

# Test source

```ts
  59  |   database = new Client({ connectionString: databaseUrl });
  60  |   await database.connect();
  61  |   const passwordHash = await hash(password, { type: argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1, hashLength: 32 });
  62  |   await database.query('INSERT INTO "School" (id, slug, name, "shortName", "updatedAt") VALUES ($1, $2, $3, $4, NOW())', [school.id, school.slug, school.name, school.shortName]);
  63  |   await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW())', [admin.id, admin.email, passwordHash, admin.displayName]);
  64  |   await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW())', [reviewer.id, reviewer.email, passwordHash, reviewer.displayName]);
  65  |   await database.query('INSERT INTO "User" (id, email, "normalizedEmail", "passwordHash", "displayName", "mustChangePassword", "updatedAt") VALUES ($1, $2, $2, $3, $4, false, NOW())', [student.id, student.email, passwordHash, student.displayName]);
  66  |   await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())', [admin.membershipId, school.id, admin.id]);
  67  |   await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())', [reviewer.membershipId, school.id, reviewer.id]);
  68  |   await database.query('INSERT INTO "SchoolMembership" (id, "schoolId", "userId", status, "joinedAt", "updatedAt") VALUES ($1, $2, $3, \'ACTIVE\', NOW(), NOW())', [student.membershipId, school.id, student.id]);
  69  |   await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'SCHOOL_ADMIN\')', [randomUUID(), admin.membershipId]);
  70  |   await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'SCHOOL_ADMIN\')', [randomUUID(), reviewer.membershipId]);
  71  |   await database.query('INSERT INTO "SchoolRoleAssignment" (id, "membershipId", role) VALUES ($1, $2, \'STUDENT\')', [randomUUID(), student.membershipId]);
  72  | });
  73  | 
  74  | test.afterAll(async () => {
  75  |   const files = await database.query<{ storageKey: string }>('SELECT "storageKey" FROM "StoredFile" WHERE "schoolId" = $1', [school.id]);
  76  |   await Promise.all(files.rows.map((file) => removeStoredKey(file.storageKey).catch(() => undefined)));
  77  |   await database.query('DELETE FROM "WorkflowSubmissionComment" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  78  |   await database.query('DELETE FROM "WorkflowSubmissionHistory" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  79  |   await database.query('DELETE FROM "WorkflowDecision" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  80  |   await database.query('DELETE FROM "WorkflowDelegation" WHERE "schoolId" = $1', [school.id]);
  81  |   await database.query('DELETE FROM "WorkflowSubmissionStep" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  82  |   await database.query('DELETE FROM "WorkflowSubmissionValue" WHERE "submissionId" IN (SELECT id FROM "WorkflowSubmission" WHERE "schoolId" = $1)', [school.id]);
  83  |   await database.query('DELETE FROM "WorkflowSubmission" WHERE "schoolId" = $1', [school.id]);
  84  |   await database.query('DELETE FROM "FileLink" WHERE "schoolId" = $1', [school.id]);
  85  |   await database.query('DELETE FROM "FileVersion" WHERE "fileId" IN (SELECT id FROM "StoredFile" WHERE "schoolId" = $1)', [school.id]);
  86  |   await database.query('DELETE FROM "StoredFile" WHERE "schoolId" = $1', [school.id]);
  87  |   await database.query('DELETE FROM "WorkflowApprovalStep" WHERE "versionId" IN (SELECT id FROM "WorkflowVersion" WHERE "templateId" IN (SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = $1))', [school.id]);
  88  |   await database.query('DELETE FROM "WorkflowFieldDefinition" WHERE "versionId" IN (SELECT id FROM "WorkflowVersion" WHERE "templateId" IN (SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = $1))', [school.id]);
  89  |   await database.query('DELETE FROM "WorkflowVersion" WHERE "templateId" IN (SELECT id FROM "WorkflowTemplate" WHERE "schoolId" = $1)', [school.id]);
  90  |   await database.query('DELETE FROM "WorkflowTemplate" WHERE "schoolId" = $1', [school.id]);
  91  |   await database.query('DELETE FROM "CalendarAttendance" WHERE "schoolId" = $1', [school.id]);
  92  |   await database.query('DELETE FROM "CalendarBooking" WHERE "schoolId" = $1', [school.id]);
  93  |   await database.query('DELETE FROM "RecurrenceException" WHERE "eventId" IN (SELECT id FROM "CalendarEvent" WHERE "schoolId" = $1)', [school.id]);
  94  |   await database.query('DELETE FROM "CalendarReminder" WHERE "schoolId" = $1', [school.id]);
  95  |   await database.query('DELETE FROM "CalendarEvent" WHERE "schoolId" = $1', [school.id]);
  96  |   await database.query('DELETE FROM "BlockedPeriod" WHERE "schoolId" = $1', [school.id]);
  97  |   await database.query('DELETE FROM "BookableResource" WHERE "schoolId" = $1', [school.id]);
  98  |   if (recurrenceRuleId) await database.query('DELETE FROM "RecurrenceRule" WHERE id = $1', [recurrenceRuleId]);
  99  |   await database.query('DELETE FROM "Calendar" WHERE "schoolId" = $1', [school.id]);
  100 |   await database.query('DELETE FROM "CalendarSource" WHERE "schoolId" = $1', [school.id]);
  101 |   await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" = $1', [admin.membershipId]);
  102 |   await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" = $1', [reviewer.membershipId]);
  103 |   await database.query('DELETE FROM "SchoolRoleAssignment" WHERE "membershipId" = $1', [student.membershipId]);
  104 |   await database.query('DELETE FROM "SchoolMembership" WHERE id = $1', [admin.membershipId]);
  105 |   await database.query('DELETE FROM "SchoolMembership" WHERE id = $1', [reviewer.membershipId]);
  106 |   await database.query('DELETE FROM "SchoolMembership" WHERE id = $1', [student.membershipId]);
  107 |   await database.query('DELETE FROM "Session" WHERE "userId" = $1', [admin.id]);
  108 |   await database.query('DELETE FROM "Session" WHERE "userId" = $1', [reviewer.id]);
  109 |   await database.query('DELETE FROM "Session" WHERE "userId" = $1', [student.id]);
  110 |   await database.query('DELETE FROM "User" WHERE id = $1', [admin.id]);
  111 |   await database.query('DELETE FROM "User" WHERE id = $1', [reviewer.id]);
  112 |   await database.query('DELETE FROM "User" WHERE id = $1', [student.id]);
  113 |   await database.query('DELETE FROM "School" WHERE id = $1', [school.id]);
  114 |   await database.end();
  115 | });
  116 | 
  117 | test("calendar tạo sự kiện, chặn trùng và xuất iCalendar", async ({ page }) => {
  118 |   await login(page);
  119 |   await page.goto("/dashboard/calendar");
  120 |   await expect(page.getByRole("heading", { name: "Lịch trường rõ ràng, dễ điều phối" })).toBeVisible();
  121 |   const start = new Date(Date.now() + 2 * 86_400_000);
  122 |   start.setMinutes(0, 0, 0);
  123 |   const end = new Date(start.getTime() + 60 * 60_000);
  124 |   const local = (date: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(date).replace(" ", "T");
  125 |   const calendarId = (await database.query<{ id: string }>('SELECT id FROM "Calendar" WHERE "schoolId" = $1 ORDER BY "createdAt" LIMIT 1', [school.id])).rows[0].id;
  126 |   await database.query('INSERT INTO "CalendarEvent" (id, "schoolId", "calendarId", "createdByUserId", title, "startsAt", "endsAt", location, "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, \'Phòng E2E\', NOW())', [randomUUID(), school.id, calendarId, admin.id, "Họp điều phối E2E", start, end]);
  127 |   // Use the month view so the assertion is robust regardless of which weekday
  128 |   // the suite runs on (the default week view only spans the current Mon–Sun).
  129 |   await page.goto("/dashboard/calendar?view=month");
  130 |   await page.waitForLoadState("networkidle");
  131 |   await expect(page.getByText("Họp điều phối E2E")).toBeVisible();
  132 |   await page.getByLabel("Tên sự kiện").fill("Sự kiện trùng E2E");
  133 |   await page.getByLabel("Bắt đầu").fill(local(new Date(start.getTime() + 30 * 60_000)));
  134 |   await page.getByLabel("Kết thúc").fill(local(new Date(end.getTime() + 30 * 60_000)));
  135 |   await page.getByRole("button", { name: "Tạo sự kiện" }).click();
  136 |   await expect(page).toHaveURL(/error=conflict/);
  137 |   await page.goto("/dashboard/calendar/resources");
  138 |   await expect(page.getByRole("heading", { name: "Phòng và tài nguyên đặt chỗ" })).toBeVisible();
  139 |   await page.getByLabel("Tên").fill("Studio E2E");
  140 |   await page.locator('form').filter({ has: page.getByRole("button", { name: "Thêm tài nguyên" }) }).locator('input[name="capacity"]').fill("24");
  141 |   await page.getByRole("button", { name: "Thêm tài nguyên" }).click();
  142 |   await expect(page).toHaveURL(/result=resource/);
  143 |   const resourceId = (await database.query<{ id: string }>('SELECT id FROM "BookableResource" WHERE "schoolId" = $1 AND name = $2', [school.id, "Studio E2E"])).rows[0].id;
  144 |   const blockedStart = new Date(start.getTime() + 6 * 60 * 60_000);
  145 |   const blockedEnd = new Date(blockedStart.getTime() + 60 * 60_000);
  146 |   await page.getByLabel("Tài nguyên").selectOption(resourceId);
  147 |   await page.getByLabel("Bắt đầu").fill(local(blockedStart));
  148 |   await page.getByLabel("Kết thúc").fill(local(blockedEnd));
  149 |   await page.getByLabel("Lý do").fill("Bảo trì E2E");
  150 |   await page.getByRole("button", { name: "Khóa khung giờ" }).click();
  151 |   await expect(page).toHaveURL(/result=blocked/);
  152 |   await page.goto("/dashboard/calendar");
  153 |   await page.waitForLoadState("networkidle");
  154 |   await page.getByLabel("Tên sự kiện").fill("Sự kiện dùng phòng bị khóa");
  155 |   await page.getByLabel("Bắt đầu").fill(local(new Date(blockedStart.getTime() + 15 * 60_000)));
  156 |   await page.getByLabel("Kết thúc").fill(local(new Date(blockedEnd.getTime() + 15 * 60_000)));
  157 |   await page.getByLabel("Tài nguyên đặt chỗ").selectOption(resourceId);
  158 |   await page.getByRole("button", { name: "Tạo sự kiện" }).click();
> 159 |   await expect(page).toHaveURL(/error=conflict/);
      |                      ^ Error: expect(page).toHaveURL(expected) failed
  160 |   const recurringStart = new Date(start.getTime() + 3 * 60 * 60_000);
  161 |   const recurringEnd = new Date(recurringStart.getTime() + 60 * 60_000);
  162 |   recurrenceRuleId = randomUUID();
  163 |   const recurringEventId = randomUUID();
  164 |   await database.query('INSERT INTO "RecurrenceRule" (id, frequency, interval, count, "byWeekday") VALUES ($1, \'WEEKLY\', 1, 3, ARRAY[]::integer[])', [recurrenceRuleId]);
  165 |   await database.query('INSERT INTO "CalendarEvent" (id, "schoolId", "calendarId", "createdByUserId", "recurrenceRuleId", title, "startsAt", "endsAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())', [recurringEventId, school.id, calendarId, admin.id, recurrenceRuleId, "Lịch lặp E2E", recurringStart, recurringEnd]);
  166 |   await page.goto(`/dashboard/calendar?view=day&date=${local(recurringStart).slice(0, 10)}`);
  167 |   await page.getByRole("link", { name: "Lịch lặp E2E" }).click();
  168 |   await expect(page.getByRole("heading", { name: "Ngoại lệ lịch lặp" })).toBeVisible();
  169 |   await page.getByLabel("Xử lý").selectOption("cancel");
  170 |   await page.getByRole("button", { name: "Lưu ngoại lệ" }).click();
  171 |   await expect(page).toHaveURL(/result=recurrence/);
  172 |   await expect(page.getByText("Đã hủy")).toBeVisible();
  173 |   await page.goto("/dashboard/calendar");
  174 |   const ical = await page.evaluate(async () => {
  175 |     const response = await fetch("/dashboard/calendar/ical");
  176 |     return { status: response.status, contentType: response.headers.get("content-type"), body: await response.text() };
  177 |   });
  178 |   expect(ical.status).toBe(200);
  179 |   expect(ical.contentType).toContain("text/calendar");
  180 |   expect(ical.body).toContain("Họp điều phối E2E");
  181 | });
  182 | 
  183 | test("workflow builder publish, submit và approve giữ version lịch sử", async ({ page, browser }) => {
  184 |   await login(page);
  185 |   const templateId = randomUUID();
  186 |   const versionId = randomUUID();
  187 |   await database.query('INSERT INTO "WorkflowTemplate" (id, "schoolId", "createdById", name, slug, description, "currentVersionId", "updatedAt") VALUES ($1, $2, $3, \'Xin tổ chức E2E\', $4, \'Quy trình kiểm tra Phase 6.\', $5, NOW())', [templateId, school.id, admin.id, `xin-to-chuc-${suffix}`, versionId]);
  188 |   await database.query('INSERT INTO "WorkflowVersion" (id, "templateId", version) VALUES ($1, $2, 1)', [versionId, templateId]);
  189 |   await database.query('INSERT INTO "WorkflowFieldDefinition" (id, "versionId", key, label, type, position, required) VALUES ($1, $2, \'title\', \'Tiêu đề\', \'TEXT\', 0, true), ($3, $2, \'reason\', \'Lý do\', \'TEXT\', 1, false), ($4, $2, \'kind\', \'Loại hồ sơ\', \'TEXT\', 2, false)', [randomUUID(), versionId, randomUUID(), randomUUID()]);
  190 |   await database.query('INSERT INTO "WorkflowApprovalStep" (id, "versionId", name, position, role) VALUES ($1, $2, \'Duyệt nội dung\', 0, \'SCHOOL_ADMIN\')', [randomUUID(), versionId]);
  191 |   await database.query('INSERT INTO "WorkflowApprovalStep" (id, "versionId", name, position, role, "parallelGroup") VALUES ($1, $2, \'Duyệt song song A\', 1, \'SCHOOL_ADMIN\', 1), ($3, $2, \'Duyệt song song B\', 2, \'SCHOOL_ADMIN\', 1)', [randomUUID(), versionId, randomUUID()]);
  192 |   await database.query('INSERT INTO "WorkflowApprovalStep" (id, "versionId", name, position, role, "conditionJson") VALUES ($1, $2, \'Chỉ duyệt hồ sơ VIP\', 3, \'SCHOOL_ADMIN\', $3::jsonb)', [randomUUID(), versionId, JSON.stringify({ field: "kind", operator: "equals", value: "VIP" })]);
  193 |   await page.goto(`/dashboard/workflows/${templateId}`);
  194 |   await expect(page.getByText("kind · TEXT")).toBeVisible();
  195 |   await expect(page.getByText("nhóm song song 1")).toHaveCount(2);
  196 |   await expect(page.getByText("Chỉ chạy khi kind equals VIP")).toBeVisible();
  197 |   const nextVersionId = randomUUID();
  198 |   await database.query('UPDATE "WorkflowVersion" SET "publishedAt" = NOW() WHERE id = $1', [versionId]);
  199 |   await database.query('INSERT INTO "WorkflowVersion" (id, "templateId", version) VALUES ($1, $2, 2)', [nextVersionId, templateId]);
  200 |   await database.query('UPDATE "WorkflowTemplate" SET status = \'PUBLISHED\', "currentVersionId" = $1, "updatedAt" = NOW() WHERE id = $2', [nextVersionId, templateId]);
  201 |   submissionId = randomUUID();
  202 |   await database.query('INSERT INTO "WorkflowSubmission" (id, "schoolId", "templateId", "versionId", "ownerUserId", status, "updatedAt") VALUES ($1, $2, $3, $4, $5, \'DRAFT\', NOW())', [submissionId, school.id, templateId, versionId, admin.id]);
  203 |   await database.query('INSERT INTO "WorkflowSubmissionStep" (id, "submissionId", "stepId", status) SELECT gen_random_uuid(), $1, id, \'PENDING\' FROM "WorkflowApprovalStep" WHERE "versionId" = $2', [submissionId, versionId]);
  204 |   await database.query('INSERT INTO "WorkflowSubmissionHistory" (id, "submissionId", "actorUserId", action, "toStatus") VALUES (gen_random_uuid(), $1, $2, \'CREATE\', \'DRAFT\')', [submissionId, admin.id]);
  205 |   await page.goto(`/dashboard/workflows/submissions/${submissionId}`);
  206 |   await page.waitForLoadState("networkidle");
  207 |   await page.getByLabel("Tiêu đề").fill("Hội thảo E2E");
  208 |   await page.getByLabel("Lý do").fill("Kiểm tra version bất biến.");
  209 |   await page.getByLabel("Loại hồ sơ").fill("STANDARD");
  210 |   await page.getByRole("button", { name: "Gửi hồ sơ" }).click();
  211 |   await expect(page).toHaveURL(/result=submitted/);
  212 |   await expect(page.getByText("SKIPPED · SCHOOL_ADMIN")).toBeVisible();
  213 |   const studentContext = await browser.newContext();
  214 |   const studentPage = await studentContext.newPage();
  215 |   await studentPage.goto("/login");
  216 |   await studentPage.locator("#email").fill(student.email);
  217 |   await studentPage.locator("#password").fill(password);
  218 |   await studentPage.getByRole("button", { name: "Đăng nhập" }).click();
  219 |   await expect(studentPage).not.toHaveURL(/\/login(?:\?|$)/);
  220 |   await studentPage.goto(`/dashboard/workflows/submissions/${submissionId}`);
  221 |   await expect(studentPage.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  222 |   await studentContext.close();
  223 |   await page.getByLabel("Bình luận mới").fill("Đã kiểm tra hồ sơ và nội dung đính kèm.");
  224 |   await page.getByRole("button", { name: "Gửi bình luận" }).click();
  225 |   await expect(page).toHaveURL(/result=comment/);
  226 |   await expect(page.getByText("Đã kiểm tra hồ sơ và nội dung đính kèm.")).toBeVisible();
  227 |   await page.locator('input[name="file"]').setInputFiles({
  228 |     name: "ho-so-quy-trinh-e2e.pdf",
  229 |     mimeType: "application/pdf",
  230 |     buffer: createMinimalPdf(),
  231 |   });
  232 |   await page.getByRole("button", { name: "Đính kèm tài liệu" }).click();
  233 |   await expect(page).toHaveURL(/result=attachment/);
  234 |   await expect(page.getByText("ho-so-quy-trinh-e2e.pdf")).toBeVisible();
  235 |   const previewHref = await page.getByRole("link", { name: "Xem PDF" }).getAttribute("href");
  236 |   const preview = await page.evaluate(async (href) => {
  237 |     const response = await fetch(href!);
  238 |     return {
  239 |       status: response.status,
  240 |       contentType: response.headers.get("content-type"),
  241 |       body: await response.text(),
  242 |     };
  243 |   }, previewHref);
  244 |   expect(preview.status).toBe(200);
  245 |   expect(preview.contentType).toContain("application/pdf");
  246 |   expect(preview.body.startsWith("%PDF-")).toBe(true);
  247 |   await page.getByLabel("Người duyệt mới").selectOption(reviewer.id);
  248 |   await page.getByLabel("Lý do chuyển").fill("Phân công người phụ trách chuyên môn.");
  249 |   await page.getByRole("button", { name: "Chuyển người duyệt" }).click();
  250 |   await expect(page).toHaveURL(/result=delegated/);
  251 |   await expect(page.getByText(`Đã giao: ${reviewer.displayName}`)).toBeVisible();
  252 |   await expect(page.getByRole("button", { name: "Duyệt", exact: true })).toHaveCount(0);
  253 |   const reviewerContext = await browser.newContext();
  254 |   const reviewerPage = await reviewerContext.newPage();
  255 |   await reviewerPage.goto("/login");
  256 |   await reviewerPage.locator("#email").fill(reviewer.email);
  257 |   await reviewerPage.locator("#password").fill(password);
  258 |   await reviewerPage.getByRole("button", { name: "Đăng nhập" }).click();
  259 |   await expect(reviewerPage).not.toHaveURL(/\/login(?:\?|$)/);
```