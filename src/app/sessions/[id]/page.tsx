import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { ShuttleCounter } from "@/components/session/shuttle-counter";
import { AttendanceBoard } from "@/components/session/attendance-board";
import { ExtraFeeWidget } from "@/components/session/extra-fee-widget";
import { ExtendDurationWidget } from "@/components/session/extend-duration-widget";
import { ManageSessionDialog } from "@/components/session/manage-session-dialog";
import { CourtMatchmaker } from "@/components/session/court-matchmaker";
import { formatVND } from "@/lib/utils";
import { updateSessionStatus } from "@/server/actions/session";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Play, 
  CheckCircle, 
  Sparkles,
  Calculator,
  QrCode
} from "lucide-react";

interface SessionPageProps {
  params: {
    id: string; // sessionId
  };
}

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({ params }: SessionPageProps) {
  let sessionUser = null;
  try {
    sessionUser = await auth();
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("SessionDetail auth error:", error);
  }

  const session = await db.badmintonSession.findUnique({
    where: { id: params.id },
    include: {
      club: {
        include: {
          members: {
            where: { isActive: true },
          },
        },
      },
      shuttleLogs: true,
      attendances: {
        include: {
          member: true,
          extraItems: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: [
          { isCheckedIn: "desc" },
          { member: { displayName: "asc" } },
        ],
      },
    },
  });

  if (!session) {
    notFound();
  }

  // Quyền của user hiện tại
  const currentMember = session.club.members.find((m) => m.userId === sessionUser?.user?.id);
  const isLeader = currentMember?.role === "ADMIN" || currentMember?.role === "TREASURER";

  // Thống kê tổng quan
  const shuttleLog = session.shuttleLogs[0] || { quantity: 0, unitPrice: session.club.defaultShuttlePrice, totalAmount: 0 };
  const totalIndividualExtraFee = session.attendances.reduce((acc, a) => {
    const itemsSum = a.extraItems?.reduce((subAcc, item) => subAcc + item.totalPrice, 0) || 0;
    return acc + itemsSum;
  }, 0);
  const totalCost = session.courtFee + shuttleLog.totalAmount + session.otherFee + totalIndividualExtraFee;
  const checkedInCount = session.attendances.filter((a) => a.isCheckedIn).length;

  const durationHours = Math.round(((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60)) * 10) / 10;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
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
          href={`/clubs/${session.clubId}`}
          prefetch={true}
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-zinc-700 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về CLB {session.club.name}</span>
        </Link>

        {/* 1. Header Buổi Đánh */}
        <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000] mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black border border-black uppercase shrink-0 whitespace-nowrap ${
                    session.status === "ONGOING"
                      ? "bg-[#55db9c] text-black animate-pulse"
                      : session.status === "COMPLETED"
                      ? "bg-[#e9ccff] text-black"
                      : "bg-[#ffd731] text-black"
                  }`}
                >
                  {session.status === "ONGOING"
                    ? "● Đang Đánh Trên Sân"
                    : session.status === "COMPLETED"
                    ? "✓ Đã Hoàn Tất"
                    : "Lên Lịch Sắp Tới"}
                </span>
                <span className="text-xs font-bold text-zinc-600">
                  {session.club.name}
                </span>
                {session.hasExtendedDuration && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#e9ccff] text-black border border-black shrink-0 whitespace-nowrap">
                    Đã Gia Hạn Giờ
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black leading-tight">
                {session.courtName}
              </h1>

              {/* Mô tả thời gian bao gồm số giờ đánh & khoảng giờ */}
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs font-semibold text-zinc-600 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(session.startTime)}</span>
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 bg-[#f1f3f6] px-2 py-0.5 rounded-md border border-black/15 font-black text-black">
                  <Clock className="w-3.5 h-3.5 text-[#5c4ade]" />
                  <span>{durationHours} giờ ({formatTime(session.startTime)} - {formatTime(session.endTime)})</span>
                </span>
                <span>·</span>
                <span>Tiền sân: {formatVND(session.courtFee)}</span>
              </div>
            </div>

            {/* Leader Actions */}
            {isLeader && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Quản lý Sửa & Xóa Buổi Đánh */}
                <ManageSessionDialog
                  sessionId={session.id}
                  clubId={session.clubId}
                  initialCourtName={session.courtName}
                  initialStartTime={session.startTime.toISOString()}
                  initialDurationHours={durationHours}
                  initialCourtFee={session.courtFee}
                  initialOtherFee={session.otherFee}
                  initialMaxAttendees={session.maxAttendees}
                  sessionStatus={session.status}
                />

                {/* Gia hạn giờ đánh (Tối đa 1 lần) */}
                <ExtendDurationWidget
                  sessionId={session.id}
                  hasExtendedDuration={session.hasExtendedDuration}
                  currentCourtFee={session.courtFee}
                  currentDurationHours={durationHours}
                  isLeader={isLeader}
                />

                {session.status === "SCHEDULED" && (
                  <form
                    action={async () => {
                      "use server";
                      await updateSessionStatus(session.id, "ONGOING");
                    }}
                  >
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full text-xs font-black uppercase bg-[#55db9c] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#42c586] transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Bắt Đầu Buổi Đánh</span>
                    </button>
                  </form>
                )}

                {session.status === "ONGOING" && (
                  <form
                    action={async () => {
                      "use server";
                      await updateSessionStatus(session.id, "COMPLETED");
                    }}
                  >
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#f0c518] transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Kết Thúc Buổi Đánh</span>
                    </button>
                  </form>
                )}

                {session.status === "COMPLETED" && (
                  <form
                    action={async () => {
                      "use server";
                      await updateSessionStatus(session.id, "ONGOING");
                    }}
                  >
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full text-xs font-black uppercase bg-[#f1f3f6] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-zinc-200 transition-all flex items-center gap-1.5"
                      title="Mở lại buổi đánh nếu cần điều chỉnh số cầu hoặc điểm danh (kho cầu sẽ tự hoàn trả)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#5c4ade]" />
                      <span>Mở Lại Buổi Đánh</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Main Grid: Left (Attendance Board) & Right (Shuttle Counter + Costs) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột Trái: Bảng Điểm Danh 2 Chiều + Bảng Bốc Thăm Sắp Trận */}
          <div className="lg:col-span-2 space-y-6">
            <AttendanceBoard
              sessionId={session.id}
              clubId={session.clubId}
              attendees={session.attendances}
              allClubMembers={session.club.members}
              currentUserId={sessionUser?.user?.id}
              isLeader={isLeader}
              maxAttendees={session.maxAttendees}
              sessionStatus={session.status}
            />

            {/* Bảng Bốc Thăm & Sắp Trận Live Trên Sân */}
            <CourtMatchmaker
              sessionId={session.id}
              players={session.attendances.map((a) => ({
                id: a.id,
                memberId: a.memberId,
                displayName: a.member.displayName,
                matchesPlayed: a.matchesPlayed || 0,
                isCheckedIn: a.isCheckedIn,
                attendanceStatus: a.attendanceStatus || "CONFIRMED",
              }))}
              isLeader={isLeader}
            />
          </div>

          {/* Cột Phải: Tiêu Hao Cầu + Phụ Phí + Tổng Hợp Chi Phí */}
          <div className="space-y-5">
            {/* Bộ Đếm Cầu Lông Live */}
            <ShuttleCounter
              sessionId={session.id}
              initialQuantity={shuttleLog.quantity}
              unitPrice={shuttleLog.unitPrice}
              isLeader={isLeader}
              sessionStatus={session.status}
            />

            {/* Phụ Phí Nước Uống */}
            <ExtraFeeWidget
              sessionId={session.id}
              initialOtherFee={session.otherFee}
              isLeader={isLeader}
              sessionStatus={session.status}
            />

            {/* Live Cost Summary Card */}
            <div className="bg-white border border-black rounded-[22px] p-5 shadow-[5px_5px_0px_#000000]">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-2">
                Tổng Hợp Chi Phí Buổi Đánh
              </span>

              <div className="space-y-2 text-xs font-semibold mb-4">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Tiền sân ({durationHours} giờ):</span>
                  <span className="font-bold text-black">{formatVND(session.courtFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Tiền cầu ({shuttleLog.quantity} quả):</span>
                  <span className="font-bold text-[#fb4903]">{formatVND(shuttleLog.totalAmount)}</span>
                </div>
                {totalIndividualExtraFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Nước & phụ phí riêng từng người:</span>
                    <span className="font-bold text-amber-600">{formatVND(totalIndividualExtraFee)}</span>
                  </div>
                )}
                {session.otherFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Phụ phí chung cả nhóm:</span>
                    <span className="font-bold text-black">{formatVND(session.otherFee)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-black/10 flex justify-between items-center text-sm font-black">
                  <span>Tổng Chi Phí ({durationHours} giờ):</span>
                  <span className="text-base text-black">{formatVND(totalCost)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-zinc-500">
                  <span>Người có mặt chia tiền:</span>
                  <span className="font-bold text-black">{checkedInCount} người</span>
                </div>
              </div>

              {/* Phase 4 Split & VietQR CTA Button */}
              <div className="pt-2 border-t border-black/10">
                <Link
                  href={`/sessions/${session.id}/split`}
                  prefetch={true}
                  className="w-full py-3 px-4 rounded-full text-xs font-black uppercase bg-[#5c4ade] text-white border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#4b39cb] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>⚡ Chia Tiền & Quét Mã VietQR</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
