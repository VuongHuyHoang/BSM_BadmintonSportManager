# TỔNG HỢP KỊCH BẢN KIỂM THỬ NGHIỆP VỤ (BUSINESS TEST CASES)
## Badminton Sport Manager (BSM)

---

## 1. MA TRẬN ĐỘ PHỦ KIỂM THỬ (TEST COVERAGE MATRIX)

| Phân Hệ | Số Lượng TC | Happy Path | Edge Cases | Concurrency & Security |
| :--- | :---: | :---: | :---: | :---: |
| **MOD-01: Xác Thực & Phân Quyền** | 5 | 2 | 2 | 1 |
| **MOD-02: Quản Lý CLB & Hội Viên** | 5 | 2 | 2 | 1 |
| **MOD-03: Vận Hành Buổi Đánh & Điểm Danh** | 6 | 2 | 3 | 1 |
| **MOD-04: Ghép Trận Sân Cầu** | 3 | 2 | 1 | 0 |
| **MOD-05: Thuật Toán Chia Bill & Làm Tròn** | 6 | 2 | 3 | 1 |
| **MOD-06: VietQR, Thanh Toán & Gạch Nợ** | 5 | 2 | 2 | 1 |
| **MOD-07: Sổ Quỹ & Quản Trị Kho Cầu** | 5 | 2 | 2 | 1 |
| **TỔNG CỘNG** | **35** | **14** | **15** | **6** |

---

## 2. KỊCH BẢN KIỂM THỬ CHI TIẾT THEO TỪNG MODULE

### PHÂN HỆ 1: XÁC THỰC & PHÂN QUYỀN (MOD-01)
- `TC-AUTH-01`: Đăng ký tài khoản người dùng thành công (Họ tên, Email, Mật khẩu $\ge 6$ ký tự).
- `TC-AUTH-02`: Đăng nhập với mật khẩu sai $\rightarrow$ Hiển thị thông báo thân thiện, không tiết lộ cấu trúc hệ thống.
- `TC-AUTH-03`: Thành viên vai trò `MEMBER` cố tình gọi Server Action của Admin/Treasurer $\rightarrow$ Trả về mã lỗi Unauthorized.
- `TC-AUTH-04`: Đăng nhập tài khoản cùng lúc trên 2 thiết bị $\rightarrow$ Phiên làm việc JWT/Cookie duy trì ổn định.
- `TC-AUTH-05`: Thành viên thuộc nhiều CLB khác nhau $\rightarrow$ Quyền hạn hiển thị chuẩn xác theo từng CLB (CLB A là Admin, CLB B chỉ là Member).

### PHÂN HỆ 2: QUẢN LÝ CLB & HỘI VIÊN (MOD-02)
- `TC-MEM-01`: Tạo CLB mới kèm thiết lập thông tin ngân hàng VietQR (Bin code, STK, Tên tài khoản).
- `TC-MEM-02`: Thêm khách vãng lai gắn kèm người bảo lãnh (`sponsorMemberId`).
- `TC-MEM-03`: Soft-delete hội viên đã có lịch sử tham gia buổi đánh $\rightarrow$ Đổi cờ `isActive = false`, giữ nguyên dữ liệu nợ và điểm danh cũ.
- `TC-MEM-04`: Thêm thành viên trùng số điện thoại/email trong cùng một CLB $\rightarrow$ Hệ thống cảnh báo trùng lặp.
- `TC-MEM-05`: Chuyển đổi gói hội viên từ `PAY_PER_SESSION` sang `FULL_MONTHLY` $\rightarrow$ Áp dụng từ buổi tiếp theo, không ảnh hưởng buổi cũ.

### PHÂN HỆ 3: VẬN HÀNH BUỔI ĐÁNH & ĐIỂM DANH (MOD-03)
- `TC-SES-01`: Tạo buổi đánh với số slot tối đa (`maxAttendees = 6`).
- `TC-SES-02`: Hội viên thứ 7 đăng ký $\rightarrow$ Tự động xếp vào `WAITLIST` với badge cảnh báo rõ ràng.
- `TC-SES-03`: Một hội viên `CONFIRMED` bấm rút lui $\rightarrow$ Hệ thống tự động đôn hội viên đầu tiên trong `WAITLIST` lên `CONFIRMED` (Auto-Promote).
- `TC-SES-04`: Hội viên tự bấm Check-in tại sân khi buổi đánh đang `IN_PROGRESS` $\rightarrow$ Cập nhật `isCheckedIn = true`.
- `TC-SES-05`: Chặn xóa buổi đánh khi đã có thành viên ở trạng thái `paymentStatus = 'PAID'`.
- `TC-SES-06`: Chuyển trạng thái buổi đánh sang `COMPLETED` $\rightarrow$ Số lượng cầu tiêu hao tự động trừ vào tồn kho CLB.

