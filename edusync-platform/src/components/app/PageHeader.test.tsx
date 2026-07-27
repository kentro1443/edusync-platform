import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageHeader } from "@/components/app/PageHeader";

describe("PageHeader", () => {
  it("renders a semantic heading, description and action region", () => {
    const markup = renderToStaticMarkup(
      <PageHeader
        eyebrow="Quản trị"
        title="Thành viên"
        description="Quản lý quyền truy cập của nhà trường."
        actions={<button type="button">Mời thành viên</button>}
      />,
    );

    expect(markup).toContain("<h1");
    expect(markup).toContain("Thành viên");
    expect(markup).toContain('aria-label="Tác vụ trang"');
    expect(markup).toContain("Mời thành viên");
  });
});
