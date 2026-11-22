"use client";

import { useState, useEffect } from "react";
import { formatVND } from "@/lib/utils";
import { updateShuttleCount } from "@/server/actions/session";
import { Plus, Minus, Package, Sparkles } from "lucide-react";

interface ShuttleCounterProps {
  sessionId: string;
  initialQuantity: number;
  unitPrice: number;
  isLeader: boolean;
}

export function ShuttleCounter({
  sessionId,
  initialQuantity,
  unitPrice,
  isLeader,
}: ShuttleCounterProps) {
  const [quantity, setQuantity] = useState(initialQuantity);

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  const handleUpdate = async (delta: number) => {
    if (!isLeader) return;
    const prev = quantity;
    const target = Math.max(0, prev + delta);
    // Optimistic UI: Phản hồi tức thì 0ms
    setQuantity(target);

    const res = await updateShuttleCount(sessionId, delta);
    if (!res?.success) {
      setQuantity(prev); // rollback nếu lỗi
      alert(res?.error || "Lỗi cập nhật số cầu.");
    }
  };

  const totalAmount = quantity * unitPrice;

  return (
    <div className="bg-white border border-black rounded-[22px] p-5 sm:p-6 shadow-[5px_5px_0px_#000000]">
      <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
            Tiêu Hao Tại Sân
          </span>
          <h3 className="text-base font-black uppercase text-black leading-tight flex items-center gap-1.5">
            <span>🏸 Bộ Đếm Quả Cầu Bung Hộp</span>
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#ffd731] text-black border border-black shadow-[1px_1px_0px_#000000]">
          {formatVND(unitPrice)}/quả
        </span>
      </div>

      {/* Main Display Counter */}
      <div className="bg-[#f1f3f6] border border-black rounded-2xl p-4 text-center mb-4">
        <span className="text-[11px] font-bold text-zinc-600 uppercase block mb-0.5">
          Tổng số quả đã dùng:
        </span>
        <div className="text-4xl sm:text-5xl font-black text-black tracking-tight leading-none my-1">
          {quantity} <span className="text-lg sm:text-xl font-bold text-zinc-500">quả</span>
        </div>
        <span className="text-sm font-black text-[#fb4903] block mt-1">
          = {formatVND(totalAmount)}
        </span>
      </div>

      {/* Tactile Big Buttons for Court Action (>44px touch target) */}
      {isLeader ? (
        <div className="space-y-2.5">
          {/* Individual Shuttle +1 / -1 Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={quantity <= 0}
              onClick={() => handleUpdate(-1)}
              className="min-h-[48px] py-2.5 px-4 rounded-xl text-sm font-black uppercase bg-white text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000000] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
              <span>Bớt 1 Quả</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdate(1)}
              className="min-h-[48px] py-2.5 px-4 rounded-xl text-sm font-black uppercase bg-[#55db9c] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#43c487] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000000] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+1 Quả Cầu</span>
            </button>
          </div>

          {/* Full Tube Buttons (+12 / -12) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={quantity < 12}
              onClick={() => handleUpdate(-12)}
              className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold bg-[#f1f3f6] text-zinc-700 border border-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <span>- 1 Ống (12q)</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdate(12)}
              className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-black uppercase bg-[#e9ccff] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#d8b5ff] transition-all flex items-center justify-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" />
              <span>+ 1 Ống (12 quả)</span>
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-zinc-500 font-medium">
          Chỉ Thủ quỹ hoặc Trưởng nhóm mới có quyền điều chỉnh số cầu.
        </p>
      )}
    </div>
  );
}
