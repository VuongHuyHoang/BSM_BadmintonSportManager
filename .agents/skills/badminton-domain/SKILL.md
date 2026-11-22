---
name: badminton-domain
description: >-
  Cung cấp kiến thức nghiệp vụ chuyên sâu về vận hành và quản lý nhóm cầu lông tại Việt Nam:
  cách tính tiền sân, tiền cầu, phân loại thành viên vãng lai và cố định, điểm danh 2 chiều,
  và tạo mã VietQR chuyển khoản thanh toán. Sử dụng khi thiết kế hoặc cài đặt tính năng liên quan đến buổi đánh và tài chính.
---

# Nghiệp Vụ Quản Lý Nhóm Cầu Lông (Badminton Domain Knowledge)

## 1. Cấu Trúc Buổi Đánh Cầu (Badminton Session)
Một buổi đánh tiêu chuẩn thường gồm các yếu tố:
- **Thời gian & Sân**: Số lượng sân (1 sân, 2 sân,...), khung giờ (VD: 18:00 - 20:00 = 2 tiếng).
- **Chi phí cố định**:
  - Tiền thuê sân: Đơn giá sân/giờ × Số giờ × Số sân (Ví dụ: 90.000đ/giờ × 2h = 180.000đ).
- **Chi phí tiêu hao tại sân**:
  - Cầu lông: Số lượng quả cầu đã bung hộp dùng trong buổi (Ví dụ: 5 quả × 25.000đ/quả = 125.000đ). Nhập nhanh bằng nút `+`/`-`.
  - Nước uống & Phụ phí: Nước khoáng, nước ngọt, cầu hỏng đền bù, phí gửi xe tập thể (nếu có).

## 2. Các Mô Hình Phân Bổ Chi Phí (Cost Distribution Models)

Hệ thống BSM hỗ trợ 3 nhóm hội viên đặc thù trong các CLB cầu lông Việt Nam:

1. **Gói Tháng Trọn Gói (`FULL_MONTHLY`)**:
   - Đóng phí cố định đầu tháng (bao gồm cả tiền sân và tiền cầu trọn gói).
   - Khi tham gia buổi đánh: Số tiền phải nộp hiển thị là **0đ (Đã bao trọn)**.
2. **Gói Tháng Chỉ Tiền Sân (`COURT_ONLY_MONTHLY`)**:
   - Đóng tiền sân cố định theo tháng vào quỹ nhóm.
   - Khi tham gia buổi đánh: Chỉ phải đóng tiền cầu tiêu hao chia đều trên tổng số người có mặt + tiền nước (nếu có).
3. **Thành Viên Đóng Theo Buổi / Khách Vãng Lai (`PAY_PER_SESSION` / `GUEST`)**:
   - Chịu toàn bộ chi phí sân và cầu chia đều cho những người đóng theo buổi (hoặc áp dụng mức giá vãng lai cố định của CLB).

## 3. Quy Trình Điểm Danh & Đối Soát Thanh Toán
1. **Điểm danh 2 chiều**: Thành viên tự mở app check-in khi đến sân, hoặc Thủ quỹ tick chọn trên danh sách.
2. **Chốt chi phí**: Sau khi buổi đánh kết thúc, Thủ quỹ kiểm tra số cầu đã dùng, hệ thống tự động tính ra số tiền mỗi người cần đóng.
3. **Tạo VietQR cá nhân hóa**: Thành viên quét mã chuyển khoản vào STK Thủ quỹ với cú pháp `BSM [Tên_Thành_Viên] [Mã_Buổi]`.
4. **Đối soát**: Thủ quỹ kiểm tra thông báo ngân hàng và bấm "Xác nhận đã nộp" (`PAID`) trên app.
