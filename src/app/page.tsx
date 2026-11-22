import Link from "next/link";
import { formatVND } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { 
  Users, 
  Calendar, 
  Wallet, 
  QrCode, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Zap,
  Activity,
  Award
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#dceeff] text-black">
      {/* 1. Marquee Top Strip (Slush Signature Element - Infinite LTR Smooth Scrolling) */}
      <div className="bg-black text-white py-2.5 border-b border-black overflow-hidden select-none relative flex">
        <div className="flex shrink-0 animate-marquee-ltr items-center gap-6 whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.2em] pr-6">
          <span>🏸 BSM SPORT MANAGER</span>
          <span className="text-[#ffd731]">·</span>
          <span>ĐIỂM DANH 2 CHIỀU TẠI SÂN</span>
          <span className="text-[#55db9c]">·</span>
          <span>TỰ ĐỘNG CHIA BILL SÂN & CẦU</span>
          <span className="text-[#4da2ff]">·</span>
          <span>QUÉT MÃ VIETQR NAPAS247 1 CHẠM</span>
          <span className="text-[#5c4ade]">·</span>
          <span>SỔ QUỸ MINH BẠCH 100%</span>
          <span className="text-[#fb4903]">·</span>
          <span>KHÔNG CÒN NỖI LO TÍNH TIỀN</span>
          <span className="text-[#e9ccff]">·</span>
        </div>
        <div className="flex shrink-0 animate-marquee-ltr items-center gap-6 whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.2em] pr-6" aria-hidden="true">
          <span>🏸 BSM SPORT MANAGER</span>
          <span className="text-[#ffd731]">·</span>
          <span>ĐIỂM DANH 2 CHIỀU TẠI SÂN</span>
          <span className="text-[#55db9c]">·</span>
          <span>TỰ ĐỘNG CHIA BILL SÂN & CẦU</span>
          <span className="text-[#4da2ff]">·</span>
          <span>QUÉT MÃ VIETQR NAPAS247 1 CHẠM</span>
          <span className="text-[#5c4ade]">·</span>
          <span>SỔ QUỸ MINH BẠCH 100%</span>
          <span className="text-[#fb4903]">·</span>
          <span>KHÔNG CÒN NỖI LO TÍNH TIỀN</span>
          <span className="text-[#e9ccff]">·</span>
        </div>
      </div>

      {/* 2. Top Navigation Bar (Dynamic Auth) */}
      <Navbar />

      {/* 3. Hero Section (Slush Sky Wash + Bold Typography + Floating Stickers) */}
      <section className="px-4 pt-10 pb-12 sm:pt-16 sm:pb-16 max-w-5xl mx-auto text-center relative">
        {/* Floating Stickers Desktop với animation bồng bềnh sống động */}
        <div className="hidden lg:block absolute left-4 top-24 rotate-[-6deg] animate-float">
          <div className="bg-[#55db9c] border border-black px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-[3px_3px_0px_#000000] flex items-center gap-1.5 hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-black fill-black" />
            <span>1-TAP CHECK-IN</span>
          </div>
        </div>

        <div className="hidden lg:block absolute right-4 top-20 rotate-[5deg] animate-float-delayed">
          <div className="bg-[#ffd731] border border-black px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-[3px_3px_0px_#000000] flex items-center gap-1.5 hover:scale-105 transition-transform">
            <span>🏸 4 QUẢ TIÊU HAO</span>
          </div>
        </div>

        <div className="hidden lg:block absolute right-10 bottom-16 rotate-[-4deg] animate-float">
          <div className="bg-[#e9ccff] border border-black px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-[3px_3px_0px_#000000] flex items-center gap-1.5 hover:scale-105 transition-transform">
            <Wallet className="w-4 h-4 text-black" />
            <span>QUỸ MINH BẠCH</span>
          </div>
        </div>

        {/* Badge Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-white text-black border border-black shadow-[3px_3px_0px_#000000] mb-6">
          <Sparkles className="w-4 h-4 text-[#fb4903] fill-[#fb4903]" />
          <span className="uppercase tracking-wider">Hệ Thống Quản Lý Cầu Lông Phong Trào</span>
        </div>

        {/* Display Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-black leading-[0.95] mb-6 uppercase">
          Chia Tiền Cầu Lông <br />
          <span className="inline-block bg-[#4da2ff] text-white px-3 py-1 my-1 rounded-xl border border-black shadow-[4px_4px_0px_#000000]">
            Tự Động & Chuẩn Xác
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-800 font-medium max-w-2xl mx-auto mb-8 leading-snug">
          Không còn đau đầu nhớ ai đi, đếm số quả cầu bung hộp hay tranh cãi chia bill sau mỗi buổi đánh. Thủ quỹ nhàn tênh, hội viên quét VietQR 1 chạm!
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-12">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-full text-sm font-extrabold bg-[#000000] text-white border border-black shadow-[4px_4px_0px_#55db9c] hover:bg-[#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2"
          >
            <span>Vào Bảng Điều Khiển</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/clubs/new"
            className="px-5 py-3 rounded-full text-sm font-bold bg-white text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-zinc-100 transition-all"
          >
            Tạo CLB Mới
          </Link>
        </div>

        {/* 4. Live Session Card (Paper White + Hard Black Shadow) */}
        <div id="demo" className="bg-white border border-black rounded-[24px] p-5 sm:p-7 text-left max-w-xl mx-auto shadow-[8px_8px_0px_#000000] transition-all">
          <div className="flex items-start justify-between pb-4 border-b border-black mb-5">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#ffd731] text-black border border-black uppercase tracking-wider mb-1">
                Buổi Đánh Đang Diễn Ra
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-black leading-tight">CLB Cầu Lông Kỳ Hòa</h3>
              <p className="text-xs text-zinc-600 font-semibold mt-0.5">Sân số 3 · 18:00 - 20:00 (2 Tiếng)</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-black bg-[#55db9c] text-black border border-black">
              5 Người Đánh
            </div>
          </div>

          {/* Chi tiết chi phí */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#f1f3f6] p-3.5 rounded-xl border border-black">
              <span className="text-[11px] font-bold text-zinc-600 block uppercase">Tiền Thuê Sân</span>
              <span className="text-lg font-black text-black">{formatVND(180000)}</span>
              <span className="text-[10px] text-zinc-500 block font-medium">90.000đ/h × 2h</span>
            </div>
            <div className="bg-[#f1f3f6] p-3.5 rounded-xl border border-black">
              <span className="text-[11px] font-bold text-zinc-600 block uppercase">Cầu Bung Hộp</span>
              <span className="text-lg font-black text-[#fb4903]">4 Quả (100.000đ)</span>
              <span className="text-[10px] text-zinc-500 block font-medium">Thành Công Đỏ · 25k/quả</span>
            </div>
          </div>

          {/* Phân bổ mẫu theo 3 nhóm hội viên */}
          <div className="space-y-2 mb-5">
            <div className="text-xs font-black uppercase tracking-wider text-zinc-700">Cách Chia Tiền Hôm Nay:</div>
            
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-black text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#55db9c] border border-black"></span>
                <span>Gói Trọn Gói (Trưởng nhóm, Thủ quỹ)</span>
              </div>
              <span className="font-black text-emerald-700">0đ (Đã bao trọn tháng)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-black text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#4da2ff] border border-black"></span>
                <span>Gói Chỉ Sân (Quốc Huy)</span>
              </div>
              <span className="font-black text-[#5c4ade]">24.000đ (Chỉ tiền cầu)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-black text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#fb4903] border border-black"></span>
                <span>Vãng lai / Theo buổi (Minh Tuấn, Khách)</span>
              </div>
              <span className="font-black text-black">60.000đ / người</span>
            </div>
          </div>

          {/* Slush Style QR Download/Payment Card */}
          <div className="bg-[#5c4ade] text-white rounded-[20px] border border-black p-4 flex items-center justify-between shadow-[4px_4px_0px_#000000]">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl border border-black text-black shadow-[2px_2px_0px_#000000]">
                <QrCode className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-violet-200 block">Thanh Toán VietQR Napas247</span>
                <span className="text-base font-black leading-tight block">MBBank · 0912345678</span>
                <span className="text-[11px] text-violet-100 font-medium">Nội dung: BSM Tuan Buoi3</span>
              </div>
            </div>
            <div className="bg-white text-black text-xs font-black uppercase px-3 py-1.5 rounded-full border border-black shadow-[2px_2px_0px_#000000]">
              Quét QR
            </div>
          </div>
        </div>
      </section>

      {/* 5. Ba Trụ Cột Tính Năng (Sticker Style Grid) */}
      <section className="px-4 max-w-5xl mx-auto py-10">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-black bg-[#e9ccff] text-black border border-black uppercase tracking-wider mb-2">
            Giải Pháp Thực Tế
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-black uppercase">Thiết Kế Chuyên Biệt Cho Sân Cầu Lông</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Mint */}
          <div className="bg-white border border-black p-6 rounded-[22px] shadow-[5px_5px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_#000000] transition-all">
            <div className="h-12 w-12 rounded-2xl bg-[#55db9c] border border-black flex items-center justify-center text-black mb-4 shadow-[2px_2px_0px_#000000]">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-black mb-2 uppercase">Điểm Danh 2 Chiều</h3>
            <p className="text-sm text-zinc-700 font-medium leading-relaxed">
              Hội viên tự mở điện thoại bấm Check-in khi vừa tới sân. Thủ quỹ kiểm tra và tick hộ nhanh cho khách vãng lai chỉ với 1 chạm.
            </p>
          </div>

          {/* Card 2: Sunburst */}
          <div className="bg-white border border-black p-6 rounded-[22px] shadow-[5px_5px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_#000000] transition-all">
            <div className="h-12 w-12 rounded-2xl bg-[#ffd731] border border-black flex items-center justify-center text-black mb-4 shadow-[2px_2px_0px_#000000]">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-black mb-2 uppercase">Chia Tiền 3 Nhóm</h3>
            <p className="text-sm text-zinc-700 font-medium leading-relaxed">
              Tách bạch công thức: Gói tháng trọn gói (0đ), gói chỉ sân (chia tiền cầu) và vãng lai. Tiền lẻ tự động làm tròn nạp vào Quỹ nhóm.
            </p>
          </div>

          {/* Card 3: Violet */}
          <div className="bg-white border border-black p-6 rounded-[22px] shadow-[5px_5px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_#000000] transition-all">
            <div className="h-12 w-12 rounded-2xl bg-[#e9ccff] border border-black flex items-center justify-center text-black mb-4 shadow-[2px_2px_0px_#000000]">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-black mb-2 uppercase">VietQR & Sao Chép Zalo</h3>
            <p className="text-sm text-zinc-700 font-medium leading-relaxed">
              Mã QR tự động điền đúng số tiền và nội dung. Bấm 1 nút là copy xong bản tổng kết chi phí định dạng đẹp để gửi vào nhóm chat Zalo.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Footer / Database Status Bar */}
      <footer className="border-t border-black bg-white px-4 py-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-zinc-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>BSM Architecture · Next.js 14 + Prisma + SQLite/PostgreSQL</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <span>Tham chiếu thiết kế: Slush Design System (Refero)</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
