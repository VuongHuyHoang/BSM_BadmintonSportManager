# PRD - Đặc Tả Yêu Cầu Sản Phẩm (Product Requirements Document)

## 1. Tổng Quan Dự Án
- **Tên dự án**: Badminton Sport Manager (BSM).
- **Mục tiêu**: Xây dựng hệ thống web/mobile chuyên biệt cho các nhóm, câu lạc bộ cầu lông phong trào tại Việt Nam. 
- **Trọng tâm sản phẩm**: **Minh bạch tài chính, tự động tính tiền sân & tiền cầu, đa tài khoản thành viên (tự check-in, tự tra cứu số nợ) và tạo mã VietQR thanh toán 1 chạm**.

---

## 2. Mô Hình Người Dùng & Phân Quyền (User Personas & RBAC)
Hệ thống hoạt động theo mô hình **Đa tài khoản (Multi-user)**: mỗi người chơi đều có tài khoản riêng để chủ động tham gia hoạt động của CLB.

1. **Trưởng nhóm / Chủ sân (Club Admin)**:
   - Tạo câu lạc bộ, thiết lập thông tin ngân hàng thụ hưởng (VietQR), quản lý thành viên.
   - Phân quyền Thủ quỹ (Treasurer) hoặc Admin phụ.
   - Quản trị toàn diện lịch sinh hoạt và quỹ nhóm.
2. **Thủ quỹ (Treasurer)**:
   - Tạo buổi đánh, nhập tiền sân, cập nhật số quả cầu (+ / - nhanh ngay tại sân).
   - Kiểm tra điểm danh (xác nhận thành viên tự check-in hoặc check-in hộ khách vãng lai).
   - Chốt chi phí buổi đánh, gửi hóa đơn vào nhóm chat.
   - Nhận tiền chuyển khoản qua VietQR, đối soát và bấm tick xác nhận `PAID` (Đã nộp).
3. **Thành viên CLB (Member)**:
   - Đăng ký/Đăng nhập (Google OAuth, Số điện thoại hoặc Tài khoản mật khẩu).
   - Tham gia vào nhóm bằng mã mời (Invite Code / Link).
   - **Tự check-in**: Bấm xác nhận tham gia buổi đánh trên điện thoại.
   - **Cá nhân hóa tài chính**: Xem chi tiết số tiền phải nộp cho từng buổi, lịch sử đóng tiền, quét mã VietQR đã điền sẵn số tiền & nội dung chuyển khoản.
   - Xem công khai sổ quỹ của CLB (thu, chi, số dư).
4. **Khách vãng lai (Guest)**:
   - Người chơi giao lưu theo buổi, có thể do Thủ quỹ tạo nhanh tên trên hệ thống mà không bắt buộc tạo tài khoản ngay, hoặc tạo tài khoản để theo dõi lịch sử.

---

## 3. Các Tính Năng Cốt Lõi (Core Features)

### 3.1. Xác Thực & Hồ Sơ Thành Viên (Auth & Membership)
- Đăng nhập/Đăng ký an toàn (NextAuth.js / Supabase Auth).
- Phân loại gói hội viên linh hoạt:
  - **Gói Tháng Trọn Gói (Full Monthly)**: Đã bao gồm cả tiền sân và tiền cầu cho toàn bộ các buổi trong tháng.
  - **Gói Tháng Chỉ Tiền Sân (Court-Only Monthly)**: Tiền sân đóng cố định theo tháng, tiền cầu tiêu hao phát sinh sẽ chia theo số buổi thực tế có mặt.
  - **Thành viên theo buổi / Vãng lai (Pay-Per-Session / Guest)**: Chia tiền theo từng buổi tham gia (hoặc áp dụng mức giá cố định theo quy định CLB).

### 3.2. Quản Lý Buổi Đánh & Điểm Danh (Session & Attendance)
- **Tạo buổi đánh**: Ngày giờ, tên sân, thời lượng thuê, tiền sân thực tế.
- **Điểm danh 2 chiều**:
  - Thành viên tự mở app bấm Check-in khi đến sân.
  - Thủ quỹ kiểm tra và tick xác nhận có mặt (hoặc check-in nhanh cho người không mang điện thoại).