### PHÂN HỆ 4: GHÉP TRẬN SÂN CẦU (MOD-04)
- `TC-MAT-01`: Bốc thăm chia trận cho 8 người có mặt trên 2 sân $\rightarrow$ Mỗi sân 4 người (2 vs 2), không trùng lặp người chơi.
- `TC-MAT-02`: Bốc thăm với số lẻ người (ví dụ 7 người) $\rightarrow$ 4 người vào sân, 3 người ở hàng đợi nghỉ ngơi.
- `TC-MAT-03`: Sau khi kết thúc trận, bốc thăm lượt tiếp theo $\rightarrow$ Ưu tiên người chơi ít trận nhất và người vừa nghỉ ở lượt trước vào sân.

### PHÂN HỆ 5: THUẬT TOÁN CHIA BILL & LÀM TRÒN (MOD-05)
- `TC-FIN-01`: Chia bill chuẩn với 3 nhóm hội viên:
  - 2 FULL_MONTHLY: 0đ (`COVERED_BY_SUBSCRIPTION`).
  - 2 COURT_ONLY: Chia đều tiền cầu + phụ phí chung.
  - 2 PAY_PER_SESSION: Chia đều tiền sân + tiền cầu + phụ phí chung.
- `TC-FIN-02`: Làm tròn theo cấu hình `CEIL_1K` (ví dụ 43.200đ $\rightarrow$ 44.000đ).
- `TC-FIN-03`: Làm tròn theo cấu hình `CEIL_5K` (ví dụ 43.200đ $\rightarrow$ 45.000đ).
- `TC-FIN-04`: Ghi nhận phụ phí riêng (nước ngọt 15.000đ cho thành viên A) $\rightarrow$ Hóa đơn của A cộng đúng 15.000đ, không làm tăng hóa đơn người khác.
- `TC-FIN-05`: Hạch toán thặng dư làm tròn: Tổng thu từ mọi người - Tổng chi phí thực tế $\rightarrow$ Tự động tạo giao dịch `INCOME` vào Sổ Quỹ.
- `TC-FIN-06`: Không có thành viên nào check-in nhưng bấm chia tiền $\rightarrow$ Hệ thống thông báo lỗi, không sinh dữ liệu rác.

### PHÂN HỆ 6: VIETQR, THANH TOÁN & GẠCH NỢ (MOD-06)
- `TC-PAY-01`: Sinh link ảnh VietQR đơn buổi kèm đúng số tiền và cú pháp `BSM [Tên] [Mã_Buổi]`.
- `TC-PAY-02`: Sinh link ảnh VietQR gộp nợ tại trang Debt Tracker với số tiền bằng tổng nợ lũy kế.
- `TC-PAY-03`: Thủ quỹ bấm gạch nợ đơn buổi $\rightarrow$ Đổi trạng thái `paymentStatus = 'PAID'` và gán `paidAt = now()`.
- `TC-PAY-04`: Thủ quỹ bấm "Thanh toán tất cả" (Gạch nợ gộp) cho thành viên nợ 4 buổi $\rightarrow$ Cả 4 bản ghi chuyển sang `PAID` trong 1 giao dịch `db.$transaction`.
- `TC-PAY-05`: Bấm nút "Sao chép tin nhắn Zalo" $\rightarrow$ Clipboard nhận đúng định dạng văn bản tổng hợp danh sách nợ và STK ngân hàng.

### PHÂN HỆ 7: SỔ QUỸ & QUẢN TRỊ KHO CẦU (MOD-07)
- `TC-TRE-01`: Tạo kỳ quỹ tháng mới $\rightarrow$ Tự động sinh danh sách nộp tiền cho các thành viên cố định.
- `TC-TRE-02`: Xác nhận thành viên đóng quỹ tháng $\rightarrow$ Tự động tạo giao dịch Thu quỹ trong Sổ Quỹ.
- `TC-TRE-03`: Nhập kho 3 ống cầu kèm chi tiền quỹ 750.000đ $\rightarrow$ Kho cầu tăng 36 quả, Sổ Quỹ ghi nhận một giao dịch `EXPENSE` danh mục `BUY_SHUTTLE`.
- `TC-TRE-04`: Số dư quỹ CLB hiển thị theo thời gian thực đúng bằng Tổng thu trừ Tổng chi.
- `TC-TRE-05`: Cảnh báo sắp hết cầu khi tồn kho xuống dưới ngưỡng an toàn (dưới 12 quả).
