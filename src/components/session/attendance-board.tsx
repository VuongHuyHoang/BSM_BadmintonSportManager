"use client";

import { useState } from "react";
import { formatVND } from "@/lib/utils";
import { 
  toggleCheckIn, 
  addMemberToSession, 
  addQuickGuestToSession,
  addExtraItemToAttendance,
  removeExtraItemFromAttendance
} from "@/server/actions/session";
import { 
  CheckCircle2, 
  Circle, 
  UserPlus, 
  Users, 
  Zap, 
  Sparkles,
  Phone,
  Plus,
  Coffee,
  X,
  ShoppingBag
} from "lucide-react";

interface ExtraItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface AttendeeItem {
  id: string;
  memberId: string;
  isCheckedIn: boolean;
  checkInBy: string;
  paymentStatus: string;
  extraFeeShare: number;
  extraItems?: ExtraItem[];
  member: {
    id: string;
    displayName: string;
    phone: string | null;
    role: string;
    membershipType: string;
    userId: string | null;
  };
}

interface ClubMemberItem {
  id: string;
  displayName: string;
  membershipType: string;
}

interface AttendanceBoardProps {
  sessionId: string;
  clubId: string;
  attendees: AttendeeItem[];
  allClubMembers: ClubMemberItem[];
  currentUserId?: string | null;
  isLeader: boolean;
}