- **Ghi nhận quả cầu (Shuttlecock Counter)**:
  - Giao diện siêu nhanh: Nút `+` và `-` to bản để cộng trừ số quả cầu mở hộp trong buổi.
  - Đơn giá cầu lấy theo cài đặt mặc định của nhóm (có thể sửa linh hoạt).

### 3.3. Động Cơ Chia Tiền Thông Minh (Smart Expense Splitting Engine)
- Tự động phân loại chi phí theo từng đối tượng:
  - Thành viên trọn gói: Tiền buổi đánh = 0đ (Hệ thống ghi nhận trạng thái đã bao trọn).
  - Thành viên chỉ đóng sân tháng: Tiền buổi đánh = Tiền cầu chia đều + Phụ phí (nếu có).
  - Khách vãng lai / Đóng theo buổi: Chia đều toàn bộ (Tiền sân + Tiền cầu) hoặc tính giá vãng lai cố định.
- Cơ chế làm tròn tiền phong trào (Ceil lên 1.000đ hoặc 5.000đ).
- Phần chênh lệch dôi dư từ làm tròn tự động ghi nhận là khoản thu vào Quỹ nhóm.

### 3.4. Thanh Toán VietQR & Đối Soát Thủ Quỹ
- Sinh mã VietQR chuẩn Napas247 cá nhân hóa cho từng thành viên:
  - STK và ngân hàng của Thủ quỹ.
  - Số tiền chính xác sau khi đã làm tròn.
  - Nội dung chuyển khoản chuẩn: `BSM [Tên] [Mã_Buổi]`.
- Nút "Copy thông tin" hoặc "Tải ảnh QR" để gửi vào nhóm Zalo.
- Thủ quỹ kiểm tra thông báo tài khoản và bấm "Xác nhận đã nộp" trên màn hình quản lý buổi.

### 3.5. Sổ Quỹ & Minh Bạch Tài Chính (Treasury & Fund Balance)
- Ghi nhận mọi dòng tiền thu (tiền buổi, tiền tháng, tiền quỹ tài trợ) và chi (mua cầu, cọc sân, liên hoan).
- Báo cáo số dư quỹ tức thì, danh sách các thành viên còn nợ tiền buổi đánh.

---

## 4. Tiêu Chuẩn Phi Chức Năng (Non-Functional Requirements)

### 4.1. Tiêu Chuẩn Responsive Toàn Diện (Full Responsive Design)
Hệ thống bắt buộc phải hiển thị tối ưu và mượt mà trên cả 3 phân khúc thiết bị:
- **Mobile (Smartphones: 360px – 430px) - Trọng tâm trải nghiệm**:
  - Giao diện 1 cột tinh gọn, loại bỏ thanh cuộn ngang tuyệt đối (`overflow-x: hidden`).
  - Điểm danh 1 chạm, bộ đếm số quả cầu lớn, sticky action bar ở đáy màn hình.
  - Sử dụng Bottom Sheet (ngăn kéo kéo từ dưới lên) cho các tác vụ nhanh tại sân.
  - Vùng chạm tối thiểu $44 \times 44\text{px}$ cho tất cả các nút tương tác.
- **Tablet / iPad (768px – 1024px)**:
  - Tối ưu cho iPad để tại bàn nghỉ của sân cầu lông.
  - Chia 2 cột linh hoạt (Split-view): một bên danh sách người tham gia, một bên thông tin chi phí & QR chuyển khoản.
- **Desktop / Laptop (1024px – 1920px)**:
  - Tối ưu cho công việc quản trị của Thủ quỹ/Trưởng nhóm tại nhà hoặc văn phòng.
  - Sidebar điều hướng, bảng quản lý thành viên nhiều cột, biểu đồ tài chính trực quan.

### 4.2. Hiệu Năng & Khả Năng Hoạt Động Ngoại Tuyến (Performance & Offline-Readiness)
- **Tốc độ tải trang**: Tải trang dưới 1.5s trên mạng di động 4G.
- **Mạng yếu tại nhà thi đấu**: Lưu tạm trạng thái điểm danh (Local State/Cache) để không mất dữ liệu khi sân cầu lông nằm trong góc khuất sóng yếu.
- **Khả năng tiếp cận (Accessibility)**: Độ tương phản màu sắc đạt chuẩn WCAG AA để người dùng nhìn rõ ngoài trời hoặc dưới ánh đèn sân chói chang.
