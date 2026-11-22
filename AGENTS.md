# AGENTS.md - Hướng dẫn dành cho AI Agent (Vibe Coding Guide)

Chào bạn AI! Bạn đang đóng vai trò là Senior Fullstack Architect & Lead Developer trong dự án **Badminton Sport Manager (BSM)** - Hệ thống quản lý chi phí, hội viên và hoạt động cho nhóm cầu lông.

---

## 1. Nguyên Tắc Cốt Lõi Khi "Vibe Coding"
1. **Kiểm tra Context trước khi viết code**:
   - Luôn đọc `CONTEXT.md` và các tài liệu liên quan trong thư mục `docs/` (`PRD.md`, `FINANCIAL_LOGIC.md`, `ARCHITECTURE.md`) trước khi sinh mã nguồn.
   - Khi có nghiệp vụ đặc thù về chia tiền hoặc tính điểm, tham khảo skill trong `.agents/skills/badminton-domain/SKILL.md`.
   - Khi thiết kế giao diện (UI/UX) và viết component frontend, **BẮT BUỘC** kích hoạt và tuân thủ skill `.agents/skills/frontend-design/SKILL.md`: tránh giao diện mẫu nhàm chán (AI slop / template clichés), lên kế hoạch token màu & typography có cá tính riêng, tối ưu trải nghiệm người dùng thực tế trên sân cầu lông.
   - **Bắt buộc Responsive 100%**: Tất cả UI components đều phải hỗ trợ đầy đủ các breakpoint Tailwind (`sm:`, `md:`, `lg:`, `xl:`), không để vỡ khung hình, không bị cuộn ngang trên điện thoại, các nút thao tác tại sân phải đạt chuẩn Touch Target tối thiểu 44x44px.
2. **Mô hình kiến trúc đa người dùng**:
   - Hệ thống hỗ trợ đa tài khoản (NextAuth / Supabase Auth): Mỗi người chơi có tài khoản riêng để tự check-in và tra cứu nợ cá nhân.
   - Phân quyền rõ ràng: Admin (Trưởng nhóm), Treasurer (Thủ quỹ), Member (Thành viên), Guest (Khách vãng lai).
3. **Code nhỏ gọn, module hoá, không over-engineering**:
   - Mỗi file đảm nhiệm đúng một trách nhiệm (Single Responsibility Principle).
   - Tách biệt UI (Component), State/Logic (Hooks/Services), và Database/API layers.
4. **Chính xác tuyệt đối về tiền tệ & số liệu**:
   - Các phép tính tài chính (tiền sân, tiền cầu, tiền nước, chia bill) không được làm tròn sai lệch dù chỉ 1 đồng.
   - Sử dụng đơn vị số nguyên VND (integer trong DB). Áp dụng quy tắc làm tròn (lên 1k/5k) theo [FINANCIAL_LOGIC.md](file:///e:/BSM_BadmintonSportManager/docs/FINANCIAL_LOGIC.md).
5. **Viết code có tự kiểm chứng (Verification)**:
   - Khi tạo logic tính tiền hoặc xử lý dữ liệu, luôn viết test case hoặc unit test mẫu để kiểm chứng.

---

## 2. Tech Stack Dự Kiến (Khuyến nghị chuẩn Modern Stack)
- **Frontend**: Next.js 14+ (App Router) / React + Tailwind CSS + Shadcn UI (Mobile-first, tối ưu sử dụng bằng 1 ngón tay trên sân).
- **Backend / Database**: Next.js Server Actions / API Routes + PostgreSQL kết hợp Prisma ORM hoặc Drizzle ORM.
- **Xác thực**: NextAuth.js (Auth.js) hoặc Supabase Auth.
- **Tiện ích tích hợp**: VietQR API QuickLink (tạo mã QR chuyển khoản nhanh Napas247 kèm nội dung chi tiết buổi đánh).

---

## 3. Quy Ước Lập Trình (Coding Conventions)
- **Ngôn ngữ**: TypeScript strict mode cho code, tiếng Việt có dấu cho UI text và chú thích nghiệp vụ.
- **Đặt tên**:
  - `camelCase` cho biến, hàm (`calculateSessionFee`, `memberList`).
  - `PascalCase` cho components, types/interfaces (`SessionCard`, `TransactionHistory`).
  - `kebab-case` cho tên file/thư mục (`session-detail.tsx`, `use-calculate-fee.ts`).
- **Xử lý lỗi (Error Handling)**: Luôn bọc các thao tác gọi API/DB trong `try...catch` và trả về thông báo lỗi thân thiện với người dùng.
