import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { MemberManagement } from "@/components/club/member-management";
import { LeaveClubButton } from "@/components/club/leave-club-button";
import { ClubHeaderActions } from "@/components/club/club-header-actions";
import { formatVND } from "@/lib/utils";
import { 
  Users, 
  Copy, 
  QrCode, 
  PlusCircle, 
  ArrowLeft, 
  Shield, 
  Settings,
  Calendar,
  Wallet,
  Play,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";

interface ClubPageProps {
  params: {
    id: string;
  };
}

export default async function ClubDetailPage({ params }: ClubPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const club = await db.club.findUnique({
    where: { id: params.id },
    include: {
      members: {
        where: { isActive: true },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
      sessions: {
        orderBy: { startTime: "desc" },
        take: 10,
        include: {
          attendances: true,
          shuttleLogs: true,
        },
      },
    },
  });

  if (!club) {
    notFound();
  }

  // Quyền của người đang đăng nhập trong CLB này
  const currentMember = club.members.find((m) => m.userId === session.user?.id);
  const isLeader = currentMember?.role === "ADMIN" || currentMember?.role === "TREASURER";

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/join/${club.inviteCode}`;

  const formatSessionTime = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-[#dceeff] text-black pb-12">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        {/* Breadcrumb Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-zinc-700 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Dashboard</span>
        </Link>

        {/* Club Header Banner (Slush Paper White + 1px Black Border) */}
        <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000] mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div>
              <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black bg-[#55db9c] text-black border border-black uppercase tracking-wider mb-2">
                Thông Tin Câu Lạc Bộ
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black leading-tight">
                {club.name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 font-medium mt-1">
                Quy tắc làm tròn: {club.roundingMode === "CEIL_1K" ? "Lên 1.000đ" : "Lên 5.000đ"} · Giá cầu mặc định: {formatVND(club.defaultShuttlePrice)}/quả
              </p>
            </div>

            {/* Invite Code & Link Box */}
            <div className="bg-[#f1f3f6] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000] flex flex-col gap-2 min-w-[260px]">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 block">
                Mã Mời Tham Gia CLB:
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-mono font-black text-black bg-white px-2.5 py-1 rounded-xl border border-black">
                  {club.inviteCode}
                </span>
                <Link
                  href={`/join/${club.inviteCode}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Mở Link</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bank Info for VietQR & Action */}
          <div className="mt-6 pt-5 border-t border-black/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#5c4ade] text-white flex items-center justify-center border border-black shadow-[2px_2px_0px_#000000]">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                  Tài Khoản Nhận Chuyển Khoản VietQR:
                </span>
                <span className="text-sm font-black text-black">
                  {club.bankAccountNo ? `${club.bankCode} · ${club.bankAccountNo} (${club.bankAccountName || "THU QUY"})` : "Chưa cài đặt tài khoản ngân hàng"}
                </span>
              </div>
            </div>

            <ClubHeaderActions club={club} isLeader={isLeader} />
          </div>
        </div>

        {/* Section: Sessions List (Lịch Hoạt Động & Điểm Danh) */}
        <section className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000] mb-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black pb-4">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#ffd731] text-black border border-black uppercase mb-1">
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
            <div className="py-8 px-4 text-center border-2 border-dashed border-black/20 rounded-2xl bg-[#f8fafc]">
              <Calendar className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-700">Chưa có buổi đánh nào được tạo</p>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                Trưởng nhóm hoặc thủ quỹ có thể bấm tạo buổi đánh để nạp tự động danh sách thành viên
              </p>
              {isLeader && (
                <Link
                  href={`/clubs/${club.id}/sessions/new`}
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

        {/* Member Management Section */}
        <section className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000]">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                Danh Sách Hội Viên ({club.members.length})
              </h2>
              <p className="text-xs text-zinc-600 font-medium">
                Phân loại gói tháng, thêm khách vãng lai và quản lý quyền trong CLB
              </p>
            </div>
          </div>

          <MemberManagement
            clubId={club.id}
            members={club.members}
            currentUserRole={currentMember?.role || null}
          />
        </section>

        {/* Member Options / Leave Club Section */}
        {currentMember && (
          <section className="mt-8 bg-white border border-black rounded-[22px] p-5 sm:p-6 shadow-[5px_5px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-0.5">
                Cài Đặt Thành Viên
              </span>
              <h3 className="text-base font-black uppercase text-black">
                Rời Câu Lạc Bộ
              </h3>
              <p className="text-xs text-zinc-600 font-medium">
                Bạn chỉ có thể rời câu lạc bộ khi đã thanh toán hết nợ và không trong buổi đánh dở dang trên sân.
              </p>
            </div>
            <div>
              <LeaveClubButton clubId={club.id} clubName={club.name} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
