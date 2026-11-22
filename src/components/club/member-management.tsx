"use client";

import { useState } from "react";
import { formatVND } from "@/lib/utils";
import { updateMemberPackage, updateMemberRole, removeMember, addGuestMember } from "@/server/actions/member";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Check, 
  MoreVertical,
  Plus,
  Phone,
  Tag
} from "lucide-react";

interface MemberItem {
  id: string;
  displayName: string;
  phone: string | null;
  role: string;
  membershipType: string;
  monthlyFeeAmount: number | null;
  userId: string | null;
  joinedAt: Date;
}

interface MemberManagementProps {
  clubId: string;
  members: MemberItem[];
  currentUserRole: string | null;
}

export function MemberManagement({
  clubId,
  members,
  currentUserRole,
}: MemberManagementProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const isLeader = currentUserRole === "ADMIN" || currentUserRole === "TREASURER";
  const isAdmin = currentUserRole === "ADMIN";

  const filteredMembers = members.filter((m) => {
    if (filter === "ALL") return true;
    return m.membershipType === filter;
  });

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("displayName", guestName);
    formData.append("phone", guestPhone);

    const res = await addGuestMember(clubId, formData);
    setLoading(false);
    if (res.success) {
      setGuestName("");
      setGuestPhone("");
      setShowAddGuest(false);
    } else {
      alert(res.error || "Lỗi thêm khách vãng lai.");
    }
  };

  const handlePackageChange = async (memberId: string, newType: string) => {
    const res = await updateMemberPackage(memberId, newType);
    if (!res.success) {
      alert(res.error);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const res = await updateMemberRole(memberId, newRole);
    if (!res.success) {
      alert(res.error);
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa hội viên "${name}" khỏi CLB?`)) {
      const res = await removeMember(memberId);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "ALL"
                ? "bg-black text-white shadow-[2px_2px_0px_#55db9c]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Tất Cả ({members.length})
          </button>
          <button
            onClick={() => setFilter("FULL_MONTHLY")}
            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "FULL_MONTHLY"
                ? "bg-[#e9ccff] text-black shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Trọn Gói
          </button>
          <button
            onClick={() => setFilter("COURT_ONLY_MONTHLY")}
            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "COURT_ONLY_MONTHLY"
                ? "bg-[#4da2ff] text-white shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Chỉ Tiền Sân
          </button>
          <button
            onClick={() => setFilter("PAY_PER_SESSION")}
            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "PAY_PER_SESSION"
                ? "bg-[#ffd731] text-black shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Theo Buổi
          </button>
          <button
            onClick={() => setFilter("GUEST")}
            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "GUEST"
                ? "bg-[#fb4903] text-white shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Khách Vãng Lai
          </button>
        </div>

        {isLeader && (
          <button
            onClick={() => setShowAddGuest(!showAddGuest)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase bg-[#55db9c] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#43c588] transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm Khách Vãng Lai</span>
          </button>
        )}
      </div>

      {/* Quick Add Guest Form Box (Toggle) */}
      {showAddGuest && isLeader && (
        <form
          onSubmit={handleAddGuest}
          className="bg-[#f1f3f6] border border-black rounded-[20px] p-4 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row gap-2.5 items-end"
        >
          <div className="w-full sm:flex-1">
            <label className="block text-[11px] font-black uppercase text-zinc-700 mb-1">
              Tên Khách Vãng Lai *
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="VD: Anh Nam bạn Tuấn"
              className="w-full px-3 py-2 rounded-xl border border-black text-sm bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-[11px] font-black uppercase text-zinc-700 mb-1">
              Số Điện Thoại (Tùy chọn)
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
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 transition-colors"
          >
            {loading ? "Đang Lưu..." : "Lưu Khách"}
          </button>
        </form>
      )}

      {/* Members List Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredMembers.map((m) => {
          return (
            <div
              key={m.id}
              className="bg-white border border-black rounded-[20px] p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-full bg-[#f1f3f6] border border-black flex items-center justify-center font-black text-sm shadow-[1px_1px_0px_#000000] shrink-0">
                      {m.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-black leading-tight break-words" title={m.displayName}>
                        {m.displayName}
                      </h4>
                      {m.phone && (
                        <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span className="truncate">{m.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Badge - Cố định không bao giờ bị rớt dòng */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border border-black uppercase shrink-0 whitespace-nowrap shadow-[1px_1px_0px_#000000] ${
                      m.role === "ADMIN"
                        ? "bg-[#ffd731] text-black"
                        : m.role === "TREASURER"
                        ? "bg-[#55db9c] text-black"
                        : "bg-white text-zinc-600"
                    }`}
                  >
                    {m.role === "ADMIN" ? "Trưởng Nhóm" : m.role === "TREASURER" ? "Thủ Quỹ" : "Thành Viên"}
                  </span>
                </div>

                {/* Membership Package Tag */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-black border border-black shrink-0 whitespace-nowrap ${
                      m.membershipType === "FULL_MONTHLY"
                        ? "bg-[#e9ccff] text-black"
                        : m.membershipType === "COURT_ONLY_MONTHLY"
                        ? "bg-[#4da2ff] text-white"
                        : m.membershipType === "GUEST"
                        ? "bg-[#fb4903] text-white"
                        : "bg-[#ffd731] text-black"
                    }`}
                  >
                    {m.membershipType === "FULL_MONTHLY"
                      ? "Gói Trọn Gói"
                      : m.membershipType === "COURT_ONLY_MONTHLY"
                      ? "Gói Chỉ Sân"
                      : m.membershipType === "GUEST"
                      ? "Khách Vãng Lai"
                      : "Đóng Theo Buổi"}
                  </span>

                  {m.monthlyFeeAmount && (
                    <span className="text-xs font-bold text-zinc-600">
                      {formatVND(m.monthlyFeeAmount)}/tháng
                    </span>
                  )}
                </div>
              </div>

              {/* Management Controls for Leaders */}
              {isLeader && (
                <div className="mt-4 pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Đổi gói:</span>
                    <select
                      value={m.membershipType}
                      onChange={(e) => handlePackageChange(m.id, e.target.value)}
                      className="px-2 py-1 rounded-lg border border-black text-xs font-bold bg-[#f1f3f6] focus:outline-none"
                    >
                      <option value="FULL_MONTHLY">Trọn Gói</option>
                      <option value="COURT_ONLY_MONTHLY">Chỉ Tiền Sân</option>
                      <option value="PAY_PER_SESSION">Theo Buổi</option>
                      <option value="GUEST">Vãng Lai</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Role changer (Admin only) */}
                    {isAdmin && m.role !== "ADMIN" && (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-black text-[11px] font-bold bg-[#ffd731] focus:outline-none"
                      >
                        <option value="MEMBER">Hội Viên</option>
                        <option value="TREASURER">Thủ Quỹ</option>
                      </select>
                    )}

                    {/* Delete member (not Admin) */}
                    {isAdmin && m.role !== "ADMIN" && (
                      <button
                        onClick={() => handleRemove(m.id, m.displayName)}
                        title="Xóa khỏi CLB"
                        className="p-1.5 text-zinc-400 hover:text-[#fb4903] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
