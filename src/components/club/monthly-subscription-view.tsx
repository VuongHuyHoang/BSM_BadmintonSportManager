"use client";

import { useState } from "react";
import { formatVND, generateVietQRUrl } from "@/lib/utils";
import { 
  createMonthlyPeriod, 
  toggleMonthlyPayment, 
  deleteMonthlyPeriod 
} from "@/server/actions/monthly-subscription";
import { 
  Calendar, 
  PlusCircle, 
  CheckCircle2, 
  Circle, 
  QrCode, 
  Trash2, 
  AlertCircle,
  Users,
  Wallet,
  X
} from "lucide-react";

interface PaymentItem {
  id: string;
  memberId: string;
  amount: number;
  isPaid: boolean;
  paidAt: Date | null;
  confirmedBy: string | null;
  member: {
    id: string;
    displayName: string;
    phone: string | null;
    membershipType: string;
  };
}

interface MonthlyPeriodItem {
  id: string;
  clubId: string;
  month: number;
  year: number;
  title: string;
  feeAmount: number;
  dueDate: Date | null;
  createdAt: Date;
  payments: PaymentItem[];
}

interface MonthlySubscriptionViewProps {
  clubId: string;
  clubName: string;
  bankCode: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  monthlyPeriods: MonthlyPeriodItem[];
  isLeader: boolean;
  currentUserId?: string | null;
}

