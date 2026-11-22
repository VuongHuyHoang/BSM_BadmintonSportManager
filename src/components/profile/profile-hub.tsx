"use client";

import { useState } from "react";
import Link from "next/link";
import { formatVND, generateVietQRUrl, removeVietnameseAccents } from "@/lib/utils";
import { 
  User, 
  Mail, 
  Phone, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Users, 
  QrCode, 
  ArrowRight, 
  X, 
  Building,
  Sparkles,
  Shield,
  ExternalLink
} from "lucide-react";

interface ProfileHubProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
  memberships: {
    id: string;
    clubId: string;
    role: string;
    membershipType: string;
    club: {
      id: string;
      name: string;
      inviteCode: string;
      bankCode: string | null;
      bankAccountNo: string | null;
      bankAccountName: string | null;
    };
  }[];
  unpaidAttendances: {
    id: string;
    courtFeeShare: number;
    shuttleFeeShare: number;
    extraFeeShare: number;
    totalAmount: number;
    session: {
      id: string;
      courtName: string;
      startTime: Date;
      club: {
        id: string;
        name: string;
        bankCode: string | null;
        bankAccountNo: string | null;
        bankAccountName: string | null;
      };
    };
  }[];
  paidAttendances: {
    id: string;
    courtFeeShare: number;
    shuttleFeeShare: number;
    extraFeeShare: number;
    totalAmount: number;
    paidAt?: Date | null;
    session: {
      id: string;
      courtName: string;
      startTime: Date;
      club: {
        name: string;
      };
    };
  }[];
}

