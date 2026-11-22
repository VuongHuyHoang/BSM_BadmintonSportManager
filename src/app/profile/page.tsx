import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { ProfileHub } from "@/components/profile/profile-hub";
import { ArrowLeft } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Chạy song song cả 3 truy vấn DB bằng Promise.all thay vì tuần tự
  const [memberships, unpaidAttendances, paidAttendances] = await Promise.all([
    // 1. Lấy danh sách CLB mà người dùng đang tham gia
    db.member.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        club: true,
      },
      orderBy: { joinedAt: "desc" },
    }),

    // 2. Lấy các khoản nợ chưa thanh toán (Debt Tracker)
    db.sessionAttendance.findMany({
      where: {
        member: {
          userId: session.user.id,
        },
        paymentStatus: "UNPAID",
        totalAmount: { gt: 0 },
      },
      include: {
        session: {
          include: { club: true },
        },
      },
      orderBy: { session: { startTime: "desc" } },
    }),

    // 3. Lấy lịch sử các buổi đã thanh toán
    db.sessionAttendance.findMany({
      where: {
        member: {
          userId: session.user.id,
        },
        paymentStatus: "PAID",
        totalAmount: { gt: 0 },
      },
      include: {
        session: {
          include: { club: true },
        },
      },
      orderBy: { session: { startTime: "desc" } },
      take: 20,
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#dceeff] text-black pb-12">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        {/* Breadcrumb Back */}
        <Link
          href="/dashboard"
          prefetch={true}
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-zinc-700 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Dashboard</span>
        </Link>

        {/* Profile Hub */}
        <ProfileHub
          user={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
          }}
          memberships={memberships}
          unpaidAttendances={unpaidAttendances}
          paidAttendances={paidAttendances}
        />
      </main>
    </div>
  );
}
