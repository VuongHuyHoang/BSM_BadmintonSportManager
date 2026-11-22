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
- **Giai đoạn**: **Hoàn tất 100% Phase 1 & Phase 2** (Đã xây dựng xong Authentication, Quản lý Đa CLB, Màn hình Hội viên, Thêm khách vãng lai và Mã mời).
- **Môi trường Production**:
  - Hosting: Vercel (CI/CD tự động kích hoạt khi push code lên GitHub `VuongHuyHoang/BSM_BadmintonSportManager`).
  - Database: Supabase PostgreSQL (Singapore Pooler).
  - Giao diện: Slush Design System (Refero Style `8b6b547f`).
- **Các trang đã hoàn thành trong Phase 2**:
  - `/login`: Đăng nhập (hỗ trợ nút điền nhanh 3 tài khoản mẫu Admin, Thủ quỹ, Huy).
  - `/register`: Đăng ký tài khoản mới.
  - `/dashboard`: Bảng điều khiển cá nhân, theo dõi số nợ, danh sách CLB của tôi.
  - `/clubs/new`: Tạo CLB mới, cấu hình STK ngân hàng VietQR & giá cầu.
  - `/clubs/[id]`: Chi tiết CLB, quản lý danh sách hội viên, phân loại 4 gói, thêm nhanh khách vãng lai.
  - `/join/[code]`: Trang tiếp nhận mã mời và tự động gia nhập CLB.
- **Bước tiếp theo**: Bắt đầu **Phase 3: Quản lý Buổi Đánh & Điểm Danh 2 Chiều** (Tạo lịch buổi đánh, bộ đếm số quả cầu +/-, điểm danh tại sân).