export function AttendanceBoard({
  sessionId,
  clubId,
  attendees,
  allClubMembers,
  currentUserId,
  isLeader,
}: AttendanceBoardProps) {
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  // State cho phụ phí / tiền nước riêng từng người
  const [activeExtraAttendeeId, setActiveExtraAttendeeId] = useState<string | null>(null);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState<number>(15000);
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [extraLoading, setExtraLoading] = useState(false);

  // Tìm xem người đang đăng nhập có trong danh sách buổi đánh này không
  const myAttendance = currentUserId
    ? attendees.find((a) => a.member.userId === currentUserId)
    : null;

  // Lọc ra các hội viên CLB chưa có trong danh sách buổi đánh
  const attendeeMemberIds = new Set(attendees.map((a) => a.memberId));
  const availableClubMembers = allClubMembers.filter(
    (m) => !attendeeMemberIds.has(m.id)
  );

  const checkedInCount = attendees.filter((a) => a.isCheckedIn).length;

  const handleToggle = async (memberId: string, currentStatus: boolean, isSelf: boolean) => {
    setLoadingMemberId(memberId);
    await toggleCheckIn(sessionId, memberId, !currentStatus, isSelf ? "SELF" : "TREASURER");
    setLoadingMemberId(null);
  };

  const handleAddMember = async (memberId: string) => {
    if (!memberId) return;
    setLoadingMemberId(memberId);
    await addMemberToSession(sessionId, memberId);
    setLoadingMemberId(null);
  };

  const handleAddQuickGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setGuestLoading(true);

    const res = await addQuickGuestToSession(sessionId, clubId, guestName, guestPhone);
    setGuestLoading(false);
    if (res.success) {
      setGuestName("");
      setGuestPhone("");
      setShowAddGuest(false);
    } else {
      alert(res.error || "Lỗi thêm khách vãng lai.");
    }
  };

  // Thêm phụ phí riêng nhanh từ preset
  const handleAddPresetExtra = async (attendanceId: string, name: string, price: number) => {
    setExtraLoading(true);
    await addExtraItemToAttendance(attendanceId, name, 1, price);
    setExtraLoading(false);
  };

  // Thêm phụ phí riêng tuỳ chỉnh
  const handleAddCustomExtra = async (e: React.FormEvent, attendanceId: string) => {
    e.preventDefault();
    if (!customItemName.trim()) return;
    setExtraLoading(true);
    await addExtraItemToAttendance(attendanceId, customItemName, customItemQty, customItemPrice);
    setExtraLoading(false);
    setCustomItemName("");
    setCustomItemQty(1);
    setActiveExtraAttendeeId(null);
  };

  // Xoá phụ phí riêng
  const handleRemoveExtraItem = async (itemId: string) => {
    setExtraLoading(true);
    await removeExtraItemFromAttendance(itemId);
    setExtraLoading(false);
  };

  return (
    <div className="bg-white border border-black rounded-[24px] p-5 sm:p-7 shadow-[6px_6px_0px_#000000] space-y-6">
      {/* 1. Header & Progress Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-0.5">
            Điểm Danh 2 Chiều
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-black leading-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-black" />
            <span>Người Tham Gia Thực Tế</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full text-xs font-black bg-[#55db9c] text-black border border-black shadow-[2px_2px_0px_#000000]">
            Đã đến: {checkedInCount} / {attendees.length} người
          </div>
        </div>
      </div>

      {/* 2. Self Check-in Banner (Nếu người dùng đang đăng nhập và chưa check-in) */}
      {myAttendance && !myAttendance.isCheckedIn && (
        <div className="bg-[#ffd731] border border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-[#ffd731] text-[#ffd731]" />
            </div>
            <div>
              <span className="text-sm font-black uppercase text-black block leading-tight">
                Bạn đã đến sân cầu lông chưa?
              </span>
              <span className="text-xs font-bold text-zinc-800">
                Bấm nút bên cạnh để tự điểm danh có mặt trong buổi đánh này!
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={loadingMemberId === myAttendance.memberId}
            onClick={() => handleToggle(myAttendance.memberId, false, true)}
            className="min-h-[44px] px-6 py-2.5 rounded-full text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCircle2 className="w-4 h-4 text-[#55db9c]" />
            <span>Tôi Đã Đến Sân</span>
          </button>
        </div>
      )}

      {/* 3. Action Row for Leaders: Add Existing Member / Add Guest */}
      {isLeader && (
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown thêm hội viên CLB chưa vào buổi */}
          {availableClubMembers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddMember(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="px-3 py-2 rounded-xl border border-black text-xs font-bold bg-[#f1f3f6] shadow-[2px_2px_0px_#000000] focus:outline-none"
              >
                <option value="" disabled>
                  + Thêm Hội Viên CLB Vào Buổi...
                </option>
                {availableClubMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.membershipType === "FULL_MONTHLY" ? "Trọn Gói" : "Theo Buổi"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nút thêm nhanh khách vãng lai */}
          <button
            type="button"
            onClick={() => setShowAddGuest(!showAddGuest)}
            className="px-3.5 py-2 rounded-full text-xs font-black uppercase bg-[#e9ccff] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#d8b5ff] transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Khách Vãng Lai Mới</span>
          </button>
        </div>
      )}

      {/* 4. Form thêm nhanh khách vãng lai tại sân */}
      {showAddGuest && isLeader && (
        <form
          onSubmit={handleAddQuickGuest}
          className="bg-[#dceeff] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000] flex flex-col sm:flex-row gap-2.5 items-end"
        >
          <div className="w-full sm:flex-1">
            <label className="block text-[11px] font-black uppercase text-black mb-1">
              Tên Khách Vãng Lai *
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="VD: Anh Hải bạn Tuấn"
              className="w-full px-3 py-2 rounded-xl border border-black text-sm bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
            />
          </div>
          <div className="w-full sm:w-44">
            <label className="block text-[11px] font-black uppercase text-black mb-1">
              SĐT (Tùy chọn)
            </label>
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="09..."
              className="w-full px-3 py-2 rounded-xl border border-black text-sm bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
            />
          </div>
          <button
            type="submit"
            disabled={guestLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 transition-colors"
          >
            {guestLoading ? "Đang Lưu..." : "Thêm Ngay"}
          </button>
        </form>
      )}

      {/* 5. Attendees List */}
      <div className="divide-y divide-black/10">
        {attendees.map((a) => {
          const isMe = currentUserId && a.member.userId === currentUserId;
          return (
            <div
              key={a.id}
              className={`py-3 px-3.5 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                a.isCheckedIn ? "bg-[#f0fdf4]" : "hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Check-in toggle indicator / button */}
                {isLeader ? (
                  <button
                    type="button"
                    disabled={loadingMemberId === a.memberId}
                    onClick={() => handleToggle(a.memberId, a.isCheckedIn, false)}
                    className="p-1 rounded-lg focus:outline-none hover:scale-110 transition-transform shrink-0"
                    title={a.isCheckedIn ? "Bấm để đánh dấu Vắng" : "Bấm để điểm danh Có mặt"}
                  >
                    {a.isCheckedIn ? (
                      <CheckCircle2 className="w-6 h-6 text-[#16a34a] fill-[#55db9c]" />
                    ) : (
                      <Circle className="w-6 h-6 text-zinc-400 hover:text-black" />
                    )}
                  </button>
                ) : (
                  <div className="shrink-0">
                    {a.isCheckedIn ? (
                      <CheckCircle2 className="w-6 h-6 text-[#16a34a] fill-[#55db9c]" />
                    ) : (
                      <Circle className="w-6 h-6 text-zinc-300" />
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-black break-words">
                      {a.member.displayName}
                    </span>
                    {isMe && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#ffd731] border border-black shrink-0 whitespace-nowrap">
                        Bạn
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border border-black/30 shrink-0 whitespace-nowrap ${
                        a.member.membershipType === "FULL_MONTHLY"
                          ? "bg-[#e9ccff] text-black"
                          : a.member.membershipType === "COURT_ONLY_MONTHLY"
                          ? "bg-[#4da2ff] text-white"
                          : a.member.membershipType === "GUEST"
                          ? "bg-[#fb4903] text-white"
                          : "bg-[#ffd731] text-black"
                      }`}
                    >
                      {a.member.membershipType === "FULL_MONTHLY"
                        ? "Trọn Gói"
                        : a.member.membershipType === "COURT_ONLY_MONTHLY"
                        ? "Chỉ Sân"
                        : a.member.membershipType === "GUEST"
                        ? "Vãng Lai"
                        : "Theo Buổi"}
                    </span>

                    {a.member.phone && (
                      <span className="text-[10px] text-zinc-500 font-medium truncate">
                        {a.member.phone}
                      </span>
                    )}
                  </div>

                  {/* Danh sách các sản phẩm phụ phí riêng (nước, quấn cán, tất...) */}
                  {a.extraItems && a.extraItems.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {a.extraItems.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#fff7ed] text-amber-950 border border-amber-300 shadow-[1px_1px_0px_#f59e0b]"
                        >
                          <span>
                            {item.quantity > 1 ? `${item.quantity}x ` : ""}
                            {item.itemName}: {formatVND(item.totalPrice)}
                          </span>
                          {isLeader && (
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraItem(item.id)}
                              className="text-amber-700 hover:text-red-600 ml-0.5"
                              title="Xóa món này"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                      <span className="text-[10px] font-black text-amber-700">
                        (+{formatVND(a.extraItems.reduce((acc, curr) => acc + curr.totalPrice, 0))} riêng)
                      </span>
                    </div>
                  )}

                  {/* Leader Action: Thêm nước / phụ phí riêng cho hội viên này */}
                  {isLeader && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveExtraAttendeeId(
                            activeExtraAttendeeId === a.id ? null : a.id
                          )
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-800 bg-[#fffbeb] hover:bg-[#fef3c7] px-2 py-1 rounded-md border border-amber-400 transition-colors"
                      >
                        <Coffee className="w-3 h-3" />
                        <span>+ Thêm Nước / Phụ Phí Riêng</span>
                      </button>

                      {/* Box Chọn Nhanh Nước / Phụ Phí */}
                      {activeExtraAttendeeId === a.id && (
                        <div className="mt-2 p-3 rounded-xl bg-white border border-black shadow-[3px_3px_0px_#000000] space-y-2.5">
                          <span className="text-[10px] font-black uppercase text-zinc-600 block">
                            Chọn Nhanh Món Nước / Phụ Kiện:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { name: "Nước Revive", price: 15000, label: "💧 Revive 15k" },
                              { name: "Nước suối", price: 10000, label: "💧 Nước suối 10k" },
                              { name: "Bò húc", price: 18000, label: "⚡ Bò húc 18k" },
                              { name: "Quấn cán vợt", price: 25000, label: "🏸 Quấn cán 25k" },
                              { name: "Tất cầu lông", price: 30000, label: "🧦 Tất/vớ 30k" },
                            ].map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                disabled={extraLoading}
                                onClick={() =>
                                  handleAddPresetExtra(a.id, preset.name, preset.price)
                                }
                                className="px-2 py-1 rounded-lg text-[10px] font-black bg-[#f1f3f6] hover:bg-[#e2e8f0] border border-black transition-colors"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          {/* Custom form */}
                          <form
                            onSubmit={(e) => handleAddCustomExtra(e, a.id)}
                            className="pt-2 border-t border-black/10 flex flex-wrap gap-2 items-end"
                          >
                            <div className="flex-1 min-w-[130px]">
                              <label className="block text-[9px] font-black uppercase text-zinc-600 mb-0.5">
                                Món Khác:
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="VD: Trà đào, Sting..."
                                value={customItemName}
                                onChange={(e) => setCustomItemName(e.target.value)}
                                className="w-full px-2 py-1 rounded-lg border border-black text-xs font-bold bg-[#f8fafc] focus:outline-none"
                              />
                            </div>
                            <div className="w-20">
                              <label className="block text-[9px] font-black uppercase text-zinc-600 mb-0.5">
                                Giá (VND):
                              </label>
                              <input
                                type="number"
                                step={1000}
                                required
                                value={customItemPrice}
                                onChange={(e) =>
                                  setCustomItemPrice(parseInt(e.target.value) || 0)
                                }
                                className="w-full px-2 py-1 rounded-lg border border-black text-xs font-bold bg-[#f8fafc] focus:outline-none"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={extraLoading}
                              className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-black text-white border border-black shadow-[1px_1px_0px_#55db9c]"
                            >
                              Thêm
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveExtraAttendeeId(null)}
                              className="px-2 py-1 rounded-lg text-xs font-bold text-zinc-500 hover:text-black"
                            >
                              Đóng
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-right shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border border-black shadow-[1px_1px_0px_#000000] inline-block shrink-0 whitespace-nowrap ${
                    a.isCheckedIn
                      ? "bg-[#55db9c] text-black"
                      : "bg-[#f1f3f6] text-zinc-500"
                  }`}
                >
                  {a.isCheckedIn ? "Đã Đến Sân" : "Chưa Đến"}
                </span>
                {a.isCheckedIn && a.checkInBy === "SELF" && (
                  <span className="text-[9px] text-zinc-500 font-bold block mt-0.5">
                    Tự check-in
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
