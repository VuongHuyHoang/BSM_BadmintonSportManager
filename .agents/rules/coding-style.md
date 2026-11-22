# Quy Chuẩn Lập Trình (Coding Style & Guidelines)

## 1. Nguyên Tắc Thiết Kế Giao Diện & Responsive (UI/UX Standards)
- **Chuẩn Responsive Đa Nền Tảng (Mobile, Tablet, Desktop)**:
  - **Mobile (360px - 430px - Thiết bị chính trên sân)**:
    - Tiếp cận **Mobile-First**: Viết CSS base cho mobile trước, sau đó dùng `sm:`, `md:`, `lg:` để mở rộng.
    - **Vùng chạm an toàn (Touch Target)**: Mọi nút bấm, checkbox, switch phải có kích thước tối thiểu $44 \times 44\text{px}$ để bấm chính xác bằng 1 ngón cái khi tay ra mồ hôi.
    - **Bottom Bar & Bottom Sheet**: Các hành động chính (Ví dụ: "Check-in", "Chốt tiền", "Mở VietQR") đặt ở thanh cố định mép dưới màn hình (Sticky Bottom Bar). Dùng Drawer/Bottom Sheet thay vì Popup Modal cồng kềnh.
  - **Tablet (768px - 1024px - Dành cho Captain/Thủ quỹ ngồi ghế chỉ đạo)**:
    - Bố cục 2 cột (Split-view): Cột trái danh sách điểm danh, cột phải bảng tính tiền và bộ đếm cầu trực quan theo thời gian thực.
  - **Desktop (1024px trở lên - Quản trị & Sổ quỹ chuyên sâu)**:
    - Sidebar điều hướng cố định bên trái, nội dung trung tâm co giãn linh hoạt (`max-w-7xl mx-auto`).
    - Bảng dữ liệu (Data Table) đầy đủ cột, biểu đồ thu chi trực quan và các nút xuất báo cáo Excel/CSV.
- **Tuân thủ tiêu chuẩn Frontend Design**: Tham khảo [.agents/skills/frontend-design/SKILL.md](../skills/frontend-design/SKILL.md). Tuyệt đối tránh giao diện mẫu "AI-slop" (cards bo tròn giống hệt nhau, dải gradient trang trí vô nghĩa, nền kem nhạt cliché).
- **Cá tính thể thao & sân cầu lông**: Màu sắc và font chữ phải phản ánh tính năng động, nhanh nhẹn (sân thảm xanh, quả cầu, vạch biên sắc nét, độ tương phản cao dưới ánh đèn sân).
- **Copywriting rõ ràng, hành động thực tế**: Nhãn nút phải nói rõ hành động ("Lưu buổi đánh", "Xác nhận nộp tiền", thay vì "Gửi" hay "Submit").
- **Thư viện đề xuất**: Tailwind CSS, Lucide Icons, Shadcn UI hoặc Radix Primitives.

## 2. Tiêu Chuẩn Mã Nguồn (Code Standards)
- **TypeScript**: Luôn sử dụng kiểu dữ liệu rõ ràng, cấm lạm dụng `any`. Định nghĩa `interface` hoặc `type` trong thư mục `types/`.
- **Định dạng tiền tệ**:
  - Không hiển thị số thô. Luôn qua hàm format VND:
  ```typescript
  export const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  ```
- **Xử lý ngày giờ**: Lưu trữ thời gian trong DB dưới chuẩn UTC (ISO 8601), hiển thị cho người dùng theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh` - UTC+7).

## 3. Quản Lý Trạng Thái & Dữ Liệu
- Logic tính toán tiền chia cần được tách thành các hàm thuần túy (pure functions) độc lập trong thư mục `lib/finance/` để dễ dàng viết unit test.
- Khi cập nhật số tiền hoặc trạng thái nộp tiền của buổi đánh, phải đảm bảo tính toàn vẹn (atomic transaction).
