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
- **Giai đoạn**: **Hoàn tất 100% Phase 1 đến Phase 5 và Các Cải Tiến Thực Chiến Giai Đoạn 6**:
  - **Quỹ Tháng Cố Định (Monthly Subscription)**: Tạo đợt thu quỹ theo tháng, theo dõi danh sách nộp/chưa nộp, tự động hạch toán thu quỹ vào Sổ Quỹ.
  - **Thanh Toán Gộp Công Nợ (Batch Settlement)**: Quét 1 mã VietQR duy nhất gộp nhiều buổi nợ, Thủ quỹ gạch nợ hàng loạt 1 chạm trong atomic transaction.
  - **Giới Hạn Slot & Danh Sách Chờ (Waitlist Engine)**: Cài đặt sức chứa buổi đánh, tự động xếp vào danh sách chờ và tự động đôn người khi có chỗ trống.
  - **Bảng Bốc Thăm & Sắp Trận Live (Court Matchmaker)**: Thuật toán chia cặp 4 người công bằng dựa trên số trận đã đánh trên sân.
  - **Quản Lý Kho Cầu CLB (Shuttlecock Inventory)**: Nhập kho theo ống (12 quả/ống), tự động trừ kho khi kết thúc buổi đánh, cảnh báo sắp hết cầu.
  - **Bảo Lãnh Khách Vãng Lai (Guest Sponsorship)**: Gán hội viên bảo lãnh cho khách đến chơi.
  - **Bộ Test Case Toàn Diện**: `docs/TEST_CASES.md` và script kiểm thử tự động `scripts/test-system.ts`.
- **Môi trường Production**:
  - Hosting: Vercel (CI/CD tự động kích hoạt khi push code lên GitHub `VuongHuyHoang/BSM_BadmintonSportManager` nhánh `main`, Region: Singapore `sin1`).
  - Database: Supabase PostgreSQL (Singapore Pooler port 6543, pgbouncer=true).
  - Giao diện: Slush Design System (Paper White, viền đen 1px, shadow `[4px_4px_0px_#000000]`, touch target $\ge 44$px).
  - PWA: Progressive Web App hoàn chỉnh (`manifest.json`, icon 192x192 & 512x512, standalone mode).
- **Các trang chức năng đã hoàn thành**:
  - `/`: Trang giới thiệu Landing Page.
  - `/login`: Đăng nhập (hỗ trợ cả Email & Số điện thoại, không phân biệt hoa thường, nút bật/tắt xem mật khẩu, nút điền nhanh tài khoản mẫu).
  - `/register`: Đăng ký tài khoản (hỗ trợ nút xem mật khẩu, autoCapitalize none).
  - `/dashboard`: Bảng điều khiển cá nhân, cảnh báo nợ (Debt Tracker), danh sách CLB của tôi.
  - `/profile`: Trang cá nhân, lịch sử các buổi đánh đã thanh toán và danh sách nợ cần đóng.
  - `/clubs/new`: Tạo CLB mới, cấu hình STK ngân hàng VietQR & giá cầu.
  - `/clubs/[id]`: Trung tâm điều hành CLB 4-Tab (Buổi đánh, Sổ quỹ, Bảng nhắc nợ toàn CLB kèm tiện ích copy Zalo, Hội viên & Phân quyền).
  - `/clubs/[id]/sessions/new`: Tạo buổi đánh mới (bảo vệ quyền Admin/Treasurer 3 lớp).
  - `/sessions/[id]`: Chi tiết buổi đánh, điểm danh 2 chiều, bộ đếm cầu live, quản lý phụ phí riêng từng người (nước, quấn cán), gia hạn giờ chơi.
  - `/sessions/[id]/split`: Bảng chia tiền thông minh, sinh mã VietQR Napas247 động, xác nhận đã nộp 1-chạm, copy tóm tắt Zalo.
  - `/join/[code]`: Trang tiếp nhận mã mời và tự động gia nhập CLB.

---

## 4. Những Điểm Kỹ Thuật & Nghiệp Vụ Cần Chú Ý Cho AI Agent
1. **Kiểm tra quyền Server Actions**: Cần đảm bảo các Server Action cập nhật trạng thái buổi đánh, điểm danh và đếm cầu luôn được bọc trong hàm kiểm tra `auth()` và vai trò `ADMIN` / `TREASURER` trong CLB.
2. **Toàn vẹn dữ liệu khi xóa hội viên**: Không được dùng `db.member.delete` trực tiếp vì sẽ Cascade Delete toàn bộ lịch sử điểm danh và nợ cũ của hội viên; bắt buộc dùng Soft-Delete (`isActive = false`).
3. **Tính toán tài chính**: Tiền tệ trong database luôn là số nguyên VND (`Int`). Khi chia tiền, luôn áp dụng quy tắc làm tròn (lên 1k/5k) theo cấu hình CLB.
4. **Hạch toán tự động vào Sổ quỹ**: Phần tiền dôi dư từ làm tròn của các buổi đánh đã hoàn tất cần được đồng bộ tự động vào bảng `Transaction` để sổ quỹ luôn khớp với thực tế.