export function ProfileHub({
  user,
  memberships,
  unpaidAttendances,
  paidAttendances,
}: ProfileHubProps) {
  const [activeTab, setActiveTab] = useState<"DEBT" | "PAID" | "CLUBS">("DEBT");
  const [selectedQR, setSelectedQR] = useState<{
    courtName: string;
    clubName: string;
    amount: number;
    qrUrl: string;
    bankCode: string | null;
    bankAccountNo: string | null;
    bankAccountName: string | null;
    memo: string;
  } | null>(null);

  const totalUnpaid = unpaidAttendances.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaid = paidAttendances.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalSessionsJoined = unpaidAttendances.length + paidAttendances.length;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleOpenQR = (att: typeof unpaidAttendances[0]) => {
    const club = att.session.club;
    if (!club.bankCode || !club.bankAccountNo) {
      alert("Câu lạc bộ này chưa cài đặt tài khoản ngân hàng để tạo mã VietQR.");
      return;
    }

    const memo = `BSM ${removeVietnameseAccents(user.name || "HoiVien")} Buoi${new Date(att.session.startTime).getDate()}${new Date(att.session.startTime).getMonth() + 1}`;
    const qrUrl = generateVietQRUrl({
      bankCode: club.bankCode,
      accountNo: club.bankAccountNo,
      accountName: club.bankAccountName,
      amount: att.totalAmount,
      description: memo,
    });

    setSelectedQR({
      courtName: att.session.courtName,
      clubName: club.name,
      amount: att.totalAmount,
      qrUrl,
      bankCode: club.bankCode,
      bankAccountNo: club.bankAccountNo,
      bankAccountName: club.bankAccountName,
      memo,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Profile Banner */}
      <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#55db9c] border-2 border-black flex items-center justify-center font-black text-2xl sm:text-3xl text-black shadow-[3px_3px_0px_#000000] shrink-0">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#ffd731] text-black border border-black mb-1.5 shadow-[1px_1px_0px_#000000]">
                <span>Tài Khoản Vận Động Viên</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black leading-tight">
                {user.name || "Vận Động Viên"}
              </h1>
              <span className="text-xs text-zinc-600 font-medium flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {user.email || "Chưa cập nhật email"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-black/10">
          {/* Nợ chưa thanh toán */}
          <div className="bg-[#fff7ed] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
              Khoản Chưa Nộp
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#fb4903] block mt-0.5">
              {formatVND(totalUnpaid)}
            </span>
            <span className="text-[11px] text-zinc-600 font-bold block mt-1">
              {unpaidAttendances.length} buổi cần quét QR
            </span>
          </div>

          {/* Đã thanh toán */}
          <div className="bg-[#f0fdf4] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block">
              Đã Thanh Toán
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#16a34a] block mt-0.5">
              {formatVND(totalPaid)}
            </span>
            <span className="text-[11px] text-zinc-600 font-bold block mt-1">
              {paidAttendances.length} buổi đã đóng
            </span>
          </div>

          {/* Số buổi tham gia */}
          <div className="bg-[#f8fafc] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 block">
              Tổng Buổi Đã Chơi
            </span>
            <span className="text-xl sm:text-2xl font-black text-black block mt-0.5">
              {totalSessionsJoined} <span className="text-sm font-bold text-zinc-500">buổi</span>
            </span>
            <span className="text-[11px] text-zinc-600 font-bold block mt-1">
              Đã điểm danh có mặt
            </span>
          </div>

          {/* CLB Tham gia */}
          <div className="bg-[#f8fafc] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 block">
              Câu Lạc Bộ
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#5c4ade] block mt-0.5">
              {memberships.length} <span className="text-sm font-bold text-zinc-500">nhóm</span>
            </span>
            <span className="text-[11px] text-zinc-600 font-bold block mt-1">
              Đang hoạt động
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("DEBT")}
          className={`px-4 py-2 rounded-full text-xs font-black uppercase border border-black transition-all ${
            activeTab === "DEBT"
              ? "bg-[#fb4903] text-white shadow-[2px_2px_0px_#000000]"
              : "bg-white text-black hover:bg-zinc-100"
          }`}
        >
          Khoản Cần Nộp ({unpaidAttendances.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PAID")}
          className={`px-4 py-2 rounded-full text-xs font-black uppercase border border-black transition-all ${
            activeTab === "PAID"
              ? "bg-[#55db9c] text-black shadow-[2px_2px_0px_#000000]"
              : "bg-white text-black hover:bg-zinc-100"
          }`}
        >
          Lịch Sử Đã Đóng ({paidAttendances.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CLUBS")}
          className={`px-4 py-2 rounded-full text-xs font-black uppercase border border-black transition-all ${
            activeTab === "CLUBS"
              ? "bg-black text-white shadow-[2px_2px_0px_#55db9c]"
              : "bg-white text-black hover:bg-zinc-100"
          }`}
        >
          Câu Lạc Bộ Của Tôi ({memberships.length})
        </button>
      </div>

      {/* 4. Tab Content */}
      {/* TAB 1: KHOẢN CHƯA NỘP (DEBT TRACKER) */}
      {activeTab === "DEBT" && (
        <div className="space-y-4">
          {unpaidAttendances.length === 0 ? (
            <div className="bg-white border border-black rounded-[22px] p-8 text-center shadow-[4px_4px_0px_#000000]">
              <CheckCircle2 className="w-12 h-12 text-[#16a34a] mx-auto mb-2" />
              <h3 className="text-base font-black uppercase text-black">
                Tuyệt Vời! Bạn Không Nợ Khoản Nào
              </h3>
              <p className="text-xs text-zinc-600 font-medium mt-1">
                Tất cả các buổi đánh trước đó của bạn đã được thanh toán đầy đủ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unpaidAttendances.map((att) => (
                <div
                  key={att.id}
                  className="bg-white border border-black rounded-[22px] p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                        {att.session.club.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#fb4903] text-white border border-black uppercase animate-pulse">
                        Chưa Nộp
                      </span>
                    </div>

                    <h4 className="text-base font-black text-black leading-tight mb-1">
                      {att.session.courtName}
                    </h4>

                    <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1 mb-3">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {formatDate(att.session.startTime)}
                    </span>

                    {/* Breakdown */}
                    <div className="text-xs space-y-1 bg-[#f8fafc] p-2.5 rounded-xl border border-black/10 font-semibold mb-4">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Tiền sân:</span>
                        <span className="text-black">{formatVND(att.courtFeeShare)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Tiền cầu:</span>
                        <span className="text-black">{formatVND(att.shuttleFeeShare)}</span>
                      </div>
                      {att.extraFeeShare > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Nước & phụ phí:</span>
                          <span className="text-amber-800">{formatVND(att.extraFeeShare)}</span>
                        </div>
                      )}
                      <div className="pt-1 border-t border-black/10 flex justify-between font-black text-sm">
                        <span>Cần Nộp:</span>
                        <span className="text-[#fb4903]">{formatVND(att.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Tap VietQR Trigger */}
                  <div className="flex items-center gap-2 pt-2 border-t border-black/10">
                    <button
                      type="button"
                      onClick={() => handleOpenQR(att)}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase bg-[#5c4ade] text-white border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#4b39cb] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Quét VietQR Nộp Ngay</span>
                    </button>
                    <Link
                      href={`/sessions/${att.session.id}/split`}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold bg-white text-black border border-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 transition-colors"
                      title="Xem toàn bộ hóa đơn buổi này"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LỊCH SỬ ĐÃ ĐÓNG */}
      {activeTab === "PAID" && (
        <div className="space-y-3">
          {paidAttendances.length === 0 ? (
            <div className="bg-white border border-black rounded-[22px] p-8 text-center shadow-[4px_4px_0px_#000000]">
              <p className="text-sm font-bold text-zinc-600">Chưa có lịch sử thanh toán nào</p>
            </div>
          ) : (
            <div className="bg-white border border-black rounded-[22px] p-5 shadow-[4px_4px_0px_#000000] divide-y divide-black/10">
              {paidAttendances.map((att) => (
                <div key={att.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                      {att.session.club.name}
                    </span>
                    <h4 className="text-sm font-black text-black leading-tight">
                      {att.session.courtName}
                    </h4>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      {formatDate(att.session.startTime)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-[#16a34a] block">
                      {formatVND(att.totalAmount)}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
                      Đã xác nhận
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CÂU LẠC BỘ THAM GIA */}
      {activeTab === "CLUBS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memberships.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-black rounded-[22px] p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border border-black uppercase ${
                      m.role === "ADMIN"
                        ? "bg-[#ffd731] text-black"
                        : m.role === "TREASURER"
                        ? "bg-[#55db9c] text-black"
                        : "bg-white text-zinc-700"
                    }`}
                  >
                    {m.role === "ADMIN" ? "Trưởng Nhóm" : m.role === "TREASURER" ? "Thủ Quỹ" : "Thành Viên"}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-black ${
                      m.membershipType === "FULL_MONTHLY"
                        ? "bg-[#e9ccff] text-black"
                        : m.membershipType === "COURT_ONLY_MONTHLY"
                        ? "bg-[#4da2ff] text-white"
                        : "bg-[#f1f3f6] text-black"
                    }`}
                  >
                    {m.membershipType === "FULL_MONTHLY"
                      ? "Trọn Gói"
                      : m.membershipType === "COURT_ONLY_MONTHLY"
                      ? "Chỉ Sân"
                      : "Theo Buổi"}
                  </span>
                </div>

                <h4 className="text-lg font-black text-black leading-tight mb-1">
                  {m.club.name}
                </h4>
                <p className="text-xs text-zinc-600 font-medium mb-4">
                  Mã mời: <span className="font-mono font-bold bg-[#f1f3f6] px-1.5 py-0.5 rounded border border-black/20">{m.club.inviteCode}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-black/10 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">
                  {m.club.bankAccountNo ? `STK: ${m.club.bankAccountNo}` : "Chưa cài đặt STK"}
                </span>
                <Link
                  href={`/clubs/${m.club.id}`}
                  className="px-4 py-1.5 rounded-full text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 transition-colors flex items-center gap-1"
                >
                  <span>Vào CLB</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. VietQR Pop-up Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-2 border-black rounded-[24px] max-w-sm w-full p-6 shadow-[8px_8px_0px_#000000] text-center">
            <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                Mã VietQR Thanh Toán
              </span>
              <button
                type="button"
                onClick={() => setSelectedQR(null)}
                className="h-8 w-8 rounded-full border border-black flex items-center justify-center bg-zinc-100 hover:bg-black hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3">
              <span className="text-xs font-bold text-zinc-500 block">{selectedQR.clubName}</span>
              <span className="text-base font-black text-black leading-tight block">
                {selectedQR.courtName}
              </span>
              <span className="text-2xl font-black text-[#5c4ade] block mt-1">
                {formatVND(selectedQR.amount)}
              </span>
            </div>

            <div className="p-3 bg-[#f8fafc] border border-black rounded-2xl shadow-[3px_3px_0px_#000000] mb-4">
              <img
                src={selectedQR.qrUrl}
                alt="VietQR Payment"
                className="w-full h-auto rounded-xl mx-auto border border-black/10"
              />
            </div>

            <div className="text-left text-xs bg-[#f1f3f6] p-3 rounded-xl border border-black/20 space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Ngân hàng:</span>
                <span className="font-bold text-black">{selectedQR.bankCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Số tài khoản:</span>
                <span className="font-mono font-bold text-black">{selectedQR.bankAccountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Người nhận:</span>
                <span className="font-bold text-black">{selectedQR.bankAccountName || "THU QUY"}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-black/10">
                <span className="text-zinc-500">Nội dung:</span>
                <span className="font-mono font-bold text-black">{selectedQR.memo}</span>
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
