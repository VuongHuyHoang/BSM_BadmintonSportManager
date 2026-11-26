"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { editSession, deleteSession } from "@/server/actions/session";
import { Settings, Trash2, Edit3, X, AlertTriangle } from "lucide-react";

interface ManageSessionDialogProps {
  sessionId: string;
  clubId: string;
  initialCourtName: string;
  initialStartTime: string; // ISO string
  initialDurationHours: number;
  initialCourtFee: number;
  initialOtherFee: number;
  sessionStatus: string;
}

export function ManageSessionDialog({
  sessionId,
  clubId,
  initialCourtName,
  initialStartTime,
  initialDurationHours,
  initialCourtFee,
  initialOtherFee,
  sessionStatus,
}: ManageSessionDialogProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [courtName, setCourtName] = useState(initialCourtName);
  // Convert ISO string to format YYYY-MM-DDTHH:mm for datetime-local
  const defaultStartTimeFormatted = (() => {
    try {
      const d = new Date(initialStartTime);
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  })();
  const [startTime, setStartTime] = useState(defaultStartTimeFormatted);
  const [durationHours, setDurationHours] = useState(initialDurationHours.toString());
  const [courtFee, setCourtFee] = useState(initialCourtFee.toString());
  const [otherFee, setOtherFee] = useState(initialOtherFee.toString());

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("courtName", courtName);
    formData.append("startTime", startTime);
    formData.append("durationHours", durationHours);
    formData.append("courtFee", courtFee);
    formData.append("otherFee", otherFee);

    const res = await editSession(sessionId, formData);
    setLoading(false);
    if (res.success) {
      setShowEditModal(false);
    } else {
      alert(res.error || "Lỗi khi lưu thay đổi buổi đánh.");
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteSession(sessionId);
    setLoading(false);
    if (res.success) {
      setShowDeleteModal(false);
      router.push(`/clubs/${clubId}`);
    } else {
      alert(res.error || "Không thể xóa buổi đánh.");
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEditModal(true)}
          className="min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-black uppercase bg-[#ffffff] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#f1f3f6] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5"
          title="Sửa thông tin buổi đánh"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Sửa</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="min-h-[36px] px-3 py-1.5 rounded-full text-xs font-black uppercase bg-[#ffd7d7] text-[#e11d48] border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#fecdd3] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1"
          title="Xóa buổi đánh"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Xóa</span>
        </button>
      </div>

      {/* Modal Sửa Buổi Đánh */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-2 border-black rounded-[24px] p-6 max-w-md w-full shadow-[8px_8px_0px_#000000] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-black" />
                <h3 className="text-lg font-black uppercase text-black">
                  Chỉnh Sửa Buổi Đánh
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full hover:bg-zinc-100 border border-transparent hover:border-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4 text-xs font-bold text-black">
              <div>
                <label className="block uppercase text-[10px] font-black text-zinc-600 mb-1">
                  Tên Sân / Vị Trí *
                </label>
                <input
                  type="text"
                  required
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-black bg-[#f8fafc] text-sm focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[10px] font-black text-zinc-600 mb-1">
                    Bắt Đầu *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black bg-[#f8fafc] text-xs focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[10px] font-black text-zinc-600 mb-1">
                    Số Giờ Đánh *
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black bg-[#f8fafc] text-xs focus:outline-none shadow-[2px_2px_0px_#000000]"
                  >
                    <option value="1">1.0 giờ</option>
                    <option value="1.5">1.5 giờ</option>
                    <option value="2">2.0 giờ</option>
                    <option value="2.5">2.5 giờ</option>
                    <option value="3">3.0 giờ</option>
                    <option value="3.5">3.5 giờ</option>
                    <option value="4">4.0 giờ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[10px] font-black text-zinc-600 mb-1">
                    Tiền Sân (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={courtFee}
                    onChange={(e) => setCourtFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black bg-[#f8fafc] text-xs focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                </div>

                <div>
                  <label className="block uppercase text-[10px] font-black text-zinc-600 mb-1">
                    Phụ Phí Chung (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={otherFee}
                    onChange={(e) => setOtherFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black bg-[#f8fafc] text-xs focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-black/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-full border border-black text-xs font-black uppercase hover:bg-zinc-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-full border border-black text-xs font-black uppercase bg-[#55db9c] text-black shadow-[3px_3px_0px_#000000] hover:bg-[#42c586] transition-all"
                >
                  {loading ? "Đang Lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Buổi Đánh */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-2 border-black rounded-[24px] p-6 max-w-sm w-full shadow-[8px_8px_0px_#000000] space-y-4">
            <div className="flex items-center gap-3 text-[#e11d48]">
              <div className="w-10 h-10 rounded-xl bg-[#ffd7d7] border border-black flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#e11d48]" />
              </div>
              <h3 className="text-base font-black uppercase text-black leading-tight">
                Xóa Buổi Đánh Này?
              </h3>
            </div>

            <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
              Thao tác này sẽ xóa toàn bộ dữ liệu điểm danh, số cầu và phụ phí của buổi đánh <strong>{courtName}</strong>.
              {sessionStatus === "COMPLETED" && (
                <span className="block mt-1 text-[#e11d48] font-bold">
                  Lưu ý: Nếu đã có thành viên thanh toán tiền, hệ thống sẽ ngăn chặn việc xóa để đảm bảo an toàn quỹ.
                </span>
              )}
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-full border border-black text-xs font-black uppercase hover:bg-zinc-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="px-5 py-2 rounded-full border border-black text-xs font-black uppercase bg-[#e11d48] text-white shadow-[3px_3px_0px_#000000] hover:bg-[#be123c] transition-all"
              >
                {loading ? "Đang Xóa..." : "Đồng Ý Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
