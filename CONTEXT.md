# CONTEXT.md - Bối Cảnh Dự Án Badminton Sport Manager (BSM)

## 1. Giới Thiệu
**Badminton Sport Manager (BSM)** là ứng dụng web/mobile-first hỗ trợ trưởng nhóm (Captain), thủ quỹ và toàn bộ thành viên câu lạc bộ cầu lông phong trào:
1. **Hệ thống đa tài khoản**: Mỗi thành viên có tài khoản riêng để tự điểm danh (Self Check-in), tra cứu nợ và lịch sử đóng tiền.
2. **Lịch sinh hoạt & Buổi đánh (Sessions)**: Điểm danh 2 chiều (thành viên tự check-in hoặc thủ quỹ check-in hộ), ghi nhận nhanh số quả cầu tiêu hao (+ / -).
3. **Thu - Chi & Chia tiền linh hoạt**:
   - Thành viên gói tháng trọn gói (sân + cầu): 0đ/buổi.
   - Thành viên gói tháng chỉ sân: Chỉ chia tiền cầu tiêu hao phát sinh trong buổi.
   - Thành viên theo buổi / Khách vãng lai: Chia đều toàn bộ chi phí hoặc giá cố định.
4. **Quỹ nhóm & VietQR thanh toán 1 chạm**: Tự động tạo mã QR VietQR Napas247 cá nhân hóa với STK thủ quỹ và cú pháp chuyển khoản rõ ràng. Thủ quỹ kiểm tra thông báo và tick xác nhận `PAID`.

---

## 2. Các Thực Thể Chính Trong Hệ Thống (Domain Entities)
- **User (Tài khoản người dùng)**: Email, SĐT, Tên, Ảnh đại diện, Xác thực đăng nhập.
- **Club / Group (Nhóm cầu lông)**: Thông tin CLB, mã mời (Invite Code), STK ngân hàng nhận tiền VietQR, giá cầu mặc định.
- **Member (Hồ sơ thành viên trong CLB)**:
  - Phân quyền: `ADMIN`, `TREASURER`, `MEMBER`.
  - Loại hình hội viên: `FULL_MONTHLY`, `COURT_ONLY_MONTHLY`, `PAY_PER_SESSION`, `GUEST`.
- **Session (Buổi đánh)**: Thời gian, sân đấu, tiền sân, phụ phí, trạng thái.
- **SessionAttendance (Điểm danh & Tiền nộp)**: Check-in bởi ai, chi tiết chia tiền sân/cầu/nước, trạng thái (`UNPAID`, `PAID`, `COVERED_BY_SUBSCRIPTION`).
- **ShuttleLog**: Số lượng quả cầu đã bung hộp dùng trong buổi và đơn giá.
- **Transaction (Sổ quỹ)**: Thu tiền buổi đánh, tiền quỹ tháng, chi mua cầu, chi cọc sân.

---

## 3. Trạng Thái Dự Án Hiện Tại
- **Giai đoạn**: **Hoàn tất 100% Phase 1 & Đã Deploy Thành Công Lên Vercel + Supabase**.
- **Môi trường Production**:
  - Hosting: Vercel (CI/CD tự động kích hoạt khi push code lên GitHub `VuongHuyHoang/BSM_BadmintonSportManager`).
  - Database: Supabase PostgreSQL (Singapore Pooler).
  - Giao diện: Slush Design System (Neo-modern, high contrast, mobile-first touch targets $\ge 44$px).
- **Dữ liệu mẫu đã có sẵn trên Supabase**:
  - Tài khoản Admin (`admin@badminton.vn` / mật khẩu `123456`).
  - Tài khoản Thủ quỹ (`treasurer@badminton.vn` / mật khẩu `123456`).
  - Tài khoản Hội viên (`huy@badminton.vn` / mật khẩu `123456`).
  - CLB Cầu Lông Kỳ Hòa (Mã mời: `KYHOA-CLUB`).
  - 5 hội viên với 3 loại gói khác nhau, 1 buổi đánh mẫu và giao dịch quỹ.
- **Bước tiếp theo**: Bắt đầu **Phase 2: Quản lý CLB & Hồ sơ Hội viên** (Màn hình Đăng nhập/Đăng ký, Tạo CLB, Quản lý hội viên & Mã mời).
