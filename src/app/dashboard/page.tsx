import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { formatVND } from "@/lib/utils";
import { joinClubByInviteCode } from "@/server/actions/club";
import { 
  Users, 
  PlusCircle, 
  QrCode, 
  ArrowRight, 
  Shield, 
  Wallet, 
  AlertCircle,
  Building,
  CheckCircle2,
  Calendar
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let session = null;
  try {
    session = await auth();
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Dashboard auth error:", error);
  }

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1, 2, 3: Chạy song song cả 3 truy vấn DB bằng Promise.all để tối ưu thời gian phản hồi
  const [memberships, unpaidAttendances, activeSessions] = await Promise.all([
    // 1. Lấy danh sách CLB mà người dùng đang tham gia
    db.member.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        club: {
          include: {
            members: { where: { isActive: true } },
            sessions: {
              orderBy: { startTime: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),

    // 2. Lấy các khoản tiền chưa nộp của người dùng (Debt Tracker)
    db.sessionAttendance.findMany({
      where: {
        member: {
          userId: session.user.id,
        },
        paymentStatus: "UNPAID",
      },
      include: {
        session: {
          include: { club: true },
        },
      },
      orderBy: { session: { startTime: "desc" } },
    }),

    // 3. Lấy các buổi đánh đang diễn ra hoặc sắp tới của các CLB mà user tham gia
    db.badmintonSession.findMany({
      where: {
        club: {
          members: {
            some: { userId: session.user.id, isActive: true },
          },
        },
        status: { in: ["ONGOING", "SCHEDULED"] },
      },
      include: {
        club: true,
        attendances: {
          where: { member: { userId: session.user.id } },
        },
      },
      orderBy: { startTime: "asc" },
      take: 3,
    }),
  ]);

  const totalUnpaid = unpaidAttendances.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="min-h-screen bg-[#dceeff] text-black">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        {/* User Greeting & Stats Bar */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#55db9c] border border-black mb-2 shadow-[2px_2px_0px_#000000]">
              <span>🏸 BẢNG ĐIỀU KHIỂN CÁ NHÂN</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
              Xin chào, {session.user.name || "Vận Động Viên"}!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-700 font-medium">
              Quản lý các câu lạc bộ của bạn và kiểm tra trạng thái đóng tiền
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/clubs/new"
              className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-black uppercase bg-[#ffd731] text-black border border-black shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo CLB Mới</span>
            </Link>
          </div>
        </div>

        {/* Cảnh báo tiền chưa nộp (nếu có) */}
        {totalUnpaid > 0 && (
          <div className="mb-8 bg-[#fb4903] text-white border border-black rounded-[20px] p-5 shadow-[5px_5px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white text-[#fb4903] flex items-center justify-center shrink-0 border border-black shadow-[2px_2px_0px_#000000]">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-orange-200 block">Khoản Chưa Thanh Toán</span>
                <span className="text-xl sm:text-2xl font-black leading-tight">
                  Bạn còn {unpaidAttendances.length} buổi chưa nộp tiền: {formatVND(totalUnpaid)}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-white/90 bg-black/20 px-3 py-1.5 rounded-full border border-black/30 self-start sm:self-auto">
              Vào CLB để quét VietQR
            </span>
          </div>
        )}

        {/* Buổi Đánh Đang Diễn Ra / Sắp Tới */}
        {activeSessions.length > 0 && (
          <div className="mb-8 bg-white border border-black rounded-[22px] p-5 sm:p-6 shadow-[5px_5px_0px_#000000]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-black">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#55db9c] border border-black animate-ping" />
                <h3 className="text-sm font-black uppercase tracking-wider text-black">
                  Buổi Đánh Đang Diễn Ra Hoặc Sắp Tới
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeSessions.map((s) => {
                const myAttendance = s.attendances[0];
                const isCheckedIn = myAttendance?.isCheckedIn;

                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl border border-black bg-[#f8fafc] shadow-[3px_3px_0px_#000000] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                          {s.club.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border border-black uppercase ${
                            s.status === "ONGOING"
                              ? "bg-[#55db9c] text-black animate-pulse"
                              : "bg-[#ffd731] text-black"
                          }`}
                        >
                          {s.status === "ONGOING" ? "Đang Diễn Ra" : "Sắp Tới"}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-black leading-tight mb-2">
                        {s.courtName}
                      </h4>

                      <div className="text-xs text-zinc-600 font-semibold mb-3">
                        Trạng thái điểm danh:{" "}
                        {isCheckedIn ? (
                          <span className="text-[#16a34a] font-black">✓ Đã Có Mặt Trên Sân</span>
                        ) : (
                          <span className="text-[#fb4903] font-black">⚡ Chưa Điểm Danh</span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/sessions/${s.id}`}
                      prefetch={true}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase border border-black shadow-[2px_2px_0px_#000000] transition-colors flex items-center justify-center gap-1.5 ${
                        isCheckedIn
                          ? "bg-white text-black hover:bg-zinc-100"
                          : "bg-[#55db9c] text-black hover:bg-[#43c487]"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCheckedIn ? "Xem Chi Tiết Buổi Đánh" : "Tự Điểm Danh Ngay"}</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Join Club By Invite Code Box */}
        <div className="mb-8 bg-white border border-black rounded-[22px] p-5 sm:p-6 shadow-[5px_5px_0px_#000000]">
          <h3 className="text-sm font-black uppercase tracking-wider text-black mb-1">
            Gia Nhập Câu Lạc Bộ Khác
          </h3>
          <p className="text-xs text-zinc-600 font-medium mb-3">
            Nhập mã mời được Trưởng nhóm chia sẻ (Ví dụ: `KYHOA-CLUB`):
          </p>
          <form
            action={async (formData: FormData) => {
              "use server";
              const code = formData.get("inviteCode") as string;
              if (code) {
                await joinClubByInviteCode(code);
              }
            }}
            className="flex flex-col sm:flex-row gap-2.5 max-w-md"
          >
            <input
              type="text"
              name="inviteCode"
              required
              placeholder="Nhập mã mời CLB..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-black text-sm uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#5c4ade] shadow-[2px_2px_0px_#000000]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full text-xs font-black uppercase bg-[#55db9c] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#42c586] transition-all"
            >
              Gia Nhập
            </button>
          </form>
        </div>

        {/* List of Clubs User belongs to */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-black">
              Câu Lạc Bộ Của Bạn ({memberships.length})
            </h2>
          </div>

          {memberships.length === 0 ? (
            <div className="bg-white border border-black rounded-[24px] p-8 text-center shadow-[5px_5px_0px_#000000]">
              <div className="h-14 w-14 rounded-full bg-[#e9ccff] border border-black flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_#000000]">
                🏸
              </div>
              <h3 className="text-base font-black uppercase text-black mb-1">Bạn chưa tham gia CLB nào</h3>
              <p className="text-xs text-zinc-600 font-medium max-w-sm mx-auto mb-5">
                Hãy tự tạo câu lạc bộ cầu lông mới hoặc nhập mã mời từ bạn bè để bắt đầu!
              </p>
              <Link
                href="/clubs/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[3px_3px_0px_#000000]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo CLB Ngay</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memberships.map(({ club, role, membershipType }) => {
                const isLeader = role === "ADMIN" || role === "TREASURER";
                return (
                  <div
                    key={club.id}
                    className="bg-white border border-black rounded-[22px] p-5 shadow-[5px_5px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_#000000] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border border-black uppercase ${
                              role === "ADMIN"
                                ? "bg-[#ffd731] text-black"
                                : role === "TREASURER"
                                ? "bg-[#55db9c] text-black"
                                : "bg-[#f1f3f6] text-zinc-700"
                            }`}
                          >
                            {role === "ADMIN" ? "Trưởng Nhóm" : role === "TREASURER" ? "Thủ Quỹ" : "Thành Viên"}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-black ${
                              membershipType === "FULL_MONTHLY"
                                ? "bg-[#e9ccff] text-black"
                                : membershipType === "COURT_ONLY_MONTHLY"
                                ? "bg-[#4da2ff] text-white"
                                : "bg-white text-zinc-700"
                            }`}
                          >
                            {membershipType === "FULL_MONTHLY"
                              ? "Gói Trọn Gói"
                              : membershipType === "COURT_ONLY_MONTHLY"
                              ? "Gói Chỉ Sân"
                              : "Đóng Theo Buổi"}
                          </span>
                        </div>

                        <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {club.members.length} người
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-black leading-tight mb-1">
                        {club.name}
                      </h3>
                      <p className="text-xs text-zinc-600 font-medium mb-4">
                        Mã mời: <span className="font-mono font-bold text-black bg-[#f1f3f6] px-1.5 py-0.5 rounded border border-black/20">{club.inviteCode}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-black/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-500">
                        {club.bankCode ? `STK: ${club.bankAccountNo}` : "Chưa cài đặt STK"}
                      </span>
                      <Link
                        href={`/clubs/${club.id}`}
                        prefetch={true}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 transition-colors"
                      >
                        <span>Vào CLB</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
