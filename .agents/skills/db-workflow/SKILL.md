---
name: db-workflow
description: >-
  Hướng dẫn thiết kế schema, tạo quan hệ cơ sở dữ liệu và quản lý migration cho ứng dụng BSM.
  Sử dụng khi thiết kế bảng, cập nhật quan hệ thực thể, hoặc định nghĩa cấu trúc dữ liệu.
---

# Database Workflow & Data Modeling Guide

## 1. Nguyên Tắc Thiết Kế Cơ Sở Dữ Liệu
- **Khóa ngoại & Toàn vẹn tham chiếu**: Mọi quan hệ giữa Session, Member, Attendance và Transaction phải có foreign key ràng buộc.
- **Soft Delete vs Hard Delete**:
  - Không hard delete (xóa vĩnh viễn) các buổi đánh hoặc giao dịch đã hoàn tất vì sẽ làm sai lệch sổ sách tài chính.
  - Sử dụng cờ `is_deleted` hoặc `deleted_at` hoặc trạng thái `CANCELLED`.
- **Lưu trữ tiền**: Dùng kiểu số nguyên `BIGINT` hoặc `INTEGER` lưu giá trị theo đồng (VND). Không dùng kiểu `FLOAT`/`DOUBLE`.

## 2. Bảng Dữ Liệu Cốt Lõi (Core Tables)
1. `groups` / `clubs`: Nhóm cầu lông, thông tin tài khoản ngân hàng nhận tiền.
2. `members`: Thành viên trong nhóm (tên, sđt, vai trò: ADMIN/TREASURER/MEMBER/GUEST, kiểu thành viên: FIXED/GUEST).
3. `sessions`: Buổi đánh (ngày giờ, địa điểm, số sân, thời lượng, tiền sân, tiền nước, trạng thái).
4. `session_attendances`: Điểm danh chi tiết ai tham gia buổi nào, số tiền cần trả, trạng thái đã trả (`PAID`/`UNPAID`/`EXEMPT`).
5. `shuttlecock_logs`: Ghi nhận việc sử dụng quả cầu (loại cầu, số quả đã dùng trong buổi, đơn giá).
6. `transactions`: Sổ quỹ (thu tiền buổi đánh, đóng quỹ tháng, chi mua cầu, chi đặt cọc sân).

## 3. Quy Trình Cập Nhật Schema
1. Khi thêm cột hoặc bảng mới: Cập nhật file [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) trước.
2. Đảm bảo có chỉ mục (Index) trên các cột thường xuyên query: `session_id`, `member_id`, `group_id`, `status`.
