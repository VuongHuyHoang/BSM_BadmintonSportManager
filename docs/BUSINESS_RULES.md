# BẢNG QUY TẮC NGHIỆP VỤ BẤT BIẾN (BUSINESS RULES MATRIX)
## Badminton Sport Manager (BSM)

---

## 1. PHÂN NHÓM 1: XÁC THỰC, PHÂN QUYỀN & HỘI VIÊN (BR-MEM)

| Mã Quy Tắc | Tên Quy Tắc | Nội Dung Chi Tiết Nghiệp Vụ | Cấp Độ Kiểm Soát |
| :--- | :--- | :--- | :---: |
| **BR-MEM-01** | Quyền hạn Trưởng nhóm (Admin) | Chỉ tài khoản có vai trò `ADMIN` mới được phép đổi vai trò thành viên, phân quyền Thủ quỹ, cấu hình thông tin ngân hàng VietQR của CLB và thực hiện xóa mềm thành viên. | **Server Action & UI** |
| **BR-MEM-02** | Quyền hạn Thủ quỹ (Treasurer) | Thủ quỹ có đầy đủ quyền thao tác về mặt tài chính: tạo/sửa buổi đánh, điểm danh, đếm cầu, ghi phụ phí, chia bill, gạch nợ, thu quỹ tháng và quản lý kho cầu. Không thể thay đổi cấu hình tài khoản nhận tiền của CLB nếu không có quyền Admin. | **Server Action & UI** |
| **BR-MEM-03** | Khách vãng lai & Bảo lãnh | Khách vãng lai (`GUEST`) có thể không cần tài khoản hệ thống. Nếu có thông tin người bảo lãnh (`sponsorMemberId`), người bảo lãnh chịu trách nhiệm đôn đốc hoặc thanh toán thay nếu khách không thanh toán. | **Data Model & Logic** |
| **BR-MEM-04** | Nguyên tắc Xóa mềm (Soft-Delete) | Không bao giờ thực hiện Hard-Delete (xóa vĩnh viễn khỏi Database) đối với bản ghi `Member` đã có lịch sử điểm danh (`SessionAttendance`) hoặc nợ. Bắt buộc dùng cờ `isActive = false` để giữ trọn vẹn số liệu kế toán. | **Database & Logic** |
| **BR-MEM-05** | Phân loại Hội viên | Mỗi thành viên trong một CLB tại một thời điểm chỉ thuộc 1 trong 4 loại hình: `FULL_MONTHLY`, `COURT_ONLY_MONTHLY`, `PAY_PER_SESSION`, hoặc `GUEST`. Khi đổi loại hình, các buổi đánh đã diễn ra trong quá khứ không bị ảnh hưởng hồi tố. | **Business Logic** |
| **BR-MEM-06** | Độc lập giữa các CLB | Một tài khoản người dùng (`User`) có thể tham gia nhiều CLB khác nhau. Hồ sơ thành viên (`Member`), vai trò (`role`) và loại hình hội viên (`membershipType`) được quản lý độc lập tại từng CLB. | **Data Model** |

---

## 2. PHÂN NHÓM 2: VẬN HÀNH BUỔI ĐÁNH, SLOT & ĐIỂM DANH (BR-SES)