export function MonthlySubscriptionView({
  clubId,
  clubName,
  bankCode,
  bankAccountNo,
  bankAccountName,
  monthlyPeriods,
  isLeader,
  currentUserId,
}: MonthlySubscriptionViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    monthlyPeriods[0]?.id || ""
  );
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [qrModalPayment, setQrModalPayment] = useState<{
    payment: PaymentItem;
    period: MonthlyPeriodItem;
  } | null>(null);

  // Form create state
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [feeAmount, setFeeAmount] = useState("500000");
  const [title, setTitle] = useState(`Quỹ Cố Định Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`);

  const activePeriod = monthlyPeriods.find((p) => p.id === selectedPeriodId) || monthlyPeriods[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("month", month.toString());
    formData.append("year", year.toString());
    formData.append("title", title);
    formData.append("feeAmount", feeAmount);

    const res = await createMonthlyPeriod(clubId, formData);
    setLoading(false);
    if (res.success) {
      setShowCreateModal(false);
      if (res.periodId) {
        setSelectedPeriodId(res.periodId);
      }
    } else {
      alert(res.error || "Lỗi tạo kỳ thu quỹ.");
    }
  };

  const handleTogglePayment = async (paymentId: string, currentPaid: boolean) => {
    if (!isLeader) return;
    setActionLoadingId(paymentId);
    const res = await toggleMonthlyPayment(paymentId, !currentPaid);
    setActionLoadingId(null);
    if (!res.success) {
      alert(res.error || "Lỗi cập nhật nộp quỹ.");
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!isLeader) return;
    if (!confirm("Bạn có chắc chắn muốn xóa kỳ thu quỹ này?")) return;
    setLoading(true);
    const res = await deleteMonthlyPeriod(periodId);
    setLoading(false);
    if (!res.success) {
      alert(res.error || "Không thể xóa kỳ thu quỹ.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-0.5">
            Quản Lý Hội Viên Cố Định
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-black leading-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#5c4ade]" />
            <span>Quỹ Tháng Cố Định</span>
          </h2>
        </div>

        {isLeader && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#f0c518] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tạo Kỳ Thu Quỹ Tháng Mới</span>
          </button>
        )}
      </div>

      {/* 2. Content */}
      {monthlyPeriods.length === 0 ? (
        <div className="bg-white border border-black rounded-[24px] p-8 text-center shadow-[4px_4px_0px_#000000] space-y-3">
          <Calendar className="w-12 h-12 text-zinc-400 mx-auto" />
          <h3 className="text-base font-black uppercase text-black">
            Chưa Có Đợt Thu Quỹ Nào
          </h3>
          <p className="text-xs font-semibold text-zinc-600 max-w-md mx-auto">
            Tạo kỳ thu quỹ hàng tháng giúp Trưởng nhóm và Thủ quỹ theo dõi chính xác ai đã đóng tiền gói tháng, tự động hạch toán vào Sổ Quỹ minh bạch.
          </p>
          {isLeader && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-2 px-5 py-2.5 rounded-full text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 transition-colors inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-[#55db9c]" />
              <span>Tạo Kỳ Thu Đầu Tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs chọn kỳ thu */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {monthlyPeriods.map((p) => {
              const isSelected = p.id === activePeriod?.id;
              const paidCount = p.payments.filter((item) => item.isPaid).length;
              const totalCount = p.payments.length;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriodId(p.id)}
                  className={`px-4 py-2 rounded-2xl border border-black text-xs font-black uppercase shrink-0 transition-all ${
                    isSelected
                      ? "bg-black text-white shadow-[3px_3px_0px_#55db9c]"
                      : "bg-white text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tháng {p.month}/{p.year}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${isSelected ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700"}`}>
                      {paidCount}/{totalCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {activePeriod && (
            <div className="bg-white border border-black rounded-[24px] p-6 shadow-[6px_6px_0px_#000000] space-y-6">
              {/* Thống kê tiến độ kỳ thu */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black">
                <div>
                  <h3 className="text-lg font-black uppercase text-black">
                    {activePeriod.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-600 mt-1">
                    <span>Định mức: <strong>{formatVND(activePeriod.feeAmount)}</strong></span>
                    <span>·</span>
                    <span>Tổng hội viên: <strong>{activePeriod.payments.length} người</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#55db9c] text-black border border-black shadow-[2px_2px_0px_#000000]">
                    Đã thu: {activePeriod.payments.filter((p) => p.isPaid).length} / {activePeriod.payments.length}
                  </div>
                  {isLeader && (
                    <button
                      type="button"
                      onClick={() => handleDeletePeriod(activePeriod.id)}
                      className="p-2 rounded-full border border-black bg-[#ffd7d7] text-[#e11d48] hover:bg-[#fecdd3] transition-colors"
                      title="Xóa đợt thu này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Danh sách hội viên trong kỳ thu */}
              <div className="divide-y divide-black/10">
                {activePeriod.payments.length === 0 ? (
                  <p className="py-4 text-xs font-semibold text-zinc-500 italic text-center">
                    Chưa có hội viên cố định nào trong danh sách gói tháng của CLB.
                  </p>
                ) : (
                  activePeriod.payments.map((p) => {
                    const qrUrl = (bankCode && bankAccountNo)
                      ? generateVietQRUrl({
                          bankCode,
                          accountNo: bankAccountNo,
                          accountName: bankAccountName || clubName,
                          amount: p.amount,
                          description: `BSM QuyT${activePeriod.month} ${p.member.displayName}`,
                        })
                      : null;

                    return (
                      <div
                        key={p.id}
                        className={`py-3.5 px-3 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                          p.isPaid ? "bg-[#f0fdf4]" : "hover:bg-zinc-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isLeader ? (
                            <button
                              type="button"
                              disabled={actionLoadingId === p.id}
                              onClick={() => handleTogglePayment(p.id, p.isPaid)}
                              className="focus:outline-none hover:scale-110 transition-transform shrink-0"
                              title={p.isPaid ? "Bấm để hủy gạch nợ" : "Bấm để xác nhận đã nộp"}
                            >
                              {p.isPaid ? (
                                <CheckCircle2 className="w-6 h-6 text-[#16a34a] fill-[#55db9c]" />
                              ) : (
                                <Circle className="w-6 h-6 text-zinc-400 hover:text-black" />
                              )}
                            </button>
                          ) : (
                            <div className="shrink-0">
                              {p.isPaid ? (
                                <CheckCircle2 className="w-6 h-6 text-[#16a34a] fill-[#55db9c]" />
                              ) : (
                                <Circle className="w-6 h-6 text-zinc-300" />
                              )}
                            </div>
                          )}

                          <div className="min-w-0">
                            <span className="text-sm font-black text-black block truncate">
                              {p.member.displayName}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded font-bold bg-[#e9ccff] text-black border border-black/20">
                                {p.member.membershipType === "FULL_MONTHLY" ? "Trọn Gói Tháng" : "Chỉ Sân Tháng"}
                              </span>
                              {p.member.phone && <span>· {p.member.phone}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-black text-black block">
                              {formatVND(p.amount)}
                            </span>
                            <span className={`text-[10px] font-bold ${p.isPaid ? "text-[#16a34a]" : "text-amber-600"}`}>
                              {p.isPaid ? "Đã Nộp" : "Chưa Nộp"}
                            </span>
                          </div>

                          {!p.isPaid && qrUrl && (
                            <button
                              type="button"
                              onClick={() => setQrModalPayment({ payment: p, period: activePeriod })}
                              className="p-2 rounded-xl border border-black bg-[#5c4ade] text-white shadow-[2px_2px_0px_#000000] hover:bg-[#4b39cb] transition-colors"
                              title="Xem mã VietQR"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Tạo Kỳ Thu Quỹ Tháng */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-2 border-black rounded-[24px] p-6 max-w-md w-full shadow-[8px_8px_0px_#000000] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black">
              <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-black" />
                <span>Tạo Đợt Thu Quỹ Tháng</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full hover:bg-zinc-100 border border-transparent hover:border-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-bold text-black">
              <div>
                <label className="block uppercase text-[10px] font-black text-zinc-600 mb-1">
                  Tên Đợt Thu Quỹ *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-black bg-[#f8fafc] text-sm focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[10px] font-black text-zinc-600 mb-1">
                    Tháng *
                  </label>
                  <select
                    value={month}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10);
                      setMonth(m);
                      setTitle(`Quỹ Cố Định Tháng ${m}/${year}`);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-black bg-[#f8fafc] text-xs focus:outline-none shadow-[2px_2px_0px_#000000]"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block uppercase text-[10px] font-black text-zinc-600 mb-1">
                    Năm *
                  </label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => {
                      const y = parseInt(e.target.value, 10);
                      setYear(y);
                      setTitle(`Quỹ Cố Định Tháng ${month}/${y}`);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-black bg-[#f8fafc] text-xs focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-[10px] font-black text-zinc-600 mb-1">
                  Mức Thu Mặc Định (VNĐ/người) *
                </label>
                <input
                  type="number"
                  required
                  step={10000}
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black bg-[#f8fafc] text-xs focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
                <span className="text-[10px] font-normal text-zinc-500 mt-1 block">
                  Hội viên nào có định mức phí riêng sẽ tự động áp dụng mức phí riêng của họ.
                </span>
              </div>

              <div className="pt-3 border-t border-black/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full border border-black text-xs font-black uppercase hover:bg-zinc-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-full border border-black text-xs font-black uppercase bg-[#55db9c] text-black shadow-[3px_3px_0px_#000000] hover:bg-[#42c586] transition-all"
                >
                  {loading ? "Đang Tạo..." : "Tạo Kỳ Thu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem Mã VietQR Nộp Quỹ Tháng */}
      {qrModalPayment && bankCode && bankAccountNo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-2 border-black rounded-[24px] p-6 max-w-sm w-full shadow-[8px_8px_0px_#000000] space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-black">
              <h3 className="text-sm font-black uppercase text-black">
                VietQR Nộp Quỹ Tháng
              </h3>
              <button
                type="button"
                onClick={() => setQrModalPayment(null)}
                className="p-1 rounded-full hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs text-zinc-600 font-semibold block">
                {qrModalPayment.payment.member.displayName}
              </span>
              <span className="text-lg font-black text-black block mt-0.5">
                {formatVND(qrModalPayment.payment.amount)}
              </span>
              <span className="text-[10px] font-bold text-zinc-500 block">
                {qrModalPayment.period.title}
              </span>
            </div>

            <div className="bg-white p-3 border-2 border-black rounded-2xl shadow-[4px_4px_0px_#000000] inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generateVietQRUrl({
                  bankCode,
                  accountNo: bankAccountNo,
                  accountName: bankAccountName || clubName,
                  amount: qrModalPayment.payment.amount,
                  description: `BSM QuyT${qrModalPayment.period.month} ${qrModalPayment.payment.member.displayName}`,
                })}
                alt="VietQR nộp quỹ tháng"
                className="w-56 h-auto mx-auto rounded-lg"
              />
            </div>

            <p className="text-[11px] text-zinc-500 font-medium">
              Quét mã bằng app ngân hàng bất kỳ để chuyển khoản nhanh Napas247.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
