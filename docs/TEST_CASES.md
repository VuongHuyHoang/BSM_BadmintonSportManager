# TÀI LIỆU KỊCH BẢN KIỂM THỬ TOÀN DIỆN (SYSTEM TEST CASES)
## Hệ Thống Quản Lý Cầu Lông Phong Trào - Badminton Sport Manager (BSM)

Tài liệu này được biên soạn bởi **Đội ngũ QA & Lead Architect** nhằm chuẩn hóa quy trình kiểm thử toàn diện mọi tính năng và luồng nghiệp vụ của hệ thống BSM.

---

## 1. MA TRẬN PHẠM VI KIỂM THỬ (TEST MATRIX)

| Mã Module | Tên Phân Hệ | Phạm Vi Kiểm Thử Trọng Tâm | Mức Độ Quan Trọng |
| :--- | :--- | :--- | :---: |
| **MOD-01** | Xác Thực & Phân Quyền (Auth & RBAC) | Đăng ký, đăng nhập, bảo vệ Server Actions, chặn truy cập trái quyền | **Nghiêm ngặt (P0)** |
| **MOD-02** | Quản Lý CLB & Hội Viên | Tạo CLB, đổi vai trò, đổi gói hội viên, soft-delete, bảo lãnh khách | **Cao (P1)** |
| **MOD-03** | Vận Hành Buổi Đánh (Session) | Tạo buổi, sửa/xóa, điểm danh 2 chiều, slot & waitlist, xoay trận | **Cao (P1)** |
| **MOD-04** | Tính Tiền & Chia Bill (Splitting) | 3 mô hình chia tiền, phụ phí riêng/chung, làm tròn 1k/5k, thặng dư | **Tuyệt đối (P0)** |
| **MOD-05** | Thanh Toán & VietQR | Sinh link QR Napas247, gạch nợ đơn lẻ, thanh toán gộp nhiều buổi | **Cao (P1)** |
| **MOD-06** | Quỹ Tháng & Kho Cầu (Treasury) | Chu kỳ thu quỹ tháng, trừ kho cầu khi kết thúc buổi, nhập kho ống | **Cao (P1)** |
| **MOD-07** | Bảng Nợ & Báo Cáo Zalo | Gom nợ theo người, sao chép văn bản Zalo chuẩn định dạng | **Trung bình (P2)** |

---

## 2. DANH SÁCH CHI TIẾT TEST CASES

### MODULE 1: XÁC THỰC & PHÂN QUYỀN (AUTH & RBAC)

#### `TC-AUTH-01`: Đăng ký tài khoản mới thành công
- **Tiền điều kiện:** Chưa có tài khoản với email dự định đăng ký.
- **Các bước thực hiện:**
  1. Truy cập `/register`.
  2. Nhập Họ và tên ("Trần Văn Nam"), Email ("nam.tv@gmail.com"), Mật khẩu ("Abc@123456").
  3. Bấm "Tạo Tài Khoản".
- **Kết quả mong đợi:** Hệ thống mã hóa bcrypt mật khẩu, tạo bản ghi `User`, đăng nhập tự động và điều hướng về `/dashboard`.

#### `TC-AUTH-02`: Đăng nhập với mật khẩu không đúng
- **Các bước thực hiện:** Nhập đúng email nhưng sai mật khẩu tại `/login`.
- **Kết quả mong đợi:** Báo lỗi rõ ràng "Sai tài khoản hoặc mật khẩu", không cho phép truy cập.

#### `TC-AUTH-03`: Kiểm tra bảo mật Server Action phân quyền Leader
- **Tiền điều kiện:** Đăng nhập với tài khoản `MEMBER` bình thường (không phải ADMIN hay TREASURER).
- **Các bước thực hiện:** Cố tình gọi các hàm `createSession`, `deleteSession`, `togglePaymentStatus` qua console hoặc API.
- **Kết quả mong đợi:** Hệ thống chặn lại ở tầng server với thông báo lỗi: *"Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền..."*.

---

### MODULE 2: QUẢN LÝ CLB, HỘI VIÊN & BẢO LÃNH

#### `TC-MEM-01`: Thêm khách vãng lai kèm người bảo lãnh
- **Tiền điều kiện:** Đăng nhập tài khoản Leader tại trang CLB.
- **Các bước thực hiện:**
  1. Mở form thêm khách vãng lai.
  2. Nhập tên "Anh Dũng bạn Nam", SĐT "0912345678".
  3. Chọn người bảo lãnh: "Trần Văn Nam".
  4. Bấm Lưu.
- **Kết quả mong đợi:** Bản ghi `Member` được tạo với `membershipType = 'GUEST'`, `sponsorMemberId` trỏ đến ID của Nam.

