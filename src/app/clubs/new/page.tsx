import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { createClub } from "@/server/actions/club";
import { ArrowLeft, Building2, QrCode, Shield, Check } from "lucide-react";

const VN_BANKS = [
  { code: "970422", name: "MBBank (Quân Đội)" },
  { code: "970436", name: "Vietcombank" },
  { code: "970407", name: "Techcombank" },
  { code: "970415", name: "VietinBank" },
  { code: "970418", name: "BIDV" },
  { code: "970416", name: "ACB (Á Châu)" },
  { code: "970432", name: "VPBank" },
  { code: "970423", name: "TPBank" },
  { code: "970441", name: "VIB" },
];

export default async function NewClubPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#dceeff] text-black">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-zinc-700 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Dashboard</span>
        </Link>

        <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000]">
          <div className="mb-6">
            <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black bg-[#ffd731] text-black border border-black uppercase mb-1">
              Khởi Tạo Đội Nhóm
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              Tạo Câu Lạc Bộ Mới
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 font-medium">
              Bạn sẽ là Trưởng nhóm (Admin) của CLB này và có toàn quyền quản trị
            </p>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              const res = await createClub(formData);
              if (res.success && res.clubId) {
                redirect(`/clubs/${res.clubId}`);
              }
            }}
            className="space-y-4"
          >
            {/* Tên CLB */}
            <div>
              <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                Tên Câu Lạc Bộ / Nhóm Cầu Lông *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="VD: CLB Cầu Lông Kỳ Hòa (Thứ 3-5-7)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5c4ade] shadow-[2px_2px_0px_#000000]"
              />
            </div>

            {/* Thông tin VietQR Ngân hàng */}
            <div className="pt-2 border-t border-black/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-2 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#5c4ade]" />
                Cấu Hình Tài Khoản Nhận Tiền VietQR (Napas247)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                    Ngân Hàng
                  </label>
                  <select
                    name="bankCode"
                    defaultValue="970422"
                    className="w-full px-3 py-2.5 rounded-xl border border-black text-xs font-bold bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                  >
                    {VN_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                    Số Tài Khoản (STK) Thủ Quỹ
                  </label>
                  <input
                    type="text"
                    name="bankAccountNo"
                    placeholder="VD: 0912345678"
                    className="w-full px-3.5 py-2 rounded-xl border border-black text-sm bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Tên Chủ Tài Khoản (In hoa không dấu)
                </label>
                <input
                  type="text"
                  name="bankAccountName"
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full px-3.5 py-2 rounded-xl border border-black text-sm uppercase bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                />
              </div>
            </div>

            {/* Cài đặt chi phí mặc định */}
            <div className="pt-2 border-t border-black/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-2">
                Quy Chuẩn Tính Tiền Phong Trào
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                    Giá Cầu Mặc Định (đ / quả)
                  </label>
                  <input
                    type="number"
                    name="defaultShuttlePrice"
                    defaultValue={25000}
                    step={1000}
                    className="w-full px-3.5 py-2 rounded-xl border border-black text-sm bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                    Quy Tắc Làm Tròn Tiền
                  </label>
                  <select
                    name="roundingMode"
                    defaultValue="CEIL_1K"
                    className="w-full px-3 py-2.5 rounded-xl border border-black text-xs font-bold bg-white focus:outline-none shadow-[2px_2px_0px_#000000]"
                  >
                    <option value="CEIL_1K">Làm tròn lên 1.000đ (Khuyên dùng)</option>
                    <option value="CEIL_5K">Làm tròn lên 5.000đ</option>
                    <option value="EXACT">Giữ nguyên số lẻ</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-full text-sm font-black uppercase bg-[#55db9c] text-black border border-black shadow-[4px_4px_0px_#000000] hover:bg-[#42c586] transition-all flex items-center justify-center gap-2 mt-6"
            >
              <span>Xác Nhận Tạo Câu Lạc Bộ</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
