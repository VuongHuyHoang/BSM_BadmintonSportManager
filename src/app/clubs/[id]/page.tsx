import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { ClubHubTabs } from "@/components/club/club-hub-tabs";
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
  Wallet 
} from "lucide-react";

interface ClubPageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export default async function ClubDetailPage({ params }: ClubPageProps) {
  let session = null;
  try {
    session = await auth();
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("ClubDetail auth error:", error);
  }

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Chạy song song cả 3 truy vấn DB: Thông tin CLB, Sổ Quỹ và Bảng Nợ Đọng
  const [club, transactions, unpaidAttendances] = await Promise.all([
    db.club.findUnique({
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
    }),
    db.transaction.findMany({
      where: { clubId: params.id },
      include: {
        member: {
          select: { id: true, displayName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.sessionAttendance.findMany({
      where: {
        session: { clubId: params.id },
        paymentStatus: "UNPAID",
        totalAmount: { gt: 0 },
      },
      include: {
        member: true,
        session: true,
      },
      orderBy: { session: { startTime: "desc" } },
    }),
  ]);

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

        {/* Section: 4 Tabs Hub (Buổi Đánh, Sổ Quỹ, Bảng Nhắc Nợ, Hội Viên) */}
        <div className="mb-8">
          <ClubHubTabs
            club={club}
            transactions={transactions}
            unpaidAttendances={unpaidAttendances}
            isLeader={isLeader}
            currentUserRole={currentMember?.role || null}
          />
        </div>

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
