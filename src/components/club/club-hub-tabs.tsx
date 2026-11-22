"use client";

import { useState } from "react";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import { TreasuryView } from "@/components/club/treasury-view";
import { DebtTrackerView } from "@/components/club/debt-tracker-view";
import { MemberManagement } from "@/components/club/member-management";
import { 
  Calendar, 
  Wallet, 
  AlertCircle, 
  Users, 
  PlusCircle, 
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2
} from "lucide-react";

interface SessionItem {
  id: string;
  courtName: string;
  startTime: Date;
  courtFee: number;
  status: string;
  attendances: {
    id: string;
    isCheckedIn: boolean;
  }[];
  shuttleLogs: {
    quantity: number;
  }[];
}

interface ClubMember {
  id: string;
  displayName: string;
  phone: string | null;
  role: string;
  membershipType: string;
  monthlyFeeAmount: number | null;
  userId: string | null;
  joinedAt: Date;
}

interface TransactionItem {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  createdAt: Date;
  member?: {
    id: string;
    displayName: string;
  } | null;
}

interface UnpaidItem {
  id: string;
  totalAmount: number;
  session: {
    id: string;
    courtName: string;
    startTime: Date;
  };
  member: {
    id: string;
    displayName: string;
    phone: string | null;
    membershipType: string;
  };
}

interface ClubHubTabsProps {
  club: {
    id: string;
    name: string;
    bankCode: string | null;
    bankAccountNo: string | null;
    bankAccountName: string | null;
    members: ClubMember[];
    sessions: SessionItem[];
  };
  transactions: TransactionItem[];
  unpaidAttendances: UnpaidItem[];
  isLeader: boolean;
  currentUserRole: string | null;
}

