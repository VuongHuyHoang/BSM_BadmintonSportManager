# Kiến Trúc Hệ Thống & Mô Hình Dữ Liệu (Architecture & Data Schema)

## 1. Công Nghệ Đề Xuất (Tech Stack)
- **Framework**: Next.js 14+ (App Router) với Server Actions và React Server Components.
- **Xác thực (Authentication)**: NextAuth.js (Auth.js) hoặc Supabase Auth (Hỗ trợ Email/Password, Google OAuth, SĐT).
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI) - tuân thủ triệt để [frontend-design skill](../.agents/skills/frontend-design/SKILL.md).
- **Database**: PostgreSQL (Supabase / Neon / PostgreSQL).
- **ORM**: Prisma ORM hoặc Drizzle ORM (Type-safe migrations).
- **Thanh toán**: VietQR Napas247 QuickLink.
- **Tiêu chuẩn Responsive Breakpoints**:
  - `Mobile` (< 640px): 1-column layout, bottom sticky bars, touch targets $\ge 44$px.
  - `Tablet` (640px - 1024px): 2-column split view (Attendance + Live Bill).
  - `Desktop` (> 1024px): Dashboard layout với Collapsible Sidebar & Data Tables.

- **Tài liệu triển khai chi tiết**: Xem [docs/DEPLOYMENT.md](file:///e:/BSM_BadmintonSportManager/docs/DEPLOYMENT.md).

---

## 2. Sơ Đồ Thực Thể Quan Hệ (Entity Relationship Diagram - ERD)

```mermaid
erDiagram
    USERS ||--o{ MEMBERS : has_profile
    CLUBS ||--o{ MEMBERS : belongs_to
    CLUBS ||--o{ SESSIONS : organizes
    CLUBS ||--o{ TRANSACTIONS : logs_fund
    SESSIONS ||--o{ SESSION_ATTENDANCES : contains
    MEMBERS ||--o{ SESSION_ATTENDANCES : participates
    SESSIONS ||--o{ SHUTTLE_LOGS : records
    MEMBERS ||--o{ TRANSACTIONS : pays

    USERS {
        string id PK
        string email UK "nullable"
        string phone UK "nullable"
        string password_hash "nullable"
        string full_name
        string avatar_url "nullable"
        datetime created_at
    }

    CLUBS {
        string id PK
        string name
        string invite_code UK
        string bank_code
        string bank_account_no
        string bank_account_name
        int default_shuttle_price
        string rounding_mode "CEIL_1K | CEIL_5K | EXACT"
        datetime created_at
    }

    MEMBERS {
        string id PK
        string club_id FK
        string user_id FK "nullable (for manual guests)"
        string display_name
        string role "ADMIN | TREASURER | MEMBER"
        string membership_type "FULL_MONTHLY | COURT_ONLY_MONTHLY | PAY_PER_SESSION | GUEST"
        int monthly_fee_amount "nullable"
        boolean is_active
        datetime joined_at
    }

    SESSIONS {
        string id PK
        string club_id FK
        datetime start_time
        datetime end_time
        string court_name
        int court_fee
        int other_fee
        string status "SCHEDULED | ONGOING | COMPLETED | CANCELLED"
        datetime created_at
    }

    SESSION_ATTENDANCES {
        string id PK
        string session_id FK
        string member_id FK
        string check_in_by "SELF | TREASURER"
        int court_fee_share
        int shuttle_fee_share
        int extra_fee_share
        int total_amount
        string payment_status "UNPAID | PAID | COVERED_BY_SUBSCRIPTION"
        datetime paid_at "nullable"
        string confirmed_by "nullable"
    }

    SHUTTLE_LOGS {
        string id PK
        string session_id FK
        int quantity "số quả đã dùng"
        int unit_price "giá mỗi quả"
        int total_amount "thành tiền"
    }

    TRANSACTIONS {
        string id PK
        string club_id FK
        string member_id FK "nullable"
        string session_id FK "nullable"
        string type "INCOME | EXPENSE"
        string category "SESSION_FEE | MONTHLY_FUND | BUY_SHUTTLE | COURT_DEPOSIT | OTHER"
        int amount
        string description
        datetime created_at
    }
```

---

## 3. Kiến Trúc Thư Mục Source Code Dự Kiến

```text
src/
├── app/                         # App Router
│   ├── (auth)/                  # Đăng nhập, đăng ký, quên mật khẩu
│   ├── dashboard/               # Trang chủ người dùng (lịch đánh, số nợ của tôi)
│   ├── sessions/                # Quản lý buổi đánh
│   │   ├── [id]/
│   │   │   ├── page.tsx         # Chi tiết buổi đánh & hóa đơn cá nhân
│   │   │   └── check-in/        # Màn hình điểm danh & cập nhật số cầu
│   ├── members/                 # Quản lý danh sách thành viên & gói tháng
│   ├── treasury/                # Quản lý sổ quỹ & đối soát thanh toán
│   └── settings/                # Cài đặt CLB & tài khoản nhận VietQR
├── components/
│   ├── ui/                      # Base UI (Button, Dialog, Input, Card...)
│   ├── session/                 # ShuttleCounter (+ / -), CheckInToggle, BillSummary
│   └── payment/                 # VietQRCodeCard, PaymentStatusBadge
├── lib/
│   ├── auth/                    # NextAuth / Supabase helper
│   ├── finance/                 # Pure calculation logic (làm tròn, chia bill)
│   ├── vietqr.ts                # Generator link VietQR QuickLink
│   └── utils.ts
├── server/
│   ├── db.ts                    # Prisma / Drizzle connection
│   └── actions/                 # Server actions (auth, session, attendance, finance)
└── types/
    └── index.ts                 # Type definitions
```