| Mã Quy Tắc | Tên Quy Tắc | Nội Dung Chi Tiết Nghiệp Vụ | Cấp Độ Kiểm Soát |
| :--- | :--- | :--- | :---: |
| **BR-SES-01** | Giới hạn Slot tối đa | Khi số lượng thành viên có trạng thái `attendanceStatus = 'CONFIRMED'` đạt trần `maxAttendees`, người đăng ký tiếp theo bắt buộc phải chuyển vào trạng thái `WAITLIST` (Danh sách chờ). | **Server Action** |
| **BR-SES-02** | Tự động đôn slot (Auto-Promote) | Khi một thành viên `CONFIRMED` rút lui (`leaveSession`) hoặc bị xóa khỏi buổi, hệ thống tự động tìm người đăng ký sớm nhất trong danh sách `WAITLIST` và cập nhật thành `CONFIRMED`. | **Server Action & DB Transaction** |
| **BR-SES-03** | Nguyên tắc Có mặt để chia bill | Chỉ những thành viên có cờ `isCheckedIn = true` mới được đưa vào danh sách phân bổ chi phí tiền sân và tiền cầu khi chia bill. Người có đăng ký nhưng vắng mặt (`isCheckedIn = false`) không bị chia tiền trừ khi Thủ quỹ có quy định phạt riêng. | **Financial Engine** |
| **BR-SES-04** | Chặn xóa buổi đánh có phát sinh tiền | Tuyệt đối không cho phép xóa một buổi đánh nếu trong buổi đó đã có ít nhất một thành viên ở trạng thái `paymentStatus = 'PAID'` nhằm bảo vệ tính minh bạch của dòng tiền. | **Server Action Validation** |
| **BR-SES-05** | Điểm danh 2 chiều | Thành viên chỉ được tự bấm Check-in trên điện thoại khi buổi đánh đang ở trạng thái `OPEN` hoặc `IN_PROGRESS`. Khi buổi đánh đã chuyển `COMPLETED`, chỉ Ban tổ chức mới có quyền điều chỉnh điểm danh. | **Server Action** |
| **BR-SES-06** | Cập nhật kho cầu tự động | Khi trạng thái buổi đánh chuyển sang `COMPLETED`, tổng số quả cầu đã ghi nhận (`shuttleCount`) phải được tự động trừ vào số lượng tồn kho cầu của CLB (`Club.shuttlecockInventory`). | **Server Action & DB Transaction** |
| **BR-SES-07** | Đóng băng dữ liệu khi Buổi Đánh Hoàn Tất (Session Finalization Lock) | Khi buổi đánh đã chuyển sang trạng thái `COMPLETED` và chốt bill, toàn bộ các thao tác thay đổi chi phí (tăng/giảm số cầu, phụ phí chung, phụ phí riêng), điểm danh và danh sách người tham gia đều bị KHÓA CHẶT ở cả Server Actions và giao diện UI để bảo vệ tính toàn vẹn tài chính. | **Server Action & UI Lock** |
| **BR-SES-08** | Hoàn trả tồn kho khi Mở lại Buổi Đánh (Re-open Session) | Nếu Ban tổ chức chủ động mở lại buổi đánh từ `COMPLETED` về `ONGOING`, hệ thống tự động hoàn trả lại số quả cầu đã tiêu thụ vào kho cầu của CLB, bảo đảm số lượng tồn kho luôn khớp 100% với thực tế. | **Server Action & DB Transaction** |

---

## 3. PHÂN NHÓM 3: TÀI CHÍNH, CHIA BILL & LÀM TRÒN TIỀN (BR-FIN)

| Mã Quy Tắc | Tên Quy Tắc | Nội Dung Chi Tiết Nghiệp Vụ | Cấp Độ Kiểm Soát |
| :--- | :--- | :--- | :---: |
| **BR-FIN-01** | Lưu trữ số nguyên VND | Tất cả các đại lượng tiền tệ (tiền sân, tiền cầu, phụ phí, tiền nợ, số dư quỹ) bắt buộc phải lưu trữ dưới dạng số nguyên `Int` (VND). Nghiêm cấm dùng số thực `Float`. | **Prisma Schema & Code** |
| **BR-FIN-02** | Miễn trừ tiền sân cho Gói Tháng | Thành viên `FULL_MONTHLY` và `COURT_ONLY_MONTHLY` được miễn 100% tiền sân trong buổi đánh (vì tiền sân đã được hạch toán trong quỹ tháng). | **Financial Engine** |
| **BR-FIN-03** | Miễn trừ tiền cầu cho Gói Trọn Gói | Thành viên `FULL_MONTHLY` được miễn 100% tiền cầu cơ bản của buổi đánh. Tiền cầu chỉ chia cho thành viên `COURT_ONLY_MONTHLY` và `PAY_PER_SESSION`/`GUEST`. | **Financial Engine** |
| **BR-FIN-04** | Phụ phí riêng không chia đều | Các chi phí cá nhân (nước suối, tăng lực, quấn cán vợt...) ghi nhận trong `AttendanceExtraItem` phải được cộng trực tiếp 100% vào hóa đơn của riêng cá nhân đó, không phân bổ cho người khác. | **Financial Engine** |
| **BR-FIN-05** | Quy tắc làm tròn lên (Ceil Rounding) | Mọi phép chia tiền lẻ bắt buộc phải làm tròn lên theo đơn vị cấu hình của CLB (`CEIL_1K` làm tròn lên 1.000đ, hoặc `CEIL_5K` làm tròn lên 5.000đ). Tuyệt đối không làm tròn xuống để tránh thâm hụt quỹ. | **Financial Engine** |
| **BR-FIN-06** | Hạch toán thặng dư làm tròn | Khoản chênh lệch thặng dư giữa Tổng tiền thu từ các thành viên và Chi phí thực tế của buổi đánh ($\Delta = Total_{collected} - Cost_{actual}$) bắt buộc phải được tự động ghi nhận thành giao dịch `INCOME` trong Sổ Quỹ CLB. | **Financial Engine & Treasury** |
| **BR-FIN-07** | Bất biến tổng thu | Tổng tiền thu thực tế từ buổi đánh luôn luôn $\ge$ Tổng chi phí thực tế phải trả: $Total_{collected} \ge Cost_{actual}$. | **Audit Invariant** |

