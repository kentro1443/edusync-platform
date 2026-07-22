import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

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
      className={`${beVietnam.variable} h-full antialiased`}
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