#### `TC-MEM-02`: Xóa hội viên (Soft-Delete) không mất dữ liệu kế toán
- **Các bước thực hiện:** Leader bấm xóa hội viên đã có lịch sử tham gia các buổi đánh trước đó.
- **Kết quả mong đợi:** Hệ thống cập nhật cờ `isActive = false`. Hội viên không còn xuất hiện trong danh sách hoạt động nhưng **toàn bộ lịch sử điểm danh, số tiền nợ và giao dịch cũ vẫn còn nguyên vẹn 100%**.

---

### MODULE 3: VẬN HÀNH BUỔI ĐÁNH, SLOT & WAITLIST

#### `TC-SES-01`: Giới hạn Slot (Max Attendees) và Danh sách chờ (Waitlist)
- **Tiền điều kiện:** Buổi đánh cài đặt `maxAttendees = 4`. Hiện đã có 4 người `CONFIRMED`.
- **Các bước thực hiện:**
  1. Hội viên thứ 5 đăng nhập và bấm "Đăng Ký Tham Gia Buổi Đánh".
- **Kết quả mong đợi:**
  - Hệ thống ghi nhận hội viên vào danh sách với trạng thái `attendanceStatus = 'WAITLIST'`.
  - Hiển thị badge vàng: *"Danh Sách Chờ (Dự Bị)"*.
  - Thông báo: *"Buổi đánh đã đủ số lượng, bạn đã được xếp vào Danh Sách Chờ!"*.

#### `TC-SES-02`: Tự động đôn người từ Waitlist lên khi có người rút lui (Auto-Promote)
- **Tiền điều kiện:** 4 người `CONFIRMED`, 1 người `WAITLIST` (Người E).
- **Các bước thực hiện:**
  1. Người B trong danh sách chính thức bấm "Rút lui" (hoặc Thủ quỹ xóa B khỏi buổi).
- **Kết quả mong đợi:**
  - Người B bị xóa khỏi buổi.
  - Người E tự động được cập nhật `attendanceStatus = 'CONFIRMED'` và `isCheckedIn = true`.
  - Số lượng người chính thức vẫn duy trì đúng 4 người.

#### `TC-SES-03`: Chặn xóa buổi đánh đã có thành viên thanh toán tiền
- **Tiền điều kiện:** Buổi đánh đã có ít nhất 1 thành viên ở trạng thái `paymentStatus = 'PAID'`.
- **Các bước thực hiện:** Leader mở dialog Quản lý buổi đánh và bấm "Đồng Ý Xóa".
- **Kết quả mong đợi:** Hệ thống từ chối xóa và hiển thị cảnh báo: *"Không thể xóa buổi đánh đã có thành viên thanh toán tiền để bảo đảm an toàn quỹ"*.

---

### MODULE 4: TÍNH TIỀN, CHIA BILL & HẠCH TOÁN THẶNG DƯ

#### `TC-FIN-01`: Công thức chia tiền chuẩn 3 nhóm hội viên
- **Dữ liệu đầu vào:**
  - Tiền thuê sân: 180.000đ
  - Tiền cầu: 4 quả $\times$ 25.000đ = 100.000đ
  - Phụ phí chung: 20.000đ
  - Số người có mặt: 6 người (2 Trọn Gói Tháng, 2 Chỉ Sân Tháng, 2 Vãng Lai).
- **Kết quả mong đợi:**
  - Hội viên Trọn Gói Tháng: 0đ (`COVERED_BY_SUBSCRIPTION`).
  - Hội viên Chỉ Sân Tháng: $\lceil (100k + 20k) / 6 \rceil = 20.000$đ.
  - Hội viên Vãng Lai: $\lceil 180k/6 + (100k + 20k)/6 \rceil = 50.000$đ.

#### `TC-FIN-02`: Hạch toán tự động tiền dôi dư làm tròn vào Sổ Quỹ
- **Dữ liệu đầu vào:** Tiền lẻ phát sinh sau chia bill là 53.200đ, CLB chọn chế độ `CEIL_5K` $\rightarrow$ làm tròn thành 55.000đ. Khoản dôi dư phát sinh: $+1.800$đ $\times$ số người $= +7.200$đ.
- **Kết quả mong đợi:** Hệ thống tự động tạo 1 giao dịch `INCOME` trong bảng `Transaction` với hạng mục `SESSION_FEE` mang nội dung: *"Dôi dư làm tròn buổi đánh [Tên sân]"*.

---

### MODULE 5: THANH TOÁN GỘP & VIETQR

