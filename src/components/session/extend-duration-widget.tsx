"use client";

import { useState } from "react";
import { formatVND } from "@/lib/utils";
import { extendSessionDuration } from "@/server/actions/session";
import { Clock, PlusCircle, AlertCircle, CheckCircle2 } from "lucide-react";

interface ExtendDurationWidgetProps {
  sessionId: string;
  hasExtendedDuration: boolean;
  currentCourtFee: number;
  currentDurationHours: number;
  isLeader: boolean;
}

export function ExtendDurationWidget({
  sessionId,
  hasExtendedDuration,
  currentCourtFee,
  currentDurationHours,
  isLeader,
}: ExtendDurationWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addedHours, setAddedHours] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Tính ước tính tiền sân thêm theo đơn giá giờ hiện tại
  const hourlyRate = currentDurationHours > 0 ? currentCourtFee / currentDurationHours : 90000;
  const initialAdditionalFee = Math.round((hourlyRate * addedHours) / 1000) * 1000;
  const [additionalFee, setAdditionalFee] = useState<number>(initialAdditionalFee);

  const handleHoursChange = (hours: number) => {
    setAddedHours(hours);
    const newFee = Math.round((hourlyRate * hours) / 1000) * 1000;
    setAdditionalFee(newFee);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader || loading) return;

    setLoading(true);
    const res = await extendSessionDuration(sessionId, addedHours, additionalFee);
    setLoading(false);

    if (res.success) {
      setIsOpen(false);
    } else {
      alert(res.error || "Lỗi gia hạn giờ chơi.");
    }
  };

  if (!isLeader) {
    if (hasExtendedDuration) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#e9ccff] text-black border border-black shadow-[1px_1px_0px_#000000]">
          <CheckCircle2 className="w-3 h-3 text-[#5c4ade]" />
          <span>Đã Đánh Thêm Giờ</span>
        </span>
      );
    }
    return null;
  }

  if (hasExtendedDuration) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-[#e9ccff] text-black border border-black shadow-[2px_2px_0px_#000000]">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#5c4ade]" />
        <span>Đã Gia Hạn Giờ (Tối Đa 1 Lần)</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-3 py-1.5 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#f5cd1a] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>+ Đánh Thêm Giờ</span>
        </button>
      ) : (
        <div className="mt-3 bg-white border border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#000000] max-w-md">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-black">
            <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#5c4ade]" />
              Gia Hạn Giờ Đánh (Tối Đa 1 Lần)
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-zinc-500 hover:text-black"
            >
              Đóng
            </button>
          </div>

          <form onSubmit={handleConfirm} className="space-y-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-zinc-700 mb-1">
                Số giờ đánh thêm:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.5, 1, 1.5, 2].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHoursChange(h)}
                    className={`py-1.5 rounded-xl text-xs font-black border border-black transition-all ${
                      addedHours === h
                        ? "bg-black text-white shadow-[2px_2px_0px_#55db9c]"
                        : "bg-[#f1f3f6] text-black hover:bg-zinc-200"
                    }`}
                  >
                    +{h}h
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-zinc-700 mb-1">
                Tiền sân phát sinh thêm (VND):
              </label>
              <input
                type="number"
                step={5000}
                required
                value={additionalFee}
                onChange={(e) => setAdditionalFee(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-black text-sm font-bold bg-[#f8fafc] focus:outline-none"
              />
              <span className="text-[10px] text-zinc-500 font-medium block mt-0.5">
                Ước tính theo giá sân hiện tại: {formatVND(initialAdditionalFee)}
              </span>
            </div>

            <div className="bg-[#fff7ed] border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-900 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Để đảm bảo tính minh bạch thu chi, mỗi buổi đánh chỉ được phép điều chỉnh giờ tối đa 1 lần duy nhất.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-black"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 rounded-xl text-xs font-black uppercase bg-[#55db9c] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#43c487] disabled:opacity-50"
              >
                {loading ? "Đang Cập Nhật..." : `Xác Nhận (+${addedHours}h)`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
