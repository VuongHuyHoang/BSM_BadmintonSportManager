# Badminton Sport Manager (BSM) 🏸💰

> Hệ thống quản lý chi phí, điểm danh và hoạt động chuyên nghiệp dành cho các nhóm, câu lạc bộ cầu lông phong trào tại Việt Nam.

---

## 🎯 Mục Tiêu Dự Án
- **Không còn đau đầu tính tiền**: Tự động tính tiền sân, tiền cầu tiêu hao, phụ phí nước uống theo số lượng người thực tế trên sân.
- **Điểm danh 1 chạm**: Thao tác cực nhanh trên điện thoại ngay tại sân cầu lông.
- **Thanh toán tức thì qua VietQR**: Tự động tạo mã QR chuyển khoản chính xác từng thành viên kèm cú pháp nội dung rõ ràng.
- **Minh bạch sổ quỹ**: Công khai số dư quỹ nhóm, các khoản thu/chi (mua cầu, cọc sân) giúp tăng sự tin tưởng trong CLB.

---

## 📁 Cấu Trúc Dự Án (Dành Cho Vibe Coding Với AI)

Dự án được cấu trúc đặc biệt để hỗ trợ tối đa các công cụ AI Agent (Antigravity, Cursor, Claude Code, Gemini):

```text
BSM_BadmintonSportManager/
├── .agents/                        # Cấu hình AI Agents & Workflow
│   ├── rules/
│   │   ├── coding-style.md         # Quy chuẩn code, mobile-first UX
│   │   └── finance-rules.md        # Nguyên tắc làm tròn & xử lý tiền tệ
│   └── skills/
│       ├── badminton-domain/       # Kiến thức nghiệp vụ sân cầu lông VN
│       │   └── SKILL.md
│       ├── db-workflow/            # Hướng dẫn thiết kế DB & migration
│       │   └── SKILL.md
│       └── frontend-design/        # Tiêu chuẩn thiết kế UI/UX khác biệt (Anthropic standard)
│           └── SKILL.md
├── docs/                           # Tài liệu đặc tả hệ thống
│   ├── PRD.md                      # Product Requirements Document chi tiết
│   ├── ARCHITECTURE.md             # Kiến trúc kỹ thuật & Sơ đồ ERD
│   ├── FINANCIAL_LOGIC.md          # Công thức toán học chia tiền & quỹ
│   ├── DEPLOYMENT.md               # Quy trình deploy Vercel + Supabase chi phí 0đ
│   └── ROADMAP.md                  # Lộ trình phát triển từng giai đoạn
├── AGENTS.md                       # File chỉ dẫn hệ thống cốt lõi cho AI Agent
├── CONTEXT.md                      # Bối cảnh tóm tắt để AI nắm bắt tức thì
└── README.md                       # Tài liệu hướng dẫn sử dụng
```

---

## 💡 Cách Vibe Coding Với Repository Này
Khi bắt đầu một phiên làm việc với AI:
1. Bạn chỉ cần yêu cầu AI đọc [AGENTS.md](file:///e:/BSM_BadmintonSportManager/AGENTS.md) và [CONTEXT.md](file:///e:/BSM_BadmintonSportManager/CONTEXT.md).
2. Khi muốn làm tính năng cụ thể (Ví dụ: "Hãy tạo trang điểm danh và tính tiền buổi đánh"), AI sẽ tự động kích hoạt skill `badminton-domain` và đọc [FINANCIAL_LOGIC.md](file:///e:/BSM_BadmintonSportManager/docs/FINANCIAL_LOGIC.md) để tính toán chính xác mà bạn không cần phải giải thích lại nghiệp vụ cầu lông!

---

## 🛠️ Công Nghệ Khuyến Nghị (Tech Stack)
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, Shadcn UI, Lucide Icons.
- **Backend / Database**: Next.js Server Actions, PostgreSQL (Supabase / Neon), Prisma ORM / Drizzle ORM.
- **Thanh toán**: Tích hợp VietQR QuickLink (Napas247).
