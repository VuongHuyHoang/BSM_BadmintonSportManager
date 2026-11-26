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
    SESSION_ATTENDANCES ||--o{ ATTENDANCE_EXTRA_ITEMS : has_items
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
        boolean has_extended_duration
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

    ATTENDANCE_EXTRA_ITEMS {
        string id PK
        string attendance_id FK
        string item_name "Revive, Quấn cán, Nước suối..."
        int quantity
        int unit_price
        int total_price
        datetime created_at
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

## 3. Kiến Trúc Thư Mục Source Code Thực Tế

```text
src/
├── app/                         # Next.js 14 App Router
│   ├── (auth)/                  # Đăng nhập (/login), đăng ký (/register)
│   ├── api/auth/                # NextAuth route handler ([...nextauth])
│   ├── dashboard/               # Bảng điều khiển cá nhân (Debt Tracker & CLB của tôi)
│   ├── profile/                 # Hồ sơ cá nhân, lịch sử đóng tiền & nợ
│   ├── clubs/                   # Quản lý CLB
│   │   ├── new/                 # Tạo CLB mới, cấu hình VietQR & giá cầu
│   │   └── [id]/                # Chi tiết CLB 4-Tab Hub (Buổi đánh, Sổ quỹ, Bảng nợ, Hội viên)
│   │       └── sessions/new/    # Tạo buổi đánh mới (Server guard 3 lớp)
│   ├── sessions/                # Chi tiết buổi đánh
│   │   └── [id]/                # Điểm danh 2 chiều, đếm cầu, phụ phí riêng, gia hạn giờ
│   │       └── split/           # Bảng chia tiền thông minh & VietQR Napas247 động
│   ├── join/[code]/             # Tham gia CLB bằng mã mời
│   ├── error.tsx                # Global Error Boundary (kèm F5 reload & dashboard link)
│   └── not-found.tsx            # Global 404 Not Found Page
├── components/
│   ├── navbar.tsx               # Header điều hướng chung
│   ├── club/                    # Hub tabs, TreasuryView, DebtTrackerView, MemberManagement, Modals
│   ├── session/                 # AttendanceBoard, ShuttleCounter, ExtraFeeWidget, SplitBillView
│   └── profile/                 # ProfileHub (Tổng hợp nợ, lịch sử thanh toán)
├── lib/
│   ├── auth.ts                  # Cấu hình NextAuth v5 (hỗ trợ insensitive email & phone login)
│   ├── db.ts                    # Prisma Client singleton
│   ├── utils.ts                 # formatVND, roundFee, generateVietQRUrl, removeVietnameseAccents
│   └── vietqr.ts                # Generator link VietQR QuickLink
└── server/
    └── actions/                 # Next.js Server Actions (auth, club, member, session, treasury)
```
