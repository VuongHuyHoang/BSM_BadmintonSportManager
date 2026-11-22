"use client";

import { useState } from "react";
import { updateClubSettings } from "@/server/actions/club";
import { formatVND } from "@/lib/utils";
import { 
  X, 
  Settings, 
  QrCode, 
  Building2, 
  DollarSign, 
  Check, 
  AlertCircle 
} from "lucide-react";

export const VN_BANKS = [
  { code: "970422", name: "MBBank (Quân Đội)" },
  { code: "970436", name: "Vietcombank" },
  { code: "970407", name: "Techcombank" },
  { code: "970415", name: "VietinBank" },
  { code: "970418", name: "BIDV" },
  { code: "970416", name: "ACB (Á Châu)" },
  { code: "970432", name: "VPBank" },
  { code: "970423", name: "TPBank" },
  { code: "970441", name: "VIB" },
  { code: "970405", name: "Agribank" },
  { code: "970403", name: "Sacombank" },
];

interface EditClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: {
    id: string;
    name: string;
    bankCode: string | null;
    bankAccountNo: string | null;
    bankAccountName: string | null;
    defaultShuttlePrice: number;
    roundingMode: string;
  };
}

export function EditClubModal({
  isOpen,
  onClose,
  club,
}: EditClubModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(club.name);
  const [bankCode, setBankCode] = useState(club.bankCode || "970422");
  const [bankAccountNo, setBankAccountNo] = useState(club.bankAccountNo || "");
  const [bankAccountName, setBankAccountName] = useState(club.bankAccountName || "");
  const [defaultShuttlePrice, setDefaultShuttlePrice] = useState(club.defaultShuttlePrice);
  const [roundingMode, setRoundingMode] = useState(club.roundingMode || "CEIL_1K");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("bankCode", bankCode);
    formData.append("bankAccountNo", bankAccountNo);
    formData.append("bankAccountName", bankAccountName);
    formData.append("defaultShuttlePrice", defaultShuttlePrice.toString());
    formData.append("roundingMode", roundingMode);

    const res = await updateClubSettings(club.id, formData);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      alert(res.error || "Lỗi khi cập nhật cài đặt CLB.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-black rounded-[24px] max-w-lg w-full p-6 sm:p-7 shadow-[8px_8px_0px_#000000] max-h-[92vh] flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-black mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#5c4ade] text-white flex items-center justify-center border border-black shadow-[2px_2px_0px_#000000]">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                  Dành Cho Trưởng Nhóm / Thủ Quỹ
                </span>
                <h3 className="text-base sm:text-lg font-black uppercase text-black leading-tight">
                  Chỉnh Sửa Thông Tin & VietQR
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên Câu Lạc Bộ */}
            <div>
              <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                Tên Câu Lạc Bộ / Nhóm Cầu Lông *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5c4ade] shadow-[2px_2px_0px_#000000]"
              />
            </div>

            {/* Thông Tin VietQR Chuyển Khoản */}
            <div className="pt-3 border-t border-black/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-600 block mb-2 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#5c4ade]" />
                Tài Khoản Nhận Chuyển Khoản VietQR (Napas247)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                    Ngân Hàng
                  </label>
                  <select
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black text-xs font-bold bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                  >
                    {VN_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                    Số Tài Khoản (STK) Nhận Tiền
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    placeholder="VD: 0987654321"
                    className="w-full px-3.5 py-2 rounded-xl border border-black text-sm font-mono font-bold bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Tên Chủ Tài Khoản (In hoa không dấu)
                </label>
                <input
                  type="text"
                  required
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  placeholder="VD: NGUYEN VAN THU QUY"
                  className="w-full px-3.5 py-2 rounded-xl border border-black text-sm font-bold uppercase bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>
            </div>

            {/* Cài Đặt Tiền Cầu & Làm Tròn */}
            <div className="pt-3 border-t border-black/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-600 block mb-2">
                Đơn Giá Cầu & Quy Chuẩn Làm Tròn
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                    Giá Cầu Mặc Định (đ / quả) *
                  </label>
                  <input
                    type="number"
                    required
                    step={1000}
                    value={defaultShuttlePrice}
                    onChange={(e) => setDefaultShuttlePrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-black text-sm font-bold bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                  <span className="text-[10px] text-zinc-500 font-medium block mt-0.5">
                    Hiện tại: {formatVND(defaultShuttlePrice)}/quả
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                    Quy Tắc Làm Tròn Tiền
                  </label>
                  <select
                    value={roundingMode}
                    onChange={(e) => setRoundingMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black text-xs font-bold bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                  >
                    <option value="CEIL_1K">Làm tròn lên 1.000đ (Khuyên dùng)</option>
                    <option value="CEIL_5K">Làm tròn lên 5.000đ</option>
                    <option value="EXACT">Giữ nguyên số lẻ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-black flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-black transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-full text-xs font-black uppercase bg-[#55db9c] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#43c487] active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
              >
                {loading ? "Đang Lưu..." : "Lưu Thay Đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
