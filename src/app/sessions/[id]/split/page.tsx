import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { SplitBillView } from "@/components/session/split-bill-view";
import { ArrowLeft } from "lucide-react";

interface SplitPageProps {
  params: {
    id: string; // sessionId
  };
}

export default async function SessionSplitPage({ params }: SplitPageProps) {
  const sessionUser = await auth();

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
        where: { isCheckedIn: true },
        include: {
          member: true,
          extraItems: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: [
          { paymentStatus: "desc" },
          { member: { displayName: "asc" } },
        ],
      },
    },
  });

  if (!session) {
    notFound();
  }

  const currentMember = session.club.members.find((m) => m.userId === sessionUser?.user?.id);
  const isLeader = currentMember?.role === "ADMIN" || currentMember?.role === "TREASURER";

  return (
    <div className="min-h-screen bg-[#dceeff] text-black pb-12">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        {/* Breadcrumb Back to Session */}
        <Link
          href={`/sessions/${session.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-zinc-700 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Sân Đánh: {session.courtName}</span>
        </Link>

        {/* Main Split Bill View */}
        <SplitBillView
          session={session}
          currentUserId={sessionUser?.user?.id}
          isLeader={isLeader}
        />
      </main>
    </div>
  );
}
