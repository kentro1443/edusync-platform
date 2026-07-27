import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DataTable } from "@/components/ui/DataTable";
import { Avatar, DateTime, Tabs } from "@/components/ui/DataDisplay";
import { FileUpload } from "@/components/ui/FileUpload";
import { Dialog, Drawer, Menu, ToastRegion, Tooltip } from "@/components/ui/Overlays";

describe("interactive design-system primitives", () => {
  it("renders responsive table labels for mobile layouts", () => {
    const markup = renderToStaticMarkup(
      <DataTable
        caption="Danh sách thành viên"
        columns={[
          { key: "name", header: "Họ tên", primary: true },
          { key: "role", header: "Vai trò" },
        ]}
        rows={[{ id: "1", name: "Nguyễn Minh Anh", role: "Giáo viên" }]}
      />,
    );

    expect(markup).toContain("Danh sách thành viên");
    expect(markup).toContain('data-label="Vai trò"');
  });

  it("marks active tabs and initials-only avatars accessibly", () => {
    const tabs = renderToStaticMarkup(
      <Tabs
        label="Hồ sơ thành viên"
        items={[
          { label: "Tổng quan", href: "/members/1", active: true },
          { label: "Bảo mật", href: "/members/1/security" },
        ]}
      />,
    );
    const avatar = renderToStaticMarkup(<Avatar name="Nguyễn Minh Anh" />);

    expect(tabs).toContain('role="tablist"');
    expect(tabs).toContain('aria-selected="true"');
    expect(avatar).toContain('aria-label="Nguyễn Minh Anh"');
    expect(avatar).toContain("MA");
  });

  it("exposes dialog, drawer, menu and tooltip semantics", () => {
    const dialog = renderToStaticMarkup(
      <Dialog open title="Phân quyền" onClose={() => undefined}>
        Nội dung
      </Dialog>,
    );
    const drawer = renderToStaticMarkup(
      <Drawer open title="Bộ lọc" onClose={() => undefined}>
        Nội dung
      </Drawer>,
    );
    const menu = renderToStaticMarkup(
      <Menu label="Tác vụ" items={[{ label: "Xem chi tiết", href: "/detail" }]} />,
    );
    const tooltip = renderToStaticMarkup(<Tooltip content="Giải thích quyền">?</Tooltip>);

    expect(dialog).toContain('role="dialog"');
    expect(dialog).toContain('aria-modal="true"');
    expect(drawer).toContain('role="dialog"');
    expect(menu).toContain("Tác vụ");
    expect(tooltip).toContain('role="tooltip"');
  });

  it("provides a live region for transient feedback", () => {
    const markup = renderToStaticMarkup(
      <ToastRegion messages={[{ id: "saved", tone: "success", text: "Đã lưu thay đổi." }]} />,
    );

    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("Đã lưu thay đổi.");
  });

  it("describes upload constraints and machine-readable time", () => {
    const upload = renderToStaticMarkup(
      <FileUpload name="attachment" accept="application/pdf" maxSizeMb={10} />,
    );
    const time = renderToStaticMarkup(
      <DateTime value="2026-07-23T01:00:00.000Z">08:00, 23/07/2026</DateTime>,
    );

    expect(upload).toContain("PDF");
    expect(upload).toContain("10 MB");
    expect(time).toContain('dateTime="2026-07-23T01:00:00.000Z"');
  });
});
