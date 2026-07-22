import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LiênKếtHọc — Nền tảng Smart School cho học sinh THPT",
    template: "%s | LiênKếtHọc",
  },
  description:
    "Nền tảng hợp nhất cố vấn học tập có xác minh, kho tài liệu ôn thi, lịch hẹn trực tuyến và số hóa quy trình phê duyệt CLB/sự kiện cho các trường THPT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">
          Chuyển đến nội dung chính
        </a>
        {children}
      </body>
    </html>
  );
}
