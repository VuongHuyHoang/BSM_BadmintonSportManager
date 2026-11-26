# BÁO CÁO ĐÁNH GIÁ & KIỂM ĐỊNH HỆ THỐNG TOÀN DIỆN (SYSTEM AUDIT REPORT)
## Dự án: Badminton Sport Manager (BSM)
### Thực hiện bởi: Senior Business Analyst, Senior Software Architect & Lead Developer

---

## 1. TỔNG QUAN ĐỢT ĐÁNH GIÁ (EXECUTIVE SUMMARY)

Đợt kiểm định toàn diện được tiến hành trên toàn bộ mã nguồn, cơ sở dữ liệu và tài liệu nghiệp vụ của dự án BSM tại commit `b21ae98`. 
Mục tiêu là đánh giá sự phù hợp giữa thiết kế kỹ thuật và nhu cầu thực tế vận hành nhóm cầu lông phong trào tại Việt Nam, phát hiện các điểm nghẽn logic, lỗ hổng rủi ro tài chính và đề xuất lộ trình tối ưu hóa.

### Đánh giá chung:
- **Kiến trúc tổng thể:** Đạt mức **Tốt (A-)**. Next.js 14 App Router kết hợp Prisma ORM và NextAuth.js v5 mang lại sự tinh gọn, hiệu năng cao và phân tách rõ ràng.
- **Mức độ đáp ứng nghiệp vụ sân cầu lông:** Đạt mức **Xuất sắc (A)**. Mô hình chia tiền 3 nhóm đối tượng linh hoạt, hỗ trợ làm tròn 1k/5k, hạch toán thặng dư vào sổ quỹ, cơ chế VietQR Napas247 và quản lý kho cầu theo quả giải quyết đúng 100% nỗi đau thực tế của các thủ quỹ cầu lông.
- **Tính toàn vẹn dữ liệu tài chính:** Đạt mức **Khá (B+)**. Đã áp dụng `Int` cho tiền tệ, soft-delete cho hội viên, và `db.$transaction` cho gạch nợ gộp. Tuy nhiên vẫn còn một số điểm cần gia cố thêm về mặt kiểm soát tương tranh và khóa dữ liệu sau khi chia tiền.

---

## 2. CÁC ĐIỂM SÁNG NGHIỆP VỤ & KIẾN TRÚC (SYSTEM STRENGTHS)

1. **Thuật toán phân bổ chi phí linh hoạt (Flexible Splitting Engine):**
   - Giải quyết triệt để bài toán nhóm hỗn hợp (có người đóng tháng trọn gói, có người chỉ đóng sân tháng, có khách vãng lai).
   - Tự động nhận diện `COVERED_BY_SUBSCRIPTION` cho hội viên trọn gói, không sinh ra nợ ảo.
2. **Cơ chế hạch toán Thặng Dư làm tròn (Rounding Surplus Accrual):**
   - Đây là phát kiến nghiệp vụ rất sắc sảo. Tại Việt Nam, làm tròn từ 43.200đ lên 45.000đ tạo ra tiền lẻ dôi dư. Hệ thống tự động đẩy khoản này vào Sổ Quỹ giúp quỹ nhóm tăng trưởng tự nhiên và minh bạch tuyệt đối.
3. **Cơ chế Soft-Delete bảo vệ lịch sử kế toán:**
   - Trường `isActive: Boolean` trên bảng `Member` giúp loại bỏ hội viên khỏi danh sách chọn của buổi đánh mới nhưng giữ nguyên 100% lịch sử các buổi cũ và số tiền nợ chưa trả.
4. **Quản lý Slot & Tự động đôn hàng đợi (Auto-Promote Waitlist):**
   - Vận hành mượt mà: Khi có người rút lui, người đầu tiên trong Waitlist lập tức được đôn lên danh sách chính thức, tối ưu hóa công suất sử dụng sân.
5. **Thanh toán gộp công nợ nguyên tử (`settleAllDebtsForMember`):**
   - Giải quyết trọn vẹn tình huống người chơi nợ 5-6 buổi gom lại chuyển khoản một lần. Bọc trong Prisma `$transaction` đảm bảo không bị lỗi gạch dở dang.

---

## 3. DANH MỤC CÁC PHÁT HIỆN & LỖ HỔNG NGHIỆP VỤ (AUDIT FINDINGS)

Dưới đây là danh mục các vấn đề được phát hiện trong quá trình rà soát chi tiết mã nguồn:

### Phát hiện AF-01: Tính lại hóa đơn có thể làm sai lệch các bản ghi đã thanh toán
- **Vị trí mã nguồn:** `src/server/actions/session.ts` $\rightarrow$ hàm `calculateAndSaveSessionFees`.
- **Mức độ nghiêm trọng:** **Cao (Severity: High - P1)**.
- **Trạng thái xử lý:** **ĐÃ GIẢI QUYẾT (RESOLVED)**.
- **Giải pháp đã triển khai:** Đã bổ sung logic bảo toàn dữ liệu: Nếu bản ghi `SessionAttendance` có `paymentStatus == 'PAID'`, hệ thống bảo vệ nguyên vẹn trạng thái `PAID`, thời điểm thanh toán `paidAt` và người xác nhận `confirmedBy`, không bị reset về `UNPAID`.

