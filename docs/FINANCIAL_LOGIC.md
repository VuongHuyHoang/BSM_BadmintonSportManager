# Logic & Thuật Toán Phân Bổ Chi Phí (Financial Logic & Splitting Engine)

Tài liệu này đặc tả chính xác các công thức tính toán và phân bổ chi phí buổi đánh cầu lông cho hệ thống BSM theo mô hình hội viên linh hoạt.

---

## 1. Đại Lượng Đầu Vào Buổi Đánh (Session Inputs)
1. $C_{court}$: Tổng tiền thuê sân (VND).
2. $Q_{shuttle}$: Số lượng quả cầu đã mở hộp (Quả).
3. $P_{shuttle}$: Đơn giá 1 quả cầu (VND/quả).
4. $C_{shuttle} = Q_{shuttle} \times P_{shuttle}$: Tổng chi phí tiền cầu.
5. $C_{extra}$: Chi phí nước uống / phụ phí phát sinh (VND).
6. $N_{present}$: Tổng số người có mặt trên sân tham gia buổi đánh.

Trong đó $N_{present}$ được chia thành 3 nhóm hội viên:
- $N_{full}$: Số thành viên **Gói Tháng Trọn Gói** (`FULL_MONTHLY` - bao gồm cả sân và cầu).
- $N_{court\_only}$: Số thành viên **Gói Tháng Chỉ Sân** (`COURT_ONLY_MONTHLY` - chỉ bao gồm tiền sân, tiền cầu tính theo từng buổi).
- $N_{session}$: Số thành viên **Đóng Theo Buổi / Vãng Lai** (`PAY_PER_SESSION` hoặc `GUEST`).
$$\text{Thỏa mãn: } N_{present} = N_{full} + N_{court\_only} + N_{session}$$

---

## 2. Công Thức Tính Tiền Từng Đối Tượng (Flexible Splitting Formula)

### A. Đối với thành viên Gói Tháng Trọn Gói (`FULL_MONTHLY`)
Thành viên này đã đóng tiền cố định đầu tháng:
- **Số tiền phải nộp buổi này**:
  $$Fee_{full} = 0 \text{ VND}$$
- Trạng thái nộp tiền: `COVERED_BY_SUBSCRIPTION`.

### B. Đối với thành viên Gói Tháng Chỉ Sân (`COURT_ONLY_MONTHLY`)
Thành viên này không phải trả tiền sân, nhưng phải chịu tiền cầu và tiền phụ phí tiêu hao trong buổi:
- **Tiền cầu chia đều**:
  $$Share_{shuttle} = \frac{C_{shuttle}}{N_{present}}$$
- **Phụ phí chia đều**:
  $$Share_{extra} = \frac{C_{extra}}{N_{present}}$$
- **Tổng tiền thô**:
  $$Fee_{court\_only\_raw} = Share_{shuttle} + Share_{extra}$$
- **Làm tròn lên 1.000đ** (Mặc định):
  $$Fee_{court\_only} = \lceil \frac{Fee_{court\_only\_raw}}{1000} \rceil \times 1000$$

### C. Đối với thành viên Đóng Theo Buổi / Khách Vãng Lai (`PAY_PER_SESSION` / `GUEST`)
Chịu toàn bộ các khoản chi phí của buổi đánh (Tiền sân + Tiền cầu + Phụ phí) chia đều:
- **Tùy chọn 1: Tiền sân chia đều trên tổng số người có mặt thực tế** (Mặc định trong hệ thống):
  $$Share_{court} = \frac{C_{court}}{N_{present}}$$
  *(Thành viên gói tháng được miễn phần tiền sân này do đã đóng vào quỹ tháng đầu kỳ; khách vãng lai chỉ đóng đúng định mức phần sân chia đều theo đầu người của họ)*.
- **Tùy chọn 2: Mức Giá Vãng Lai Cố Định** (Ví dụ CLB quy định khách vãng lai luôn đóng 60.000đ hoặc 70.000đ/buổi):
  $$Fee_{session} = \text{Giá cố định} + \text{Phụ phí riêng từng người}$$
  *(Không cần chia lẻ tiền sân/cầu; khoản chênh lệch thặng dư sẽ chảy vào quỹ CLB)*.
- **Tùy chọn 3: Tiền sân chia trên số người đóng theo buổi** ($N_{session}$):
  $$Share_{court} = \frac{C_{court}}{N_{session}}$$
  *(Áp dụng cho các nhóm tự phát không có quỹ tháng, chi phí thuê sân chia đều cho những người trả theo buổi)*.

- **Tổng tiền thô (theo tùy chọn 1)**:
  $$Fee_{session\_raw} = Share_{court} + Share_{shuttle} + Share_{extra}$$
- **Làm tròn lên 1.000đ hoặc 5.000đ** (theo cấu hình CLB `CEIL_1K` / `CEIL_5K`):
  $$Fee_{session} = \lceil \frac{Fee_{session\_raw}}{RoundUnit} \rceil \times RoundUnit$$

---

## 3. Quản Lý Tiền Dôi Dư & Hạch Toán Quỹ Nhóm (Club Fund Accrual)
Tổng tiền thực tế thu từ các thành viên trong buổi đánh ($Total_{collected}$):
$$Total_{collected} = (N_{court\_only} \times Fee_{court\_only}) + (N_{session} \times Fee_{session}) + \sum \text{Phụ phí riêng}$$

- **Khoản chênh lệch thặng dư buổi đánh (Session Surplus)**:
  $$\Delta = Total_{collected} - Cost_{actual\_payable}$$
- **Cơ chế hạch toán**:
  - Hiện tại: Thủ quỹ có thể chủ động ghi nhận khoản dôi dư này vào tab **Sổ Quỹ** với danh mục `SESSION_SURPLUS` (Dôi dư buổi đánh).
  - Khuyến nghị nâng cấp tiếp theo: Tự động tạo giao dịch `INCOME` (hạng mục `SESSION_SURPLUS`) vào bảng `Transaction` ngay khi toàn bộ người tham gia hoàn tất thanh toán (`PAID`).

---

## 4. Cấu Trúc Mã VietQR Chuẩn
Khi thành viên mở hóa đơn buổi đánh, hệ thống tạo link ảnh VietQR:
```text
https://img.vietqr.io/image/<BANK_CODE>-<BANK_ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=<ADD_INFO>&accountName=<ACCOUNT_NAME>
```
- `<AMOUNT>`: Bằng $Fee_{court\_only}$ hoặc $Fee_{session}$.
- `<ADD_INFO>`: `BSM [Tên_Thành_Viên] [Mã_Buổi]` (Ví dụ: `BSM Tung Buoi1510`).
- **Xác nhận**: Thủ quỹ kiểm tra tài khoản báo có $\rightarrow$ Nhấn nút **Xác Nhận Đã Nộp** (`PAID`) trên app.
