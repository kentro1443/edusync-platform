import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Breadcrumb, Pagination, Timeline } from "@/components/ui/Navigation";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

describe("design-system primitives", () => {
  it("exposes a disabled and announced loading state on buttons", () => {
    const markup = renderToStaticMarkup(<Button loading>Tiếp tục</Button>);

    expect(markup).toContain("disabled");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Đang xử lý");
  });

  it("gives icon-only actions an accessible name", () => {
    const markup = renderToStaticMarkup(
      <IconButton label="Đóng hộp thoại">
        <span aria-hidden="true">×</span>
      </IconButton>,
    );

    expect(markup).toContain('aria-label="Đóng hộp thoại"');
    expect(markup).toContain('type="button"');
  });

  it("connects field help and validation text to its control", () => {
    const markup = renderToStaticMarkup(
      <Field
        id="email"
        label="Email"
        description="Dùng email công vụ của trường."
        error="Email chưa hợp lệ."
        required
      >
        <Input id="email" name="email" type="email" />
      </Field>,
    );

    expect(markup).toContain('aria-describedby="email-description email-error"');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('role="alert"');
  });

  it("announces alerts and empty states with semantic roles", () => {
    const alert = renderToStaticMarkup(
      <Alert tone="warning" title="Cần xác nhận">
        Kiểm tra lại vai trò trước khi lưu.
      </Alert>,
    );
    const empty = renderToStaticMarkup(
      <EmptyState title="Chưa có thành viên" description="Mời thành viên đầu tiên." />,
    );

    expect(alert).toContain('role="status"');
    expect(alert).toContain("Cảnh báo");
    expect(empty).toContain('role="status"');
  });

  it("marks current navigation state for assistive technology", () => {
    const breadcrumb = renderToStaticMarkup(
      <Breadcrumb
        items={[
          { label: "Tổng quan", href: "/dashboard" },
          { label: "Thành viên" },
        ]}
      />,
    );
    const pagination = renderToStaticMarkup(
      <Pagination currentPage={2} totalPages={4} hrefForPage={(page) => `/members?page=${page}`} />,
    );

    expect(breadcrumb).toContain('aria-label="Đường dẫn trang"');
    expect(breadcrumb).toContain('aria-current="page"');
    expect(pagination).toContain('aria-current="page"');
  });

  it("renders timeline entries with machine-readable dates", () => {
    const markup = renderToStaticMarkup(
      <Timeline
        items={[
          {
            id: "created",
            title: "Tạo lời mời",
            description: "Đã gửi tới giáo viên.",
            datetime: "2026-07-23T01:00:00.000Z",
            displayTime: "08:00, 23/07/2026",
          },
        ]}
      />,
    );

    expect(markup).toContain('dateTime="2026-07-23T01:00:00.000Z"');
  });
});