### Phát hiện AF-02: Chưa có cơ chế Hoàn kho khi Hủy hoặc Sửa buổi đánh đã Hoàn thành
- **Vị trí mã nguồn:** `src/server/actions/session.ts` $\rightarrow$ hàm `updateSessionStatus`.
- **Mức độ nghiêm trọng:** **Trung bình (Severity: Medium - P2)**.
- **Trạng thái xử lý:** **ĐÃ GIẢI QUYẾT (RESOLVED)**.
- **Giải pháp đã triển khai:** Khi buổi đánh chuyển từ `COMPLETED` sang các trạng thái khác (`ONGOING`, `SCHEDULED`, `CANCELLED`), hệ thống tự động cộng hoàn trả lại số quả cầu đã tiêu hao vào kho `Club.shuttleStock`.

### Phát hiện AF-03: Rủi ro thay đổi số cầu và chi phí khi buổi đánh đã Hoàn thành / Khóa tương tranh
- **Vị trí mã nguồn:** `src/server/actions/session.ts` $\rightarrow$ hàm `updateShuttleCount`, `updateSessionExtraFee`, `addExtraItemToAttendance`.
- **Mức độ nghiêm trọng:** **Cao (Severity: High - P1)**.
- **Trạng thái xử lý:** **ĐÃ GIẢI QUYẾT (RESOLVED)**.
- **Giải pháp đã triển khai:** Khóa chặt 100% các Server Actions và vô hiệu hóa nút bấm trên UI (bộ đếm cầu, phụ phí, điểm danh) khi buổi đánh ở trạng thái `COMPLETED`. Cung cấp nút "Mở lại buổi đánh" có hoàn kho rõ ràng.

### Phát hiện AF-04: Xóa thành viên bảo lãnh chưa có cảnh báo công nợ của khách
- **Vị trí mã nguồn:** `src/server/actions/member.ts` $\rightarrow$ hàm `removeMember`.
- **Mức độ nghiêm trọng:** **Thấp (Severity: Low - P3)**.
- **Trạng thái xử lý:** **ĐÃ GIẢI QUYẾT (RESOLVED)**.
- **Giải pháp đã triển khai:** Đã bổ sung kiểm tra nghiêm ngặt: Chặn xóa hội viên nếu bản thân hội viên hoặc khách vãng lai do hội viên đó bảo lãnh vẫn còn khoản nợ chưa thanh toán trong CLB.

---

## 4. MA TRẬN ĐÁNH GIÁ RỦI RO HỆ THỐNG (SYSTEM RISK MATRIX)

| Mã Rủi Ro | Phân Loại Rủi Ro | Khả Năng Xảy Ra | Mức Độ Ảnh Hưởng | Điểm Rủi Ro | Biện Pháp Kiểm Soát & Giảm Thiểu |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **RSK-01** | Sai lệch số tiền đã đóng khi tính lại bill | Trung bình | Nghiêm trọng | **CAO** | Đóng băng bản ghi có `paymentStatus = 'PAID'` khi chạy lại thuật toán chia tiền. |
| **RSK-02** | Lệch tồn kho cầu khi hoàn tác buổi hoàn thành | Thấp | Vừa phải | **TRUNG BÌNH** | Tự động cộng hoàn tồn kho khi trạng thái rời khỏi `COMPLETED`. |
| **RSK-03** | Thao tác đồng thời giữa 2 thủ quỹ tại sân | Thấp | Vừa phải | **TRUNG BÌNH** | Áp dụng atomic increments (`shuttleCount: { increment: 1 }`). |
| **RSK-04** | Nhập sai thông tin ngân hàng VietQR | Rất thấp | Nghiêm trọng | **TRUNG BÌNH** | Kiểm tra tính hợp lệ của mã Bin ngân hàng theo danh sách chuẩn Napas247. |

---

## 5. KẾ HOẠCH NÂNG CẤP & KHUYẾN NGHỊ HÀNH ĐỘNG (ACTION PLAN)

Theo nguyên tắc kiểm định nghiêm ngặt, chúng tôi đề xuất lộ trình chuẩn hóa hệ thống thành 3 giai đoạn:

1. **Giai đoạn 1 (Cấp bách - P0/P1):**
   - Gia cố hàm `calculateAndSaveSessionFees`: Bảo vệ các bản ghi đã `PAID`.
   - Bổ sung cơ chế hoàn tồn kho cầu khi chuyển đổi trạng thái buổi đánh.
2. **Giai đoạn 2 (Hoàn thiện trải nghiệm - P2):**
   - Tối ưu hóa câu thông báo khi xuất danh sách nợ Zalo (hỗ trợ phân biệt nợ cũ và nợ mới phát sinh).
   - Bổ sung cảnh báo nợ của khách khi thao tác trên người bảo lãnh.
3. **Giai đoạn 3 (Nâng cao & Mở rộng - P3):**
   - Bổ sung tính năng thông báo tự động (Web Push Notification) khi thành viên được đôn từ Waitlist lên chính thức.
   - Bổ sung biểu đồ trực quan hóa doanh thu và chi phí CLB theo từng quý.
