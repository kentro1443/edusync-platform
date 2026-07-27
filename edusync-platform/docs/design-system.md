# Hệ thống giao diện EduSync

## Nguyên tắc

- Giao diện và thông báo người dùng dùng tiếng Việt tự nhiên.
- Trạng thái không được truyền đạt chỉ bằng màu; luôn có nhãn hoặc biểu tượng kèm tên truy cập.
- Mọi control tương tác có vùng bấm tối thiểu 40–44 px, focus-visible rõ và thao tác được bằng bàn phím.
- Các mutation phải thể hiện loading, thành công và lỗi. Không dùng dữ liệu minh họa trong không gian vận hành.
- Layout ưu tiên mobile; bảng dữ liệu chuyển sang dạng hàng có nhãn tại màn hình nhỏ.

## Token

Token semantic nằm trong `src/app/globals.css`: brand, accent, ink, success, warning, danger, surface; cùng radius, shadow, focus và motion. Component không tự tạo màu thương hiệu riêng.

## Component

Các primitive trong `src/components/ui` bao phủ control form, feedback, bảng responsive, navigation, overlay, upload, ngày giờ và trạng thái tải/rỗng/lỗi/cấm. Component nghiệp vụ phải kết hợp các primitive này thay vì sao chép style.

## Shell

- Marketing shell có header desktop, menu mobile dạng modal, footer sitemap, metadata, sitemap XML và robots.
- App shell có sidebar desktop thu gọn được, drawer mobile, breadcrumb theo route, tìm kiếm nhanh bằng `⌘/Ctrl + K`, thông báo rỗng trung thực và menu tài khoản.
- Route chưa triển khai phải hiển thị `Sắp có`, không tạo liên kết chết.

## Kiểm tra trước khi merge

1. Chạy `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
2. Chạy E2E ở 320, 375, 768, 1024 và 1440 px.
3. Kiểm tra menu, dialog và form bằng bàn phím; Escape phải đóng overlay và trả focus.
4. Kiểm tra `prefers-reduced-motion`, horizontal overflow và console browser.
