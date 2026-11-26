"use client";

import { useState, useEffect } from "react";
import { formatVND } from "@/lib/utils";
import { 
  toggleCheckIn, 
  addMemberToSession, 
  addQuickGuestToSession,
  joinSession,
  leaveSession,
} from "@/server/actions/session";
import { 
  ExtraFeeModal, 
  aggregateExtraItems, 
  ExtraItem 
} from "@/components/session/extra-fee-modal";
import { 
  CheckCircle2, 
  Circle, 
  UserPlus, 
  Users, 
  Zap, 
  Sparkles,
  Phone,
  Coffee,
  Tag
} from "lucide-react";

interface AttendeeItem {
  id: string;
  memberId: string;
  isCheckedIn: boolean;
  checkInBy: string;
  attendanceStatus?: string; // CONFIRMED hoặc WAITLIST
  matchesPlayed?: number;
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
    sponsorMemberId?: string | null;
  };
}

interface ClubMemberItem {
  id: string;
  displayName: string;
  membershipType: string;
  userId?: string | null;
}

interface AttendanceBoardProps {
  sessionId: string;
  clubId: string;
  attendees: AttendeeItem[];
  allClubMembers: ClubMemberItem[];
  currentUserId?: string | null;
  isLeader: boolean;
  maxAttendees?: number;
}

