import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EduSync — Nền tảng vận hành trường học kết nối",
    template: "%s | EduSync",
  },
  description:
    "Nền tảng hợp nhất cố vấn học tập có xác minh, kho tài liệu ôn thi, lịch hẹn trực tuyến và số hóa quy trình phê duyệt CLB/sự kiện cho các trường THPT.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "EduSync",
    title: "EduSync — Nền tảng vận hành trường học kết nối",
    description: "Kết nối con người, học liệu và quy trình nhà trường trong một không gian an toàn, minh bạch.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduSync — Nền tảng vận hành trường học kết nối",
    description: "Kết nối con người, học liệu và quy trình nhà trường trong một không gian an toàn, minh bạch.",
  },
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
