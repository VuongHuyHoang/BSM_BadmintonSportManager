# Quy Tắc Tính Toán Tài Chính (Finance Rules)

## 1. Nguyên Tắc Bất Di Bất Dịch
- **Không dùng số thực dấu phẩy động (Floating Point) trực tiếp**:
  - Tiền tệ tại Việt Nam là VND (không có xu lẻ). Tất cả số tiền trong DB phải là số nguyên (`integer` hoặc `bigint`).
  - Khi chia tiền (ví dụ: tổng 155.000đ chia 3 người = 51.666,67đ), phải có quy tắc làm tròn rõ ràng.

## 2. Quy Tắc Làm Tròn Tiền Trong Phong Trào Cầu Lông
- Trong thực tế tại Việt Nam, tiền lẻ rất khó chuyển khoản hoặc trả tiền mặt. Vì vậy, hệ thống hỗ trợ 3 chế độ làm tròn:
  1. **Làm tròn lên 1.000đ (Ceil 1k - Mặc định)**:
     - 51.200đ -> 52.000đ.
     - Phần dư ra (52.000 * 3 - 155.000 = 1.000đ) được tự động ghi nhận là **tiền cộng vào Quỹ nhóm**.
  2. **Làm tròn lên 5.000đ (Ceil 5k)**:
     - 51.200đ -> 55.000đ. Phần dôi dư cộng vào Quỹ nhóm.
  3. **Giữ nguyên chính xác**: Dùng cho thanh toán chuyển khoản chính xác từng đồng.

## 3. Trạng Thái Thanh Toán (Payment Status)
- Mỗi thành viên trong một buổi đánh chỉ có thể ở 1 trong 3 trạng thái:
  - `UNPAID` (Chưa nộp tiền): Cần hiển thị cảnh báo, tạo nút nhắc nợ hoặc quét QR.
  - `PAID` (Đã nộp tiền): Có ngày giờ xác nhận, người xác nhận (Thủ quỹ / Captain).
  - `SUBSCRIPTION` (Đã đóng theo tháng / Gói thành viên): Không tính tiền lẻ từng buổi, chỉ trừ lượt hoặc ghi nhận tham gia.
