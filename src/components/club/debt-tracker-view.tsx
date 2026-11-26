"use client";

import { useState } from "react";
import { formatVND, generateVietQRUrl } from "@/lib/utils";
import { togglePaymentStatus, settleAllDebtsForMember } from "@/server/actions/session";
import { 
  AlertCircle, 
  Copy, 
  Check, 
  CheckCircle2, 
  Calendar, 
  User, 
  Phone, 
  Share2, 
  Sparkles,
  ExternalLink,
  QrCode,
  CheckCheck,
  X
} from "lucide-react";
import Link from "next/link";

interface UnpaidItem {
  id: string; // attendanceId
  totalAmount: number;
  session: {
    id: string;
    courtName: string;
    startTime: Date;
  };
  member: {
    id: string;
    displayName: string;
    phone: string | null;
    membershipType: string;
  };
}

interface DebtTrackerViewProps {
  club: {
    id: string;
    name: string;
    bankCode: string | null;
    bankAccountNo: string | null;
    bankAccountName: string | null;
  };
  unpaidAttendances: UnpaidItem[];
  isLeader: boolean;
}

export function DebtTrackerView({
  club,
  unpaidAttendances,
  isLeader,
}: DebtTrackerViewProps) {
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [batchLoadingMemberId, setBatchLoadingMemberId] = useState<string | null>(null);
  const [qrModalMember, setQrModalMember] = useState<{
    displayName: string;
    totalAmount: number;
  } | null>(null);

  // Gom nhóm danh sách nợ theo từng thành viên
  const groupedDebts = unpaidAttendances.reduce<Record<string, {
    member: UnpaidItem["member"];
    items: UnpaidItem[];
    totalUnpaid: number;
  }>>((acc, curr) => {
    const mId = curr.member.id;
    if (!acc[mId]) {
      acc[mId] = {
        member: curr.member,
        items: [],
        totalUnpaid: 0,
      };
    }
    acc[mId].items.push(curr);
    acc[mId].totalUnpaid += curr.totalAmount;
    return acc;
  }, {});

  const debtList = Object.values(groupedDebts).sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  const totalClubDebt = unpaidAttendances.reduce((sum, item) => sum + item.totalAmount, 0);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      weekday: "short",
    }).format(new Date(date));
  };

  // Sao chép tin nhắn nhắc nợ gửi nhóm Zalo
  const handleCopyZaloReminder = () => {
    const bankInfo = club.bankAccountNo
      ? `\n💳 THÔNG TIN CHUYỂN KHOẢN VIETQR:\n- Ngân hàng: ${club.bankCode}\n- STK: ${club.bankAccountNo}\n- Tên TK: ${club.bankAccountName || "THU QUY"}\n- Nội dung: BSM [Tên_bạn]`
      : "\n⚠️ CLB chưa cài đặt thông tin STK chuyển khoản.";

    const lines = debtList.map((d, idx) => {
      const sessionDetails = d.items
        .map((it) => `${it.session.courtName} (${formatDate(it.session.startTime)})`)
        .join(", ");
      return `${idx + 1}. ${d.member.displayName}: ${formatVND(d.totalUnpaid)} [${sessionDetails}]`;
    }).join("\n");

    const message = `🏸 THÔNG BÁO QUỸ CLB ${club.name.toUpperCase()} - DANH SÁCH CẦN ĐỐI SOÁT:
Tổng cộng: ${debtList.length} bạn · ${formatVND(totalClubDebt)} chưa thu

📋 CHI TIẾT:
${lines}
${bankInfo}

👉 Các bạn tranh thủ quét mã VietQR để thủ quỹ chốt sổ nhé. Cảm ơn cả nhà! ❤️`;

    navigator.clipboard.writeText(message);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 3000);
  };

  const handleQuickConfirmPaid = async (attendanceId: string) => {
    if (!isLeader) return;
    setConfirmingId(attendanceId);
    await togglePaymentStatus(attendanceId, "PAID");
    setConfirmingId(null);
  };

  const handleSettleAll = async (memberId: string) => {
    if (!isLeader) return;
    if (!confirm("Xác nhận đã nhận đủ tiền và gạch nợ toàn bộ các buổi cho thành viên này?")) return;
    setBatchLoadingMemberId(memberId);
    const res = await settleAllDebtsForMember(club.id, memberId);
    setBatchLoadingMemberId(null);
    if (!res.success) {
      alert(res.error || "Lỗi gạch nợ hàng loạt.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & KPI Bar */}
      <div className="bg-white border border-black rounded-[24px] p-6 sm:p-7 shadow-[6px_6px_0px_#000000]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#fb4903] text-white border border-black shadow-[1px_1px_0px_#000000] mb-2">
              <span>Đối Soát Nợ Buổi Đánh</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black leading-tight">
              Bảng Theo Dõi Nợ CLB
            </h2>
            <p className="text-xs text-zinc-600 font-medium mt-1">
              Tổng hợp những thành viên và khách vãng lai chưa nộp tiền để Thủ quỹ dễ dàng nhắc nhở
            </p>
          </div>

          {debtList.length > 0 && (
            <button
              type="button"
              onClick={handleCopyZaloReminder}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase border border-black shadow-[3px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto ${
                copiedZalo
                  ? "bg-[#55db9c] text-black"
                  : "bg-[#0088cc] text-white hover:bg-[#0077b3]"
              }`}
            >
              {copiedZalo ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Đã Copy Bản Nhắc Nợ Zalo!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao Chép Bản Nhắc Zalo</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 2 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-6">
          <div className="bg-[#fff7ed] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
              Tổng Nợ Chưa Thu
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#fb4903] block mt-1 tracking-tight">
              {formatVND(totalClubDebt)}
            </span>
            <span className="text-[10px] text-zinc-500 font-bold block mt-1">
              Từ các buổi đánh đã chia bill
            </span>
          </div>

          <div className="bg-[#f8fafc] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
              Số Người Chưa Nộp
            </span>
            <span className="text-2xl sm:text-3xl font-black text-black block mt-1 tracking-tight">
              {debtList.length} <span className="text-lg font-bold text-zinc-500">người</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-bold block mt-1">
              Gồm thành viên & khách vãng lai
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grouped Debt List */}
      <div className="bg-white border border-black rounded-[24px] p-5 sm:p-7 shadow-[6px_6px_0px_#000000]">
        <h3 className="text-base font-black uppercase text-black mb-4 flex items-center justify-between">
          <span>Chi Tiết Khoản Nợ Theo Người</span>
          <span className="text-xs font-normal text-zinc-500">
            ({debtList.length} người còn nợ)
          </span>
        </h3>

        {debtList.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-black/20 rounded-2xl bg-[#f0fdf4]">
            <CheckCircle2 className="w-14 h-14 text-[#16a34a] mx-auto mb-2" />
            <h4 className="text-base font-black uppercase text-black">Tuyệt Vời! Không Có Ai Nợ Tiền</h4>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto mt-1">
              Tất cả các thành viên và khách vãng lai trong câu lạc bộ đều đã thanh toán đầy đủ các khoản tiền buổi đánh.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {debtList.map((d) => (
              <div
                key={d.member.id}
                className="border border-black rounded-[20px] p-4 sm:p-5 shadow-[4px_4px_0px_#000000] bg-white hover:bg-zinc-50/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-black">
                        {d.member.displayName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded border border-black/30 ${
                          d.member.membershipType === "FULL_MONTHLY"
                            ? "bg-[#e9ccff] text-black"
                            : d.member.membershipType === "COURT_ONLY_MONTHLY"
                            ? "bg-[#4da2ff] text-white"
                            : d.member.membershipType === "GUEST"
                            ? "bg-[#fb4903] text-white"
                            : "bg-[#ffd731] text-black"
                        }`}
                      >
                        {d.member.membershipType === "FULL_MONTHLY"
                          ? "Trọn Gói"
                          : d.member.membershipType === "COURT_ONLY_MONTHLY"
                          ? "Chỉ Sân"
                          : d.member.membershipType === "GUEST"
                          ? "Vãng Lai"
                          : "Theo Buổi"}
                      </span>
                    </div>

                    {d.member.phone && (
                      <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {d.member.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    <div className="text-right mr-1">
                      <span className="text-[10px] font-bold text-zinc-500 block">Tổng nợ:</span>
                      <span className="text-base sm:text-lg font-black text-[#fb4903] block leading-tight">
                        {formatVND(d.totalUnpaid)}
                      </span>
                    </div>

                    {/* Nút xem mã VietQR thu gộp */}
                    {club.bankCode && club.bankAccountNo && (
                      <button
                        type="button"
                        onClick={() => setQrModalMember({ displayName: d.member.displayName, totalAmount: d.totalUnpaid })}
                        className="px-2.5 py-1.5 rounded-xl border border-black bg-[#5c4ade] text-white shadow-[2px_2px_0px_#000000] hover:bg-[#4b39cb] transition-colors flex items-center gap-1 text-[11px] font-black uppercase"
                        title="Tạo mã VietQR chuyển gộp toàn bộ"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Gộp</span>
                      </button>
                    )}

                    {/* Nút xác nhận thu toàn bộ */}
                    {isLeader && (
                      <button
                        type="button"
                        disabled={batchLoadingMemberId === d.member.id}
                        onClick={() => handleSettleAll(d.member.id)}
                        className="px-3 py-1.5 rounded-xl border border-black bg-[#55db9c] text-black shadow-[2px_2px_0px_#000000] hover:bg-[#42c586] transition-all flex items-center gap-1 text-[11px] font-black uppercase"
                        title="Xác nhận gạch nợ tất cả các buổi"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>{batchLoadingMemberId === d.member.id ? "Đang Gạch..." : `Gạch Hết (${d.items.length})`}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-items: Danh sách các buổi chưa nộp của người này */}
                <div className="mt-3 space-y-2">
                  {d.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 bg-[#f8fafc] border border-black/10 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="font-bold text-black truncate">
                          {it.session.courtName}
                        </span>
                        <span className="text-zinc-500 font-medium">
                          ({formatDate(it.session.startTime)})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black text-black">
                          {formatVND(it.totalAmount)}
                        </span>

                        {isLeader && (
                          <button
                            type="button"
                            disabled={confirmingId === it.id}
                            onClick={() => handleQuickConfirmPaid(it.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-[#55db9c] text-black border border-black shadow-[1px_1px_0px_#000000] hover:bg-[#43c487] flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Xác Nhận Đã Thu</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Xem Mã VietQR Thu Gộp */}
      {qrModalMember && club.bankCode && club.bankAccountNo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-2 border-black rounded-[24px] p-6 max-w-sm w-full shadow-[8px_8px_0px_#000000] space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-black">
              <h3 className="text-sm font-black uppercase text-black flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#5c4ade]" />
                <span>VietQR Thu Nợ Gộp</span>
              </h3>
              <button
                type="button"
                onClick={() => setQrModalMember(null)}
                className="p-1 rounded-full hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs text-zinc-600 font-semibold block">
                {qrModalMember.displayName}
              </span>
              <span className="text-2xl font-black text-[#fb4903] block mt-0.5 tracking-tight">
                {formatVND(qrModalMember.totalAmount)}
              </span>
              <span className="text-[10px] font-bold text-zinc-500 block">
                Thanh toán toàn bộ các buổi nợ đọng
              </span>
            </div>

            <div className="bg-white p-3 border-2 border-black rounded-2xl shadow-[4px_4px_0px_#000000] inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generateVietQRUrl({
                  bankCode: club.bankCode,
                  accountNo: club.bankAccountNo,
                  accountName: club.bankAccountName || club.name,
                  amount: qrModalMember.totalAmount,
                  description: `BSM TraNo ${qrModalMember.displayName}`,
                })}
                alt="VietQR nợ gộp"
                className="w-56 h-auto mx-auto rounded-lg"
              />
            </div>

            <p className="text-[11px] text-zinc-500 font-medium">
              Quét mã 1 lần duy nhất bằng app ngân hàng để chuyển khoản toàn bộ công nợ.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
