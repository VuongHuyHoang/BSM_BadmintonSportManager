"use client";

import { useState } from "react";
import { createTransaction } from "@/server/actions/treasury";
import { formatVND } from "@/lib/utils";
import { 
  X, 
  PlusCircle, 
  MinusCircle, 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight,
  Sparkles,
  Users
} from "lucide-react";

interface ClubMember {
  id: string;
  displayName: string;
  membershipType: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  members: ClubMember[];
}

export function AddTransactionModal({
  isOpen,
  onClose,
  clubId,
  members,
}: AddTransactionModalProps) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [category, setCategory] = useState<string>("MONTHLY_FUND");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [memberId, setMemberId] = useState<string>("");
  const [shuttleTubes, setShuttleTubes] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert("Vui lòng nhập số tiền lớn hơn 0.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("clubId", clubId);
    formData.append("type", type);
    formData.append("category", category);
    formData.append("amount", amount.toString());
    formData.append("description", description);
    if (memberId) {
      formData.append("memberId", memberId);
    }
    if (type === "EXPENSE" && category === "BUY_SHUTTLE" && shuttleTubes > 0) {
      formData.append("shuttleTubes", shuttleTubes.toString());
    }

    const res = await createTransaction(formData);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      alert(res.error || "Lỗi khi ghi chép sổ quỹ.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-black rounded-[24px] max-w-lg w-full p-6 sm:p-7 shadow-[8px_8px_0px_#000000] relative max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-black mb-5">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[#ffd731] border border-black flex items-center justify-center font-black shadow-[2px_2px_0px_#000000]">
              <Wallet className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase text-black leading-tight">
                Ghi Chép Thu / Chi Sổ Quỹ
              </h3>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Quản lý ngân sách nhóm minh bạch
              </span>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Chọn Loại Giao Dịch (Thu hoặc Chi) */}
          <div>
            <label className="block text-[11px] font-black uppercase text-black mb-1.5">
              Loại Giao Dịch *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType("INCOME");
                  setCategory("MONTHLY_FUND");
                }}
                className={`py-3 px-4 rounded-xl text-xs font-black uppercase border border-black flex items-center justify-center gap-2 transition-all ${
                  type === "INCOME"
                    ? "bg-[#55db9c] text-black shadow-[3px_3px_0px_#000000]"
                    : "bg-[#f8fafc] text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                <span>+ Khoản Thu Vào Quỹ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType("EXPENSE");
                  setCategory("BUY_SHUTTLE");
                }}
                className={`py-3 px-4 rounded-xl text-xs font-black uppercase border border-black flex items-center justify-center gap-2 transition-all ${
                  type === "EXPENSE"
                    ? "bg-[#fb4903] text-white shadow-[3px_3px_0px_#000000]"
                    : "bg-[#f8fafc] text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>- Khoản Chi Ra Khỏi Quỹ</span>
              </button>
            </div>
          </div>

          {/* 2. Danh mục chi tiêu */}
          <div>
            <label className="block text-[11px] font-black uppercase text-black mb-1">
              Danh Mục *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black text-xs font-bold bg-[#f1f3f6] shadow-[2px_2px_0px_#000000] focus:outline-none"
            >
              {type === "INCOME" ? (
                <>
                  <option value="MONTHLY_FUND">Tiền đóng quỹ tháng hội viên</option>
                  <option value="SESSION_SURPLUS">Tiền dư dôi sau buổi đánh (do làm tròn)</option>
                  <option value="SPONSOR">Tiền tài trợ / Thưởng từ thành viên</option>
                  <option value="OTHER">Khoản thu khác</option>
                </>
              ) : (
                <>
                  <option value="BUY_SHUTTLE">Chi mua cầu lông (thùng / ống)</option>
                  <option value="COURT_DEPOSIT">Chi đặt cọc tiền thuê sân tháng</option>
                  <option value="PARTY">Chi liên hoan, nước nôi cả nhóm</option>
                  <option value="EQUIPMENT">Chi mua phụ kiện (lưới, dây quấn, băng keo)</option>
                  <option value="OTHER">Khoản chi khác</option>
                </>
              )}
            </select>
          </div>

          {/* Nhập số ống cầu nếu chi mua cầu */}
          {type === "EXPENSE" && category === "BUY_SHUTTLE" && (
            <div className="bg-[#fff7ed] border border-amber-300 rounded-xl p-3">
              <label className="block text-[11px] font-black uppercase text-amber-950 mb-1">
                Số Ống Cầu Mua (Tự Động Nhập Kho CLB)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={shuttleTubes || ""}
                  onChange={(e) => setShuttleTubes(parseInt(e.target.value, 10) || 0)}
                  placeholder="VD: 5 ống"
                  className="w-36 px-3 py-2 rounded-lg border border-black bg-white text-xs font-bold focus:outline-none"
                />
                <span className="text-xs font-bold text-amber-900">
                  = {shuttleTubes * 12} quả cầu nhập kho
                </span>
              </div>
            </div>
          )}

          {/* 3. Số tiền (VND) */}
          <div>
            <label className="block text-[11px] font-black uppercase text-black mb-1">
              Số Tiền (VND) *
            </label>
            <div className="relative">
              <input
                type="number"
                required
                step={1000}
                value={amount || ""}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                placeholder="VD: 500000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black text-base font-black bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-black text-zinc-500">
                đ
              </span>
            </div>
            {amount > 0 && (
              <span className="text-xs font-bold text-[#5c4ade] block mt-1">
                = {formatVND(amount)}
              </span>
            )}
          </div>

          {/* 4. Thành viên liên quan (Tùy chọn) */}
          <div>
            <label className="block text-[11px] font-black uppercase text-black mb-1">
              Thành Viên Liên Quan (Tùy chọn)
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black text-xs font-bold bg-[#f1f3f6] shadow-[2px_2px_0px_#000000] focus:outline-none"
            >
              <option value="">-- Không chọn (Quỹ chung cả nhóm) --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName} ({m.membershipType === "FULL_MONTHLY" ? "Gói Trọn Gói" : "Theo Buổi"})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Ghi chú / Diễn giải */}
          <div>
            <label className="block text-[11px] font-black uppercase text-black mb-1">
              Nội Dung / Diễn Giải
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Mua 1 thùng cầu Victor Gold 10 ống..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-black text-xs font-medium bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
            />
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-black/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 border border-black"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase border border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 ${
                type === "INCOME"
                  ? "bg-[#55db9c] text-black hover:bg-[#42c586]"
                  : "bg-[#fb4903] text-white hover:bg-[#ea4302]"
              }`}
            >
              <span>{loading ? "Đang Lưu..." : "Xác Nhận Lưu Sổ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