export function ClubHubTabs({
  club,
  transactions,
  unpaidAttendances,
  isLeader,
  currentUserRole,
}: ClubHubTabsProps) {
  const [activeTab, setActiveTab] = useState<"SESSIONS" | "TREASURY" | "DEBTS" | "MEMBERS">("SESSIONS");

  const formatSessionTime = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const totalClubDebt = unpaidAttendances.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Tab Navigation Buttons Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("SESSIONS")}
          className={`px-4 py-2.5 rounded-full text-xs font-black uppercase border border-black flex items-center gap-1.5 transition-all ${
            activeTab === "SESSIONS"
              ? "bg-[#ffd731] text-black shadow-[3px_3px_0px_#000000]"
              : "bg-white text-black hover:bg-zinc-100"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Buổi Đánh ({club.sessions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TREASURY")}
          className={`px-4 py-2.5 rounded-full text-xs font-black uppercase border border-black flex items-center gap-1.5 transition-all ${
            activeTab === "TREASURY"
              ? "bg-[#55db9c] text-black shadow-[3px_3px_0px_#000000]"
              : "bg-white text-black hover:bg-zinc-100"
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Sổ Quỹ CLB</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DEBTS")}
          className={`px-4 py-2.5 rounded-full text-xs font-black uppercase border border-black flex items-center gap-1.5 transition-all ${
            activeTab === "DEBTS"
              ? "bg-[#fb4903] text-white shadow-[3px_3px_0px_#000000]"
              : "bg-white text-black hover:bg-zinc-100"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>
            Bảng Nhắc Nợ {unpaidAttendances.length > 0 ? `(${unpaidAttendances.length})` : ""}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MEMBERS")}
          className={`px-4 py-2.5 rounded-full text-xs font-black uppercase border border-black flex items-center gap-1.5 transition-all ${
            activeTab === "MEMBERS"
              ? "bg-[#e9ccff] text-black shadow-[3px_3px_0px_#000000]"
              : "bg-white text-black hover:bg-zinc-100"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Hội Viên ({club.members.length})</span>
        </button>
      </div>

      {/* TAB 1: SESSIONS (Lịch Hoạt Động & Điểm Danh) */}
      {activeTab === "SESSIONS" && (
        <section className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000]">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black pb-4">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#ffd731] text-black border border-black uppercase mb-1 shadow-[1px_1px_0px_#000000]">
                Sân & Điểm Danh
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                Lịch Hoạt Động Buổi Đánh ({club.sessions.length})
              </h2>
              <p className="text-xs text-zinc-600 font-medium">
                Vào trực tiếp từng buổi để theo dõi điểm danh 2 chiều và đếm quả cầu live
              </p>
            </div>

            {isLeader && (
              <Link
                href={`/clubs/${club.id}/sessions/new`}
                prefetch={true}
                className="px-4 py-2 rounded-full text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#55db9c]" />
                <span>+ Thêm Buổi Đánh</span>
              </Link>
            )}
          </div>

          {club.sessions.length === 0 ? (
            <div className="py-12 px-4 text-center border-2 border-dashed border-black/20 rounded-2xl bg-[#f8fafc]">
              <Calendar className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-700">Chưa có buổi đánh nào được tạo</p>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                Trưởng nhóm hoặc thủ quỹ có thể bấm tạo buổi đánh để nạp tự động danh sách thành viên
              </p>
              {isLeader && (
                <Link
                  href={`/clubs/${club.id}/sessions/new`}
                  prefetch={true}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[2px_2px_0px_#000000]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tạo Buổi Đánh Đầu Tiên</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {club.sessions.map((s) => {
                const checkedInCount = s.attendances.filter((a) => a.isCheckedIn).length;
                const totalShuttles = s.shuttleLogs.reduce((acc, curr) => acc + curr.quantity, 0);

                return (
                  <div
                    key={s.id}
                    className="border border-black rounded-[20px] p-5 shadow-[4px_4px_0px_#000000] bg-white flex flex-col justify-between hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000000] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border border-black uppercase ${
                            s.status === "ONGOING"
                              ? "bg-[#55db9c] text-black animate-pulse"
                              : s.status === "COMPLETED"
                              ? "bg-[#e9ccff] text-black"
                              : "bg-[#ffd731] text-black"
                          }`}
                        >
                          {s.status === "ONGOING"
                            ? "● Đang Đánh"
                            : s.status === "COMPLETED"
                            ? "✓ Đã Hoàn Tất"
                            : "Sắp Tới"}
                        </span>

                        <span className="text-[11px] font-bold text-zinc-500">
                          {formatSessionTime(s.startTime)}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-black leading-tight mb-2">
                        {s.courtName}
                      </h3>

                      <div className="space-y-1 text-xs font-semibold text-zinc-600 mb-4 bg-[#f8fafc] p-3 rounded-xl border border-black/10">
                        <div className="flex justify-between">
                          <span>Điểm danh có mặt:</span>
                          <span className="font-bold text-black">{checkedInCount} / {s.attendances.length} người</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cầu đã tiêu hao:</span>
                          <span className="font-bold text-[#fb4903]">{totalShuttles} quả</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tiền sân:</span>
                          <span className="font-bold text-black">{formatVND(s.courtFee)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <Link
                        href={`/sessions/${s.id}`}
                        prefetch={true}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase text-center bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>{s.status === "COMPLETED" ? "Xem Chi Tiết Buổi Đánh" : "Vào Điểm Danh & Đếm Cầu"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: TREASURY (Sổ Quỹ CLB) */}
      {activeTab === "TREASURY" && (
        <TreasuryView
          clubId={club.id}
          transactions={transactions}
          members={club.members}
          isLeader={isLeader}
        />
      )}

      {/* TAB 3: DEBTS (Bảng Theo Dõi Nợ CLB) */}
      {activeTab === "DEBTS" && (
        <DebtTrackerView
          club={club}
          unpaidAttendances={unpaidAttendances}
          isLeader={isLeader}
        />
      )}

      {/* TAB 4: MEMBERS (Quản Lý Hội Viên & Phân Quyền) */}
      {activeTab === "MEMBERS" && (
        <section className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000]">
          <MemberManagement
            clubId={club.id}
            members={club.members}
            currentUserRole={currentUserRole}
          />
        </section>
      )}
    </div>
  );
}