export function AttendanceBoard({
  sessionId,
  clubId,
  attendees,
  allClubMembers,
  currentUserId,
  isLeader,
  maxAttendees = 0,
}: AttendanceBoardProps) {
  const [localAttendees, setLocalAttendees] = useState(attendees);
  useEffect(() => {
    setLocalAttendees(attendees);
  }, [attendees]);

  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [leaveLoadingId, setLeaveLoadingId] = useState<string | null>(null);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestSponsorId, setGuestSponsorId] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  // State mở cửa sổ Popup Phụ Phí cho thành viên
  const [selectedModalAttendee, setSelectedModalAttendee] = useState<AttendeeItem | null>(null);

  // Phân chia danh sách chính thức và danh sách chờ (Waitlist)
  const confirmedAttendees = localAttendees.filter(
    (a) => a.attendanceStatus !== "WAITLIST"
  );
  const waitlistAttendees = localAttendees.filter(
    (a) => a.attendanceStatus === "WAITLIST"
  );

  // Tìm xem người đang đăng nhập có trong danh sách buổi đánh này không
  const myAttendance = currentUserId
    ? localAttendees.find((a) => a.member.userId === currentUserId)
    : null;

  // Tìm thông tin hội viên của user trong CLB (dù chưa vào buổi đánh)
  const myClubMembership = currentUserId
    ? allClubMembers.find((m) => m.userId === currentUserId)
    : null;

  const handleSelfJoin = async () => {
    setJoinLoading(true);
    const res = await joinSession(sessionId);
    setJoinLoading(false);
    if (!res.success) {
      alert(res.error || "Lỗi khi đăng ký tham gia buổi đánh.");
    }
  };

  const handleLeave = async (targetMemberId?: string) => {
    const isSelf = !targetMemberId || (myAttendance && targetMemberId === myAttendance.memberId);
    if (!confirm(isSelf ? "Bạn có chắc chắn muốn hủy đăng ký buổi đánh này?" : "Xóa người này khỏi buổi đánh?")) return;

    setLeaveLoadingId(targetMemberId || myAttendance?.memberId || "self");
    const res = await leaveSession(sessionId, targetMemberId);
    setLeaveLoadingId(null);
    if (!res.success) {
      alert(res.error || "Lỗi khi rời buổi đánh.");
    }
  };

  // Lọc ra các hội viên CLB chưa có trong danh sách buổi đánh
  const attendeeMemberIds = new Set(localAttendees.map((a) => a.memberId));
  const availableClubMembers = allClubMembers.filter(
    (m) => !attendeeMemberIds.has(m.id)
  );

  const checkedInCount = localAttendees.filter((a) => a.isCheckedIn).length;

  const handleToggle = async (memberId: string, currentStatus: boolean, isSelf: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic UI: Phản hồi tức thời 0ms trên màn hình
    setLocalAttendees((prev) =>
      prev.map((a) =>
        a.memberId === memberId
          ? { ...a, isCheckedIn: nextStatus, checkInBy: isSelf ? "SELF" : "TREASURER" }
          : a
      )
    );

    setLoadingMemberId(memberId);
    const res = await toggleCheckIn(sessionId, memberId, nextStatus, isSelf ? "SELF" : "TREASURER");
    setLoadingMemberId(null);
    if (!res?.success) {
      // Rollback nếu thất bại
      setLocalAttendees((prev) =>
        prev.map((a) =>
          a.memberId === memberId
            ? { ...a, isCheckedIn: currentStatus }
            : a
        )
      );
      alert(res?.error || "Lỗi cập nhật điểm danh.");
    }
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

    const res = await addQuickGuestToSession(
      sessionId, 
      clubId, 
      guestName, 
      guestPhone, 
      guestSponsorId || undefined
    );
    setGuestLoading(false);
    if (res.success) {
      setGuestName("");
      setGuestPhone("");
      setGuestSponsorId("");
      setShowAddGuest(false);
    } else {
      alert(res.error || "Lỗi thêm khách vãng lai.");
    }
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

        <div className="flex flex-wrap items-center gap-2">
          {maxAttendees > 0 && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-black border border-black shadow-[2px_2px_0px_#000000] ${
              confirmedAttendees.length >= maxAttendees
                ? "bg-[#ffd731] text-black"
                : "bg-white text-black"
            }`}>
              Slot: {confirmedAttendees.length} / {maxAttendees} chỗ
              {waitlistAttendees.length > 0 && ` (${waitlistAttendees.length} dự bị)`}
            </div>
          )}
          <div className="px-3 py-1.5 rounded-full text-xs font-black bg-[#55db9c] text-black border border-black shadow-[2px_2px_0px_#000000]">
            Đã đến: {checkedInCount} / {localAttendees.length} người
          </div>
        </div>
      </div>

      {/* 2. Self Join Banner (Nếu người dùng là thành viên CLB nhưng chưa có trong danh sách buổi đánh) */}
      {myClubMembership && !myAttendance && (
        <div className="bg-[#e9ccff] border border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#ffd731]" />
            </div>
            <div>
              <span className="text-sm font-black uppercase text-black block leading-tight">
                Bạn muốn tham gia buổi đánh này?
              </span>
              <span className="text-xs font-bold text-zinc-800">
                Bấm nút đăng ký để có tên trong danh sách điểm danh và cùng chia tiền sân nhé!
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={joinLoading}
            onClick={handleSelfJoin}
            className="min-h-[44px] px-6 py-2.5 rounded-full text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 text-[#55db9c]" />
            <span>{joinLoading ? "Đang Ghi Nhận..." : "Đăng Ký Tham Gia"}</span>
          </button>
        </div>
      )}

      {/* 2b. Self Check-in Banner (Nếu người dùng đang đăng nhập và chưa check-in) */}
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
          <div className="w-full sm:w-48">
            <label className="block text-[11px] font-black uppercase text-black mb-1">
              Người Bảo Lãnh (Ai dẫn đi?)
            </label>
            <select
              value={guestSponsorId}
              onChange={(e) => setGuestSponsorId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-black text-xs bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
            >
              <option value="">Không có (Khách tự do)</option>
              {allClubMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </select>
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
        {localAttendees.map((a) => {
          const isMe = currentUserId && a.member.userId === currentUserId;
          const aggregated = aggregateExtraItems(a.extraItems || []);
          const totalExtra = aggregated.reduce((acc, curr) => acc + curr.totalPrice, 0);

          return (
            <div
              key={a.id}
              className={`py-3.5 px-3.5 rounded-2xl flex items-start justify-between gap-3 transition-colors ${
                a.isCheckedIn ? "bg-[#f0fdf4]" : "hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Check-in toggle indicator / button */}
                {isLeader ? (
                  <button
                    type="button"
                    disabled={loadingMemberId === a.memberId}
                    onClick={() => handleToggle(a.memberId, a.isCheckedIn, false)}
                    className="p-1 rounded-lg focus:outline-none hover:scale-110 transition-transform shrink-0 mt-0.5"
                    title={a.isCheckedIn ? "Bấm để đánh dấu Vắng" : "Bấm để điểm danh Có mặt"}
                  >
                    {a.isCheckedIn ? (
                      <CheckCircle2 className="w-6 h-6 text-[#16a34a] fill-[#55db9c]" />
                    ) : (
                      <Circle className="w-6 h-6 text-zinc-400 hover:text-black" />
                    )}
                  </button>
                ) : (
                  <div className="shrink-0 mt-0.5">
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
                    {a.attendanceStatus === "WAITLIST" && (
                      <span className="px-2 py-0.2 rounded text-[10px] font-black bg-[#ffd731] text-black border border-black shrink-0 whitespace-nowrap">
                        ⏳ Danh Sách Chờ (Dự Bị)
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

                  {/* Danh sách các sản phẩm phụ phí riêng đã gộp 1 dòng và x số lượng */}
                  {aggregated.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {aggregated.map((item) => (
                        <span
                          key={item.displayName.toLowerCase()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#fff7ed] text-amber-950 border border-amber-300 shadow-[1px_1px_0px_#f59e0b]"
                        >
                          {item.quantity}x {item.displayName}: {formatVND(item.totalPrice)}
                        </span>
                      ))}
                      <span className="text-[10px] font-black text-[#fb4903]">
                        (+{formatVND(totalExtra)} phụ phí)
                      </span>
                    </div>
                  )}

                  {/* Nút Phụ Phí hiển thị ở mỗi thành viên để mở Box Cửa Sổ */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedModalAttendee(a)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase border border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] transition-all ${
                        totalExtra > 0
                          ? "bg-[#ffd731] text-black hover:bg-[#f5cd1a]"
                          : "bg-[#f1f3f6] text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      <Coffee className="w-3.5 h-3.5 text-black" />
                      <span>
                        Phụ Phí {totalExtra > 0 ? `(${formatVND(totalExtra)})` : ""}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border border-black shadow-[1px_1px_0px_#000000] inline-block shrink-0 whitespace-nowrap ${
                    a.attendanceStatus === "WAITLIST"
                      ? "bg-[#ffd731] text-black"
                      : a.isCheckedIn
                      ? "bg-[#55db9c] text-black"
                      : "bg-[#f1f3f6] text-zinc-500"
                  }`}
                >
                  {a.attendanceStatus === "WAITLIST"
                    ? "Chờ Slot"
                    : a.isCheckedIn
                    ? "Đã Đến Sân"
                    : "Chưa Đến"}
                </span>
                {a.isCheckedIn && a.checkInBy === "SELF" && (
                  <span className="text-[9px] text-zinc-500 font-bold block">
                    Tự check-in
                  </span>
                )}

                {/* Nút hủy đăng ký hoặc Leader xóa người */}
                {(isMe || isLeader) && a.paymentStatus !== "PAID" && (
                  <button
                    type="button"
                    disabled={leaveLoadingId === a.memberId}
                    onClick={() => handleLeave(a.memberId)}
                    className="text-[10px] font-bold text-zinc-400 hover:text-[#e11d48] transition-colors mt-0.5"
                    title={isMe ? "Hủy đăng ký buổi này" : "Xóa khỏi buổi đánh"}
                  >
                    {isMe ? "Rút lui" : "Bỏ ra"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cửa sổ Popup Box Phụ Phí cho thành viên được chọn */}
      {selectedModalAttendee && (
        <ExtraFeeModal
          isOpen={!!selectedModalAttendee}
          onClose={() => setSelectedModalAttendee(null)}
          attendanceId={selectedModalAttendee.id}
          displayName={selectedModalAttendee.member.displayName}
          extraItems={
            localAttendees.find((x) => x.id === selectedModalAttendee.id)?.extraItems || []
          }
          isLeader={isLeader}
        />
      )}
    </div>
  );
}