#### `TC-PAY-01`: Thanh toán gộp toàn bộ công nợ cho hội viên (Batch Settlement)
- **Tiền điều kiện:** Thành viên X đang nợ 3 buổi đánh: Buổi 1 (50.000đ), Buổi 2 (60.000đ), Buổi 3 (70.000đ). Tổng nợ: 180.000đ.
- **Các bước thực hiện:**
  1. Thủ quỹ vào tab "Theo Dõi Nợ CLB", thấy dòng của Thành viên X hiển thị: *"Tổng nợ: 180.000đ (3 buổi)"*.
  2. Bấm nút *"QR Gộp"* $\rightarrow$ Kiểm tra mã VietQR hiển thị đúng số tiền 180.000đ.
  3. Bấm nút *"Gạch Hết (3 buổi)"*.
- **Kết quả mong đợi:**
  - Cả 3 buổi đánh của Thành viên X đồng loạt chuyển sang `PAID` trong 1 atomic transaction.
  - Danh sách nợ đọng của CLB giảm đi 180.000đ ngay tức thì.

---

### MODULE 6: QUỸ THÁNG CỐ ĐỊNH & KHO CẦU

#### `TC-TREAS-01`: Tạo chu kỳ thu Quỹ Tháng mới
- **Các bước thực hiện:**
  1. Leader vào tab "Quỹ Tháng Cố Định", bấm "+ Tạo Kỳ Thu Quỹ Tháng Mới".
  2. Chọn Tháng 12/2026, mức thu mặc định: 500.000đ.
  3. Bấm "Tạo Kỳ Thu".
- **Kết quả mong đợi:**
  - Hệ thống tự động lọc ra tất cả hội viên gói tháng của CLB và sinh danh sách `MonthlyMemberPayment` với `isPaid = false`.
  - Hiển thị tiến độ thu: `0 / N người`.

#### `TC-TREAS-02`: Gạch nợ nộp quỹ tháng và tự động ghi Sổ Quỹ
- **Các bước thực hiện:** Thủ quỹ bấm nút check tròn bên cạnh tên hội viên A để xác nhận đã nộp 500.000đ.
- **Kết quả mong đợi:**
  - Trạng thái chuyển sang `Đã Nộp (✓)`.
  - Tab "Sổ Quỹ CLB" tự động xuất hiện 1 giao dịch `INCOME`, danh mục `MONTHLY_FUND`, số tiền 500.000đ mang tên hội viên A.
  - Nếu bấm hủy check $\rightarrow$ Giao dịch thu tương ứng trong Sổ Quỹ tự động bị xóa.

#### `TC-TREAS-03`: Tự động cộng/trừ Kho Cầu CLB
- **Các bước thực hiện:**
  1. Thủ quỹ vào Sổ Quỹ, thêm khoản Chi mua cầu (`BUY_SHUTTLE`), nhập "Số ống mua: 5 ống".
  2. Kiểm tra Widget Kho Cầu: Tăng thêm $5 \times 12 = 60$ quả.
  3. Kết thúc 1 buổi đánh có tiêu thụ 6 quả cầu (`status = COMPLETED`).
- **Kết quả mong đợi:** Widget Kho Cầu tự động giảm đi 6 quả ($Stock = Stock - 6$).

---

### MODULE 7: BẢO LÃNH VÀ BỐC THĂM XOAY TRẬN (MATCHMAKER)

#### `TC-ROT-01`: Bốc thăm công bằng dựa trên số trận đã đánh
- **Tiền điều kiện:** 6 người có mặt trên sân (P1 đã đánh 3 trận, P2 đã đánh 1 trận, P3 đã đánh 2 trận, P4 chưa đánh trận nào (0 trận), P5 đánh 1 trận, P6 đánh 2 trận).
- **Các bước thực hiện:** Bấm nút *"⚡ Bốc Thăm Công Bằng"*.
- **Kết quả mong đợi:**
  - Người P4 (0 trận), P2 (1 trận), P5 (1 trận) chắc chắn được chọn vào sân.
  - Người P1 (3 trận) được xếp nghỉ ngoài để đảm bảo tính công bằng.
- **Ghi nhận:** Bấm nút *"Trận Đấu Kết Thúc"* $\rightarrow$ Số trận của 4 người được chọn tự động tăng thêm 1.

---

## 3. CHECKLIST KIỂM THỬ TRƯỚC KHI DEPLOY PRODUCTION
- [x] Kiểm tra tương thích Mobile màn hình nhỏ (320px - 375px), không có cuộn ngang.
- [x] Đạt chuẩn Touch Target $\ge 44 \times 44$px cho tất cả các nút bấm tại sân.
- [x] Biên dịch TypeScript Strict Mode: 0 errors.
- [x] Tất cả giao dịch tài chính chạy trong `db.$transaction`.
- [x] Xóa dấu tiếng Việt an toàn cho mã VietQR Napas247 QuickLink.
- [x] Khóa xóa vĩnh viễn (Soft-delete) bảo vệ dữ liệu hội viên cũ.
