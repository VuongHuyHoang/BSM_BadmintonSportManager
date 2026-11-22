import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { joinClubByInviteCode } from "@/server/actions/club";
import { Users, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface JoinPageProps {
  params: {
    code: string;
  };
}

export default async function JoinClubPage({ params }: JoinPageProps) {
  const session = await auth();

  const club = await db.club.findUnique({
    where: { inviteCode: params.code.trim().toUpperCase() },
    include: {
      members: { where: { role: "ADMIN" } },
    },
  });

  if (!club) {
    notFound();
  }

  // Kiểm tra đã là thành viên chưa
  let alreadyMember = false;
  if (session?.user?.id) {
    const m = await db.member.findFirst({
      where: {
        clubId: club.id,
        userId: session.user.id,
      },
    });
    alreadyMember = !!m;
  }

  const adminName = club.members[0]?.displayName || "Trưởng nhóm";

  return (
    <div className="min-h-screen bg-[#dceeff] flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 text-black">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-full bg-[#55db9c] border border-black flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_#000000]">
            🏸
          </div>
          <span className="text-2xl font-black tracking-tight text-black">BSM</span>
        </Link>
        <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black bg-[#ffd731] border border-black uppercase mb-1">
          Lời Mời Tham Gia
        </div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
          Gia Nhập Câu Lạc Bộ
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000] text-center">
          <div className="h-14 w-14 rounded-full bg-[#55db9c] border border-black flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_#000000] text-2xl font-black">
            🏸
          </div>

          <h3 className="text-2xl font-black text-black uppercase leading-tight mb-1">
            {club.name}
          </h3>
          <p className="text-xs text-zinc-600 font-medium mb-4">
            Được mời bởi: <span className="font-bold text-black">{adminName}</span> · Mã mời: <span className="font-mono font-bold bg-[#f1f3f6] px-1.5 py-0.5 rounded border border-black/20">{club.inviteCode}</span>
          </p>

          {alreadyMember ? (
            <div className="p-4 rounded-2xl bg-[#ecfdf5] border border-[#10b981] text-emerald-800 text-xs font-bold mb-4">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
              Bạn đã là thành viên của câu lạc bộ này rồi!
            </div>
          ) : (
            <p className="text-xs text-zinc-600 font-medium mb-6">
              Bấm xác nhận để tham gia đội nhóm. Bạn sẽ tự động được vào danh sách hội viên (đóng theo buổi) và có thể tự check-in khi đến sân!
            </p>
          )}

          {alreadyMember ? (
            <Link
              href={`/clubs/${club.id}`}
              className="w-full py-3 px-4 rounded-full text-sm font-black uppercase bg-black text-white border border-black shadow-[3px_3px_0px_#55db9c] hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              <span>Vào Trang CLB</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : session?.user ? (
            <form
              action={async () => {
                "use server";
                const res = await joinClubByInviteCode(club.inviteCode);
                if (res.success && res.clubId) {
                  redirect(`/clubs/${res.clubId}`);
                }
              }}
            >
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-full text-sm font-black uppercase bg-[#55db9c] text-black border border-black shadow-[4px_4px_0px_#000000] hover:bg-[#42c586] transition-all flex items-center justify-center gap-2"
              >
                <span>Xác Nhận Gia Nhập CLB</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <Link
                href={`/login?callbackUrl=/join/${club.inviteCode}`}
                className="w-full py-3 px-4 rounded-full text-sm font-black uppercase bg-black text-white border border-black shadow-[3px_3px_0px_#55db9c] hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <span>Đăng Nhập Để Tham Gia</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-[11px] font-bold text-zinc-500">
                Chưa có nick?{" "}
                <Link href="/register" className="text-black underline font-black">
                  Đăng ký miễn phí
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
