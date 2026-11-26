"use client";

import { useState } from "react";
import { formatVND } from "@/lib/utils";
import { 
  addExtraItemToAttendance, 
  updateExtraItemQuantity, 
  removeExtraItemFromAttendance 
} from "@/server/actions/session";
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Coffee, 
  ShoppingBag, 
  Check, 
  Sparkles 
} from "lucide-react";

export interface ExtraItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ExtraFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceId: string;
  displayName: string;
  extraItems: ExtraItem[];
  isLeader: boolean;
  sessionStatus?: string;
}

// Gom nhóm các sản phẩm có tên giống nhau (không phân biệt hoa/thường)
export function aggregateExtraItems(items: ExtraItem[]) {
  const map = new Map<
    string,
    {
      primaryId: string;
      allIds: string[];
      displayName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }
  >();

  for (const item of items) {
    const key = item.itemName.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        primaryId: item.id,
        allIds: [item.id],
        displayName: item.itemName.trim(),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });
    } else {
      const existing = map.get(key)!;
      existing.allIds.push(item.id);
      existing.quantity += item.quantity;
      existing.totalPrice += item.totalPrice;
    }
  }

  return Array.from(map.values());
}

export function ExtraFeeModal({
  isOpen,
  onClose,
  attendanceId,
  displayName,
  extraItems = [],
  isLeader,
  sessionStatus,
}: ExtraFeeModalProps) {
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState<number>(15000);
  const [loading, setLoading] = useState(false);
  const isCompleted = sessionStatus === "COMPLETED";

  if (!isOpen) return null;

  const aggregated = aggregateExtraItems(extraItems);
  const totalAmount = aggregated.reduce((acc, curr) => acc + curr.totalPrice, 0);

  // Thêm từ preset với ô số lượng đã chọn
  const handleAddPreset = async (name: string, unitPrice: number) => {
    if (loading || isCompleted) return;
    setLoading(true);
    await addExtraItemToAttendance(attendanceId, name, selectedQty, unitPrice);
    setLoading(false);
  };

  // Thêm món tuỳ chỉnh
  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || loading || isCompleted) return;
    setLoading(true);
    await addExtraItemToAttendance(attendanceId, customName, selectedQty, customPrice);
    setLoading(false);
    setCustomName("");
  };

  // Tăng/giảm số lượng
  const handleQuantityDelta = async (primaryId: string, delta: number) => {
    if (loading || isCompleted) return;
    setLoading(true);
    await updateExtraItemQuantity(primaryId, delta);
    setLoading(false);
  };

  // Xóa toàn bộ món này
  const handleRemoveAllForGroup = async (allIds: string[]) => {
    if (loading || isCompleted) return;
    setLoading(true);
    for (const id of allIds) {
      await removeExtraItemFromAttendance(id);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-black rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-[8px_8px_0px_#000000] max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-black mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#ffd731] border border-black flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                <Coffee className="w-5 h-5 text-black" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                  Phụ Phí & Nước Uống Riêng
                </span>
                <h3 className="text-base sm:text-lg font-black uppercase text-black leading-tight">
                  {displayName}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-black flex items-center justify-center bg-zinc-100 hover:bg-black hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Danh sách sản phẩm đã dùng (Gộp 1 dòng và x số lượng) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-700">
                Sản phẩm đã dùng ({aggregated.length} loại):
              </span>
              <span className="text-xs font-black text-[#fb4903]">
                Tổng: {formatVND(totalAmount)}
              </span>
            </div>

            {aggregated.length === 0 ? (
              <div className="py-4 px-3 rounded-xl border border-dashed border-black/20 bg-[#f8fafc] text-center text-xs text-zinc-500 font-medium">
                Chưa có món nước hoặc phụ phí phát sinh nào
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {aggregated.map((item) => (
                  <div
                    key={item.displayName.toLowerCase()}
                    className="p-2.5 rounded-xl border border-black bg-[#fffbeb] shadow-[2px_2px_0px_#000000] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-black">
                          {item.quantity}x {item.displayName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          ({formatVND(item.unitPrice)}/món)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#fb4903]">
                        = {formatVND(item.totalPrice)}
                      </span>
                    </div>

                    {isLeader && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuantityDelta(item.primaryId, -1)}
                          className="h-7 w-7 rounded-lg border border-black bg-white hover:bg-zinc-100 flex items-center justify-center text-black shadow-[1px_1px_0px_#000000] disabled:opacity-50"
                          title="Bớt 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-mono text-xs font-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuantityDelta(item.primaryId, 1)}
                          className="h-7 w-7 rounded-lg border border-black bg-white hover:bg-zinc-100 flex items-center justify-center text-black shadow-[1px_1px_0px_#000000] disabled:opacity-50"
                          title="Thêm 1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleRemoveAllForGroup(item.allIds)}
                          className="h-7 w-7 rounded-lg border border-black bg-red-100 hover:bg-red-500 hover:text-white flex items-center justify-center text-red-600 transition-colors ml-1"
                          title="Xóa hẳn món này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Thao tác thêm nước / phụ phí riêng (Chỉ Leader) */}
          {isLeader && (
            <div className="pt-3 border-t border-black/10 space-y-3">
              {/* Ô Chọn Số Lượng */}
              <div className="flex items-center justify-between gap-2 bg-[#f1f3f6] p-2.5 rounded-xl border border-black">
                <span className="text-xs font-black uppercase text-black">
                  Số lượng thêm:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    className="h-7 w-7 rounded-lg bg-white border border-black flex items-center justify-center font-black text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 h-7 rounded-lg border border-black text-center font-black text-xs bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedQty(selectedQty + 1)}
                    className="h-7 w-7 rounded-lg bg-white border border-black flex items-center justify-center font-black text-sm"
                  >
                    +
                  </button>
                  <div className="flex gap-1 ml-1">
                    {[1, 2, 3, 5].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSelectedQty(q)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border border-black ${
                          selectedQty === q ? "bg-black text-white" : "bg-white text-black"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Các Nút Chọn Nhanh (Preset 1-Chạm) */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Bấm Chọn Nhanh (x{selectedQty} món):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { name: "Nước Revive", price: 15000, label: "💧 Revive 15k" },
                    { name: "Nước suối", price: 10000, label: "💧 Nước suối 10k" },
                    { name: "Bò húc", price: 18000, label: "⚡ Bò húc 18k" },
                    { name: "Quấn cán", price: 25000, label: "🏸 Quấn cán 25k" },
                    { name: "Tất cầu lông", price: 30000, label: "🧦 Tất/vớ 30k" },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={loading}
                      onClick={() => handleAddPreset(preset.name, preset.price)}
                      className="py-1.5 px-2.5 rounded-xl text-xs font-black bg-[#dceeff] hover:bg-[#bfe1ff] text-black border border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] transition-all text-left flex items-center justify-between"
                    >
                      <span className="truncate">{preset.label}</span>
                      {selectedQty > 1 && (
                        <span className="text-[10px] font-mono bg-black text-white px-1 rounded">
                          x{selectedQty}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Thêm Món Khác */}
              <form onSubmit={handleAddCustom} className="pt-2 border-t border-black/10 flex gap-2 items-end">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-black uppercase text-zinc-600 mb-0.5">
                    Món khác:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: C2, Sting, nước Yến..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-black text-xs font-bold bg-[#f8fafc] focus:outline-none"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-black uppercase text-zinc-600 mb-0.5">
                    Đơn giá:
                  </label>
                  <input
                    type="number"
                    step={1000}
                    required
                    value={customPrice}
                    onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-xl border border-black text-xs font-bold bg-[#f8fafc] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase bg-[#55db9c] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#43c487] transition-all shrink-0"
                >
                  + Thêm
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Button */}
        <div className="pt-4 border-t border-black mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 transition-colors"
          >
            Đóng Cửa Sổ Phụ Phí
          </button>
        </div>
      </div>
    </div>
  );
}
