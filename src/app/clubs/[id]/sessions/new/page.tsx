import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { createSession } from "@/server/actions/session";
import { ArrowLeft, Calendar, Clock, DollarSign, MapPin } from "lucide-react";

interface NewSessionPageProps {
  params: {
    id: string; // clubId
  };
}

export const dynamic = "force-dynamic";

export default async function NewSessionPage({ params }: NewSessionPageProps) {
  let session = null;
  try {
    session = await auth();
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
  }

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Kiểm tra quyền: Chỉ Trưởng nhóm (ADMIN) hoặc Thủ quỹ (TREASURER) mới được vào trang này
  const currentLeader = await db.member.findFirst({
    where: {
      clubId: params.id,
      userId: session.user.id,
      role: { in: ["ADMIN", "TREASURER"] },
      isActive: true,
    },
  });

  if (!currentLeader) {
    redirect(`/clubs/${params.id}`);
  }

  const club = await db.club.findUnique({
    where: { id: params.id },
    include: {
      members: {
        where: {
          isActive: true,
          membershipType: { in: ["FULL_MONTHLY", "COURT_ONLY_MONTHLY"] },
        },
      },
    },
  });

  if (!club) {
    notFound();
  }

  // Format default start time: ngày hôm nay lúc 18:00
  const now = new Date();
  const defaultStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0);
  const formattedDefaultTime = new Date(defaultStartTime.getTime() - defaultStartTime.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="min-h-screen bg-[#dceeff] text-black">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <Link
          href={`/clubs/${club.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-zinc-700 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về CLB {club.name}</span>
        </Link>

        <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000]">
          <div className="mb-6">
            <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black bg-[#ffd731] text-black border border-black uppercase mb-1">
              Lịch Hoạt Động
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              Tạo Buổi Đánh Mới
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 font-medium">
              Hệ thống sẽ tự động nạp sẵn {club.members.length} hội viên cố định vào danh sách điểm danh
            </p>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              const res = await createSession(club.id, formData);
              if (res.success && res.sessionId) {
                redirect(`/sessions/${res.sessionId}`);
              }
            }}
            className="space-y-4"
          >
            {/* Tên Sân */}
            <div>
              <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                Tên / Số Sân Cầu Lông *
              </label>
              <input
                type="text"
                name="courtName"
                required
                defaultValue="Sân 3 - Kỳ Hòa"
                placeholder="VD: Sân 2 - Nhà thi đấu Tân Bình"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5c4ade] shadow-[2px_2px_0px_#000000]"
              />
            </div>

            {/* Thời gian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                  Giờ Bắt Đầu *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  required
                  defaultValue={formattedDefaultTime}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black text-sm bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                  Thời Lượng Thuê (Giờ)
                </label>
                <select
                  name="durationHours"
                  defaultValue="2"
                  className="w-full px-3 py-2.5 rounded-xl border border-black text-sm font-bold bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                >
                  <option value="1">1 tiếng</option>
                  <option value="1.5">1.5 tiếng</option>
                  <option value="2">2 tiếng (Tiêu chuẩn)</option>
                  <option value="2.5">2.5 tiếng</option>
                  <option value="3">3 tiếng</option>
                  <option value="4">4 tiếng</option>
                </select>
              </div>
            </div>

            {/* Chi phí sân & phụ phí */}
            <div className="pt-2 border-t border-black/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-2">
                Chi Phí Cố Định Ban Đầu
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                    Tổng Tiền Thuê Sân (VND)
                  </label>
                  <input
                    type="number"
                    name="courtFee"
                    defaultValue={180000}
                    step={10000}
                    className="w-full px-3.5 py-2 rounded-xl border border-black text-sm bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                  <span className="text-[10px] text-zinc-500 font-medium">VD: 90.000đ/h × 2h = 180.000đ</span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                    Nước Uống / Phụ Phí (VND)
                  </label>
                  <input
                    type="number"
                    name="otherFee"
                    defaultValue={20000}
                    step={5000}
                    className="w-full px-3.5 py-2 rounded-xl border border-black text-sm bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                  <span className="text-[10px] text-zinc-500 font-medium">Có thể cập nhật sau khi đánh xong</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-full text-sm font-black uppercase bg-[#55db9c] text-black border border-black shadow-[4px_4px_0px_#000000] hover:bg-[#42c586] transition-all flex items-center justify-center gap-2 mt-6"
            >
              <span>Khởi Tạo & Mở Điểm Danh Buổi Đánh</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