---

## 4. PHÂN NHÓM 4: THANH TOÁN, VIETQR & GẠCH NỢ (BR-PAY)

| Mã Quy Tắc | Tên Quy Tắc | Nội Dung Chi Tiết Nghiệp Vụ | Cấp Độ Kiểm Soát |
| :--- | :--- | :--- | :---: |
| **BR-PAY-01** | Chuẩn hóa thông tin VietQR | Link VietQR Napas247 phải chứa đầy đủ thông tin: Mã Bin ngân hàng, Số tài khoản, Tên chủ tài khoản, Số tiền chính xác và Nội dung chuyển khoản định danh có tiền tố `BSM`. | **VietQR Helper** |
| **BR-PAY-02** | Gạch nợ nguyên tử (Atomic Debt Settle) | Khi thực hiện gạch nợ gộp nhiều buổi cho một thành viên (`settleAllDebtsForMember`), tất cả các bản ghi `SessionAttendance` có trạng thái `UNPAID` phải được chuyển sang `PAID` đồng thời trong một giao dịch cơ sở dữ liệu (`db.$transaction`). | **Server Action & DB** |
| **BR-PAY-03** | Tự động đánh dấu Gói Trọn Gói | Thành viên `FULL_MONTHLY` không có phụ phí riêng sẽ có số tiền phải nộp là 0đ và tự động mang trạng thái `paymentStatus = 'COVERED_BY_SUBSCRIPTION'`, không hiển thị trong danh sách nợ. | **Financial Engine** |
| **BR-PAY-04** | Ghi nhận thời điểm thanh toán | Khi một khoản nợ được gạch (`paymentStatus = 'PAID'`), hệ thống bắt buộc phải cập nhật trường `paidAt = now()` để phục vụ đối soát lịch sử dòng tiền. | **Database & Action** |

---

## 5. PHÂN NHÓM 5: SỔ QUỸ, QUỸ THÁNG & KHO CẦU (BR-TRE)

| Mã Quy Tắc | Tên Quy Tắc | Nội Dung Chi Tiết Nghiệp Vụ | Cấp Độ Kiểm Soát |
| :--- | :--- | :--- | :---: |
| **BR-TRE-01** | Tự động hạch toán Quỹ tháng | Khi Thủ quỹ xác nhận một thành viên đã đóng hội phí tháng (`MonthlyMemberPayment.isPaid = true`), hệ thống tự động sinh một giao dịch `INCOME` (hạng mục `SUBSCRIPTION_FEE`) vào Sổ Quỹ. | **Server Action & DB** |
| **BR-TRE-02** | Quy đổi đơn vị Kho Cầu | Kho cầu trong Database lưu trữ theo đơn vị Quả (piece). Khi nhập hàng theo Ống (tube), hệ thống tự động quy đổi: $1 \text{ Ống} = 12 \text{ Quả}$. | **Inventory Service** |
| **BR-TRE-03** | Nhập kho gắn liền Chi Quỹ | Khi tạo giao dịch mua cầu (`BUY_SHUTTLE`) trong Sổ Quỹ kèm số lượng ống, hệ thống tự động ghi nhận chi tiền quỹ và tăng số lượng tồn kho cầu tương ứng. | **Treasury Action** |
| **BR-TRE-04** | Công thức số dư quỹ thời gian thực | Số dư quỹ khả dụng của CLB tại bất kỳ thời điểm nào luôn bằng: $\text{Số dư} = \sum \text{Khoản Thu (INCOME)} - \sum \text{Khoản Chi (EXPENSE)}$. | **Treasury Query** |
