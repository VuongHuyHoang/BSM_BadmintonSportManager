"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatVND, generateVietQRUrl, removeVietnameseAccents } from "@/lib/utils";
import { 
  calculateAndSaveSessionFees, 
  togglePaymentStatus 
} from "@/server/actions/session";
import { 
  ArrowLeft, 
  Calculator, 
  Copy, 
  Check, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  X, 
  Share2,
  Users,
  Wallet,
  Clock,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface ExtraItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface AttendeeItem {
  id: string;
  memberId: string;
  isCheckedIn: boolean;
  courtFeeShare: number;
  shuttleFeeShare: number;
  extraFeeShare: number;
  totalAmount: number;
  paymentStatus: string;
  paidAt?: Date | null;
  extraItems?: ExtraItem[];
  member: {
    id: string;
    displayName: string;
    phone: string | null;
    role: string;
    membershipType: string;
    userId: string | null;
  };
}

interface SplitBillViewProps {
  session: {
    id: string;
    clubId: string;
    courtName: string;
    startTime: Date;
    endTime: Date;
    courtFee: number;
    otherFee: number;
    status: string;
    club: {
      id: string;
      name: string;
      bankCode: string | null;
      bankAccountNo: string | null;
      bankAccountName: string | null;
      roundingMode: string;
      defaultShuttlePrice: number;
    };
    shuttleLogs: {
      quantity: number;
      unitPrice: number;
      totalAmount: number;
    }[];
    attendances: AttendeeItem[];
  };
  currentUserId?: string | null;
  isLeader: boolean;
}

export function SplitBillView({
  session,
  currentUserId,
  isLeader,
}: SplitBillViewProps) {
  const [localAttendances, setLocalAttendances] = useState(session.attendances);
  useEffect(() => {
    setLocalAttendances(session.attendances);
  }, [session.attendances]);

  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const [actionAttendanceId, setActionAttendanceId] = useState<string | null>(null);
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{
    displayName: string;
    amount: number;
    description: string;
    qrUrl: string;
  } | null>(null);

  // Form cấu hình tính tiền
  const [showConfig, setShowConfig] = useState(false);
  const [guestFixedFee, setGuestFixedFee] = useState<number>(0);

  // Thống kê cơ bản
  const shuttleLog = session.shuttleLogs[0] || { quantity: 0, unitPrice: session.club.defaultShuttlePrice, totalAmount: 0 };
  const checkedInAttendees = localAttendances.filter((a) => a.isCheckedIn);
  
  // Tổng phụ phí riêng
  const totalPersonalExtra = checkedInAttendees.reduce((acc, a) => {
    return acc + (a.extraItems?.reduce((sum, item) => sum + item.totalPrice, 0) || 0);
  }, 0);

  // Tổng chi phí thực tế phát sinh
  const actualTotalCost = session.courtFee + shuttleLog.totalAmount + session.otherFee + totalPersonalExtra;

  // Tổng tiền thu được theo bảng chia tiền
  const totalBilled = checkedInAttendees.reduce((acc, a) => acc + a.totalAmount, 0);

  // Tiền đã thu thực tế
  const totalCollected = checkedInAttendees
    .filter((a) => a.paymentStatus === "PAID")
    .reduce((acc, a) => acc + a.totalAmount, 0);

  // Số lượng người chưa thanh toán
  const unpaidCount = checkedInAttendees.filter(
    (a) => a.totalAmount > 0 && a.paymentStatus === "UNPAID"
  ).length;

  const durationHours = Math.round(((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)) * 10) / 10;

  // Lọc danh sách người chơi
  const filteredAttendees = checkedInAttendees.filter((a) => {
    if (filter === "UNPAID") return a.totalAmount > 0 && a.paymentStatus === "UNPAID";
    if (filter === "PAID") return a.paymentStatus === "PAID";
    if (filter === "FREE") return a.totalAmount === 0 || a.paymentStatus === "COVERED_BY_SUBSCRIPTION";
    return true;
  });

  // Tự động tính toán & chốt chia tiền
  const handleRecalculate = async (fixedFee?: number) => {
    setLoading(true);
    const res = await calculateAndSaveSessionFees(session.id, fixedFee);
    setLoading(false);
    if (!res.success) {
      alert(res.error || "Lỗi khi tính tiền buổi đánh.");
    } else {
      setShowConfig(false);
    }
  };

  // Xác nhận nộp tiền (Toggle PAID / UNPAID)
  const handleTogglePayment = async (attendanceId: string, currentStatus: string) => {
    if (!isLeader) return;
    const newStatus = currentStatus === "PAID" ? "UNPAID" : "PAID";
    // Optimistic UI: Phản hồi lập tức 0ms
    setLocalAttendances((prev) =>
      prev.map((a) =>
        a.id === attendanceId ? { ...a, paymentStatus: newStatus } : a
      )
    );

    setActionAttendanceId(attendanceId);
    const res = await togglePaymentStatus(attendanceId, newStatus);
    setActionAttendanceId(null);
    if (!res?.success) {
      // Rollback
      setLocalAttendances((prev) =>
        prev.map((a) =>
          a.id === attendanceId ? { ...a, paymentStatus: currentStatus } : a
        )
      );
      alert(res?.error || "Lỗi cập nhật trạng thái thanh toán.");
    }
  };

  // Format ngày giờ ngắn gọn
  const formatDateOnly = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(date));
  };

  // Sao chép hóa đơn gửi nhóm Zalo
  const handleCopyZaloBill = () => {
    const bankInfo = session.club.bankAccountNo
      ? `\n💳 THÔNG TIN CHUYỂN KHOẢN VIETQR:\n- Ngân hàng: ${session.club.bankCode}\n- STK: ${session.club.bankAccountNo}\n- Tên TK: ${session.club.bankAccountName || "THU QUY"}\n- Nội dung: BSM [Tên_bạn]`
      : "\n⚠️ CLB chưa cài đặt thông tin STK chuyển khoản.";

    const attendeeLines = checkedInAttendees
      .map((a, idx) => {
        const typeLabel =
          a.member.membershipType === "FULL_MONTHLY"
            ? "Trọn gói"
            : a.member.membershipType === "COURT_ONLY_MONTHLY"
            ? "Chỉ sân"
            : "Vãng lai";

        const statusTag =
          a.totalAmount === 0
            ? "Đã đóng tháng"
            : a.paymentStatus === "PAID"
            ? "Đã nộp ✓"
            : "Chưa nộp ⚡";

        let extraNote = "";
        if (a.extraItems && a.extraItems.length > 0) {
          const itemsStr = a.extraItems.map((i) => `${i.quantity > 1 ? `${i.quantity}x ` : ""}${i.itemName}`).join(", ");
          extraNote = ` (gồm: ${itemsStr})`;
        }

        return `${idx + 1}. ${a.member.displayName} (${typeLabel}): ${formatVND(a.totalAmount)} [${statusTag}]${extraNote}`;
      })
      .join("\n");

    const text = `🏸 TỔNG KẾT BUỔI ĐÁNH - CLB ${session.club.name.toUpperCase()}
📍 ${session.courtName} | ${formatDateOnly(session.startTime)} (${durationHours} giờ)
🏸 Cầu bung: ${shuttleLog.quantity} quả (${formatVND(shuttleLog.totalAmount)})
👥 Có mặt: ${checkedInAttendees.length} người

📋 CHI TIẾT ĐÓNG TIỀN:
${attendeeLines}
${bankInfo}

👉 Chi tiết buổi đánh: ${typeof window !== "undefined" ? window.location.href : ""}`;

    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner Tổng Kết Chi Phí */}
      <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 pb-6 border-b border-black">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#5c4ade] text-white border border-black shadow-[1px_1px_0px_#000000]">
                Chia Tiền Thông Minh & VietQR
              </span>
              <span className="text-xs font-bold text-zinc-600">
                {session.club.name}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black leading-tight">
              Hóa Đơn: {session.courtName}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 font-medium mt-1">
              {formatDateOnly(session.startTime)} ({durationHours} giờ) · {checkedInAttendees.length} người có mặt chia tiền
            </p>
          </div>

          {/* Quick Actions (Copy Zalo + Recalculate) */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleCopyZaloBill}
              className={`px-4 py-2.5 rounded-full text-xs font-black uppercase border border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 ${
                copiedZalo
                  ? "bg-[#55db9c] text-black"
                  : "bg-[#0088cc] text-white hover:bg-[#0077b3]"
              }`}
            >
              {copiedZalo ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Đã Copy Bản Zalo!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao Chép Hóa Đơn Zalo</span>
                </>
              )}
            </button>

            {isLeader && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleRecalculate()}
                className="px-4 py-2.5 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#f3cc24] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Đang Tính..." : "Tính Lại Tiền"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Stat Grid Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
          <div className="bg-[#f8fafc] border border-black/20 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
              Chi Phí Thực Tế
            </span>
            <span className="text-lg sm:text-xl font-black text-black block mt-0.5">
              {formatVND(actualTotalCost)}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Sân + Cầu + Nước</span>
          </div>

          <div className="bg-[#f8fafc] border border-black/20 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
              Tổng Thu Chia Bill
            </span>
            <span className="text-lg sm:text-xl font-black text-[#5c4ade] block mt-0.5">
              {formatVND(totalBilled)}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Đã làm tròn 1k/5k</span>
          </div>

          <div className="bg-[#f0fdf4] border border-black/20 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
              Đã Thu Thực Tế
            </span>
            <span className="text-lg sm:text-xl font-black text-[#16a34a] block mt-0.5">
              {formatVND(totalCollected)}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Thủ quỹ đã nhận</span>
          </div>

          <div className="bg-[#fff7ed] border border-black/20 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
              Chưa Thu
            </span>
            <span className="text-lg sm:text-xl font-black text-[#fb4903] block mt-0.5">
              {unpaidCount} người
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Cần quét VietQR</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "ALL"
                ? "bg-black text-white shadow-[2px_2px_0px_#55db9c]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Tất Cả ({checkedInAttendees.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("UNPAID")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "UNPAID"
                ? "bg-[#fb4903] text-white shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Chưa Nộp ({unpaidCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("PAID")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "PAID"
                ? "bg-[#55db9c] text-black shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Đã Nộp
          </button>
          <button
            type="button"
            onClick={() => setFilter("FREE")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "FREE"
                ? "bg-[#e9ccff] text-black shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Gói Trọn Gói (0đ)
          </button>
        </div>

        {isLeader && (
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs font-black uppercase text-zinc-700 hover:text-black underline flex items-center gap-1"
          >
            <span>{showConfig ? "Đóng Cài Đặt" : "⚙️ Cài Đặt Giá Vãng Lai"}</span>
          </button>
        )}
      </div>

      {/* Config Box: Giá vãng lai cố định (nếu Leader muốn áp dụng) */}
      {showConfig && isLeader && (
        <div className="bg-white border border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#000000] space-y-3">
          <span className="text-xs font-black uppercase text-black block">
            Áp Dụng Mức Thu Cố Định Cho Khách Vãng Lai / Theo Buổi
          </span>
          <p className="text-xs text-zinc-600 font-medium">
            Mặc định hệ thống tự động chia đều tiền sân và tiền cầu. Nếu CLB của bạn có quy định thu giá cố định cho khách (VD: 50.000đ/buổi), bạn có thể nhập vào đây:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              step={5000}
              placeholder="Nhập giá cố định (VD: 50000)..."
              value={guestFixedFee || ""}
              onChange={(e) => setGuestFixedFee(parseInt(e.target.value) || 0)}
              className="px-3 py-2 rounded-xl border border-black text-xs font-bold bg-[#f8fafc] w-56 focus:outline-none"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => handleRecalculate(guestFixedFee)}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-[#55db9c] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#43c487]"
            >
              Áp Dụng Ngay
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setGuestFixedFee(0);
                handleRecalculate(0);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 border border-black"
            >
              Quay Lại Chia Đều
            </button>
          </div>
        </div>
      )}

      {/* 4. List of Member Bills with VietQR Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAttendees.map((a) => {
          const isMe = currentUserId && a.member.userId === currentUserId;
          const isCovered = a.totalAmount === 0 || a.paymentStatus === "COVERED_BY_SUBSCRIPTION";
          const isPaid = a.paymentStatus === "PAID";

          // Tạo thông tin VietQR nếu có số tiền cần thanh toán
          const qrMemo = `BSM ${removeVietnameseAccents(a.member.displayName)} ${formatDateOnly(session.startTime).replace(/[^a-zA-Z0-9]/g, "")}`;
          const qrUrl =
            session.club.bankAccountNo && session.club.bankCode && a.totalAmount > 0
              ? generateVietQRUrl({
                  bankCode: session.club.bankCode,
                  accountNo: session.club.bankAccountNo,
                  accountName: session.club.bankAccountName,
                  amount: a.totalAmount,
                  description: qrMemo,
                })
              : null;

          return (
            <div
              key={a.id}
              className={`border border-black rounded-[22px] p-5 shadow-[4px_4px_0px_#000000] bg-white flex flex-col justify-between transition-all ${
                isPaid ? "bg-[#f0fdf4]" : ""
              }`}
            >
              <div>
                {/* Header row of Member Card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-black leading-tight">
                        {a.member.displayName}
                      </h3>
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#ffd731] border border-black">
                          Bạn
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded border border-black/30 ${
                          a.member.membershipType === "FULL_MONTHLY"
                            ? "bg-[#e9ccff] text-black"
                            : a.member.membershipType === "COURT_ONLY_MONTHLY"
                            ? "bg-[#4da2ff] text-white"
                            : a.member.membershipType === "GUEST"
                            ? "bg-[#fb4903] text-white"
                            : "bg-[#ffd731] text-black"
                        }`}
                      >
                        {a.member.membershipType === "FULL_MONTHLY"
                          ? "Gói Trọn Gói"
                          : a.member.membershipType === "COURT_ONLY_MONTHLY"
                          ? "Gói Chỉ Sân"
                          : a.member.membershipType === "GUEST"
                          ? "Khách Vãng Lai"
                          : "Đóng Theo Buổi"}
                      </span>
                    </div>
                  </div>

                  {/* Payment Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black border border-black uppercase shrink-0 whitespace-nowrap shadow-[1px_1px_0px_#000000] ${
                      isCovered
                        ? "bg-[#e9ccff] text-black"
                        : isPaid
                        ? "bg-[#55db9c] text-black"
                        : "bg-[#fb4903] text-white animate-pulse"
                    }`}
                  >
                    {isCovered ? "Đã Đóng Tháng" : isPaid ? "Đã Nộp ✓" : "Chưa Nộp ⚡"}
                  </span>
                </div>

                {/* Line items breakdown */}
                <div className="space-y-1 text-xs font-semibold text-zinc-600 bg-[#f8fafc] p-3 rounded-xl border border-black/10 mb-4">
                  <div className="flex justify-between">
                    <span>Tiền sân:</span>
                    <span className="font-bold text-black">{formatVND(a.courtFeeShare)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền cầu:</span>
                    <span className="font-bold text-black">{formatVND(a.shuttleFeeShare)}</span>
                  </div>
                  {a.extraFeeShare > 0 && (
                    <div className="flex justify-between">
                      <span>Nước & phụ phí:</span>
                      <span className="font-bold text-amber-700">{formatVND(a.extraFeeShare)}</span>
                    </div>
                  )}
                  {a.extraItems && a.extraItems.length > 0 && (
                    <div className="pt-1 border-t border-black/10 text-[10px] text-zinc-500 font-medium">
                      Chi tiết món: {a.extraItems.map((i) => `${i.quantity > 1 ? `${i.quantity}x ` : ""}${i.itemName}`).join(", ")}
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-black/10 flex justify-between items-center text-sm font-black text-black">
                    <span>Số Tiền Phải Đóng:</span>
                    <span className="text-base font-black text-[#fb4903]">
                      {formatVND(a.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: VietQR + Leader Toggle */}
              <div className="pt-2 border-t border-black/10 flex flex-wrap items-center justify-between gap-2">
                {/* VietQR Trigger Button */}
                {qrUrl && a.totalAmount > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedQR({
                        displayName: a.member.displayName,
                        amount: a.totalAmount,
                        description: qrMemo,
                        qrUrl,
                      })
                    }
                    className="px-3.5 py-2 rounded-xl text-xs font-black uppercase bg-[#5c4ade] text-white border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#4a39ca] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Mã VietQR</span>
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400 font-medium italic">
                    {a.totalAmount === 0 ? "Không cần chuyển khoản" : "Chưa cài đặt STK"}
                  </span>
                )}

                {/* Leader Confirm Button (Toggle PAID / UNPAID) */}
                {isLeader && a.totalAmount > 0 && (
                  <button
                    type="button"
                    disabled={actionAttendanceId === a.id}
                    onClick={() => handleTogglePayment(a.id, a.paymentStatus)}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase border border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 ${
                      isPaid
                        ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        : "bg-[#55db9c] text-black hover:bg-[#43c487]"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isPaid ? "Đánh Dấu Chưa Nộp" : "Xác Nhận Đã Nộp"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. VietQR Modal Pop-up Box */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-2 border-black rounded-[24px] max-w-sm w-full p-6 shadow-[8px_8px_0px_#000000] text-center">
            <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Mã VietQR Napas247
              </span>
              <button
                type="button"
                onClick={() => setSelectedQR(null)}
                className="h-8 w-8 rounded-full border border-black flex items-center justify-center bg-zinc-100 hover:bg-black hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <span className="text-xs font-bold text-zinc-600 block">Người nộp:</span>
              <span className="text-lg font-black text-black uppercase block">
                {selectedQR.displayName}
              </span>
              <span className="text-2xl font-black text-[#5c4ade] block mt-1">
                {formatVND(selectedQR.amount)}
              </span>
            </div>

            {/* VietQR Image Card */}
            <div className="p-3 bg-[#f8fafc] border border-black rounded-2xl shadow-[3px_3px_0px_#000000] mb-4">
              <img
                src={selectedQR.qrUrl}
                alt="VietQR Payment"
                className="w-full h-auto rounded-xl mx-auto border border-black/10"
              />
            </div>

            {/* Memo details */}
            <div className="text-left text-xs bg-[#f1f3f6] p-3 rounded-xl border border-black/20 space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Ngân hàng:</span>
                <span className="font-bold text-black">{session.club.bankCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Số tài khoản:</span>
                <span className="font-mono font-bold text-black">{session.club.bankAccountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Chủ tài khoản:</span>
                <span className="font-bold text-black">{session.club.bankAccountName || "THU QUY"}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-black/10">
                <span className="text-zinc-500">Nội dung:</span>
                <span className="font-mono font-bold text-black">{selectedQR.description}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedQR(null)}
              className="w-full py-2.5 rounded-full text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 transition-colors"
            >
              Đóng Mã QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
