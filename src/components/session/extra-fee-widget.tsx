"use client";

import { useState } from "react";
import { formatVND } from "@/lib/utils";
import { updateSessionExtraFee } from "@/server/actions/session";
import { Coffee, Check } from "lucide-react";

interface ExtraFeeWidgetProps {
  sessionId: string;
  initialOtherFee: number;
  isLeader: boolean;
}

export function ExtraFeeWidget({
  sessionId,
  initialOtherFee,
  isLeader,
}: ExtraFeeWidgetProps) {
  const [fee, setFee] = useState(initialOtherFee);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateSessionExtraFee(sessionId, fee);
    setLoading(false);
    setEditing(false);
  };

  return (
    <div className="bg-white border border-black rounded-[20px] p-4 shadow-[4px_4px_0px_#000000]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
          <Coffee className="w-3.5 h-3.5 text-amber-600" />
          Nước Uống & Phụ Phí Buổi Đánh
        </span>
        {isLeader && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] font-black text-black underline"
          >
            Sửa
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="flex items-center gap-2 mt-1">
          <input
            type="number"
            step={1000}
            value={fee}
            onChange={(e) => setFee(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-1.5 rounded-xl border border-black text-sm bg-[#f1f3f6] font-bold focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-black uppercase border border-black shadow-[2px_2px_0px_#55db9c]"
          >
            Lưu
          </button>
        </form>
      ) : (
        <div className="text-lg font-black text-black">
          {formatVND(fee)}
        </div>
      )}
    </div>
  );
}
