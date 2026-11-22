# Kế Hoạch & Lộ Trình Phát Triển (BSM Roadmap)

Lộ trình chi tiết theo từng Sprint dành cho quá trình Vibe Coding với AI Agent. Lộ trình được thiết kế theo tư duy **Continuous Deployment** (Deploy lên mạng từ sớm để test trực tiếp trên điện thoại tại sân cầu lông).

---

## 📌 Phase 1: Khởi Tạo Nền Tảng, CSDL & Xác Thực (Foundation, DB & Auth)
- [x] Tạo cấu trúc thư mục quy chuẩn cho Vibe Coding (`.agents/`, `docs/`, `AGENTS.md`, `CONTEXT.md`).
- [x] Tích hợp bộ quy chuẩn thiết kế [frontend-design](file:///e:/BSM_BadmintonSportManager/.agents/skills/frontend-design/SKILL.md) và [coding-style](file:///e:/BSM_BadmintonSportManager/.agents/rules/coding-style.md).
- [x] Áp dụng hệ thống thiết kế thể thao hiện đại **Slush Design System** (Refero Style `8b6b547f`).
- [x] Khởi tạo dự án Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn UI, Lucide Icons.
- [x] Thiết lập hệ thống Xác thực Đa tài khoản (NextAuth.js v5 + Prisma Adapter) hỗ trợ Credentials & OAuth.
- [x] Cài đặt Prisma ORM, kết nối trực tiếp lên cơ sở dữ liệu Cloud PostgreSQL trên Supabase.
- [x] Tạo file seed dữ liệu mẫu (`prisma/seed.ts`): Đã nạp thành công 1 CLB mẫu (CLB Kỳ Hòa), 3 tài khoản Auth (Admin, Thủ quỹ, Hội viên), 5 hội viên thuộc 3 nhóm gói khác nhau, 1 buổi đánh mẫu và giao dịch quỹ lên Supabase.
- [x] Kiểm tra biên dịch sản phẩm (`npm run build`) hoàn tất 100% không có lỗi.
- [x] **Deploy thành công lên Vercel + Supabase**: Thiết lập hoàn tất đường ống tự động CI/CD (mỗi lần push code lên GitHub là web tự cập nhật).

---

## 🏸 Phase 2: Quản Lý CLB & Hồ Sơ Hội Viên (Club & Membership Management)
- [x] Hệ thống Đăng nhập & Đăng ký tài khoản (`/login`, `/register`) với mật khẩu băm bảo mật bcrypt và NextAuth v5.
- [x] Màn hình Bảng điều khiển cá nhân (`/dashboard`): Thống kê CLB tham gia, cảnh báo nợ chưa trả (Debt Tracker), nhập mã mời nhanh.
- [x] Luồng tạo Câu lạc bộ (`/clubs/new`): Cấu hình tên nhóm, STK ngân hàng VietQR (chọn ngân hàng VN), giá cầu mặc định, quy tắc làm tròn (1k/5k).
- [x] Cơ chế mã mời & liên kết nhanh (`/join/[code]`): Cho phép người chơi bấm link là tự động gia nhập CLB ngay lập tức.
- [x] Quản lý danh sách hội viên (`/clubs/[id]`):
  - Bộ lọc hội viên theo 4 nhóm: *Gói Tháng Trọn Gói*, *Gói Tháng Chỉ Tiền Sân*, *Đóng Theo Buổi*, *Khách Vãng Lai*.
  - Chức năng thêm nhanh khách vãng lai (không bắt buộc tạo tài khoản ngay) dành cho Thủ quỹ/Trưởng nhóm.
  - Phân quyền Trưởng nhóm / Thủ quỹ và thay đổi gói hội viên linh hoạt.
- [x] Kiểm tra biên dịch sản phẩm (`npm run build`) hoàn tất 100% không có lỗi (8 routes SSR & Dynamic).

---

## 📅 Phase 3: Quản Lý Buổi Đánh & Điểm Danh 2 Chiều (Session & Attendance)
- [x] Tạo lịch buổi đánh: Chọn ngày giờ, địa điểm sân, thời lượng thuê, đơn giá sân.
- [x] **Cơ chế Điểm danh 2 chiều**:
  - Hội viên tự mở app bấm Check-in khi đến sân.
  - Thủ quỹ kiểm tra, xác nhận và hỗ trợ check-in nhanh cho người không mang điện thoại.
- [x] **Bộ đếm số lượng quả cầu tiêu hao (Shuttlecock Counter)**:
  - Nút bấm `+` / `-` to bản ($> 44\text{px}$) thao tác cực nhanh bằng 1 ngón cái trên mobile.
  - Tự động nhân theo đơn giá cầu mặc định hoặc chỉnh sửa linh hoạt theo loại cầu bung hộp.
- [x] Ghi nhận phụ phí buổi đánh:
  - Phụ phí riêng từng người (nước uống, quấn cán, tất vớ) với box cửa sổ popup chuyên dụng, ô chọn số lượng, gộp dòng tự động và preset 1-chạm.
  - Phụ phí chung cả nhóm (nước đá, phí phát sinh).
  - Gia hạn số giờ đánh trên sân (tối đa 1 lần).

---

## 💰 Phase 4: Động Cơ Chia Tiền Thông Minh & VietQR (Smart Finance & Payment)
- [x] Triển khai động cơ tính tiền tự động theo công thức [FINANCIAL_LOGIC.md](file:///e:/BSM_BadmintonSportManager/docs/FINANCIAL_LOGIC.md):
  - Thành viên trọn gói: 0đ/buổi (`COVERED_BY_SUBSCRIPTION`).
  - Thành viên gói chỉ sân: Chia tiền cầu + nước (`court_fee = 0`).
  - Khách vãng lai / Đóng theo buổi: Chia đều tiền sân + cầu + nước (hoặc tùy chọn thu giá cố định).
- [x] Áp dụng quy tắc làm tròn (lên 1.000đ hoặc 5.000đ theo cấu hình CLB).
- [x] **Component hiển thị mã VietQR động**:
  - Tự sinh link ảnh VietQR Napas247 theo STK thủ quỹ, số tiền chính xác và cú pháp `BSM [Tên] [Buổi]`.
- [x] **Quy trình đối soát cho Thủ quỹ**: Kiểm tra biến động số dư và bấm nút 1-chạm "Xác nhận đã nộp" (`PAID`).
- [x] **Tiện ích sao chép hóa đơn Zalo**: Nút 1 chạm copy bản tóm tắt buổi đánh định dạng đẹp (icon cầu lông, danh sách chi tiết từng người) để gửi vào nhóm chat Zalo.

---

## 📊 Phase 5: Sổ Quỹ Nhóm & Tối Ưu Mobile PWA (Treasury & PWA Polish)
- [x] **Sổ Quỹ CLB (Treasury Ledger)**:
  - Báo cáo thu/chi minh bạch: Quỹ tháng, tiền dư buổi đánh, tiền chi mua cầu, tiền cọc sân, liên hoan.
  - Hiển thị số dư quỹ tức thời, tổng thu, tổng chi và bộ lọc danh mục trực quan.
  - Phân quyền Trưởng nhóm & Thủ quỹ có thể thêm/xóa giao dịch thu chi.
- [x] **Bảng theo dõi nợ đọng (Unpaid Tracker & Zalo Reminder)**:
  - Danh sách tổng hợp những ai còn nợ tiền buổi đánh (hội viên & khách vãng lai) để thủ quỹ dễ dàng theo dõi.
  - Nút 1-chạm sao chép tin nhắn nhắc nợ gửi Zalo định dạng đẹp (kèm icon cầu lông và STK VietQR).
  - Nút 1-chạm xác nhận đã thu nợ tức thời (`PAID`).
- [x] **Cài đặt PWA (Progressive Web App)**: Cấu hình `manifest.json`, icon app 192x192 & 512x512, hỗ trợ "Thêm vào màn hình chính" trên iOS/Android để mở toàn màn hình không có thanh URL.
- [x] **Kiểm thử Responsive & Độ tương phản**: Rà soát giao diện theo Slush Design System (viền đen brutalist, tương phản cao dưới ánh đèn sân cầu lông, touch target $\ge 44\text{px}$, không vỡ layout trên các dòng điện thoại phổ biến iPhone, Samsung, Xiaomi).
