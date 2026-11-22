"use client";

import { useState } from "react";
import Link from "next/link";
import { loginWithCredentials } from "@/server/actions/auth";
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const res = await loginWithCredentials(formData);
    if (res && !res.success) {
      setError(res.error || "Đăng nhập thất bại.");
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string) => {
    setEmail(testEmail);
    setPassword("123456");
  };

  return (
    <div className="min-h-screen bg-[#dceeff] flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
      {/* 1. Top Screen Progress Bar (khi đang xử lý đăng nhập) */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-1.5 bg-black/20 z-50 overflow-hidden">
          <div className="animate-progress-bar rounded-full shadow-[0_0_8px_#55db9c]" />
        </div>
      )}

      {/* Top Brand Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" prefetch={true} className="inline-flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-full bg-[#55db9c] border border-black flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_#000000]">
            🏸
          </div>
          <span className="text-2xl font-black tracking-tight text-black">BSM</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
          Đăng Nhập Tài Khoản
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-zinc-700 font-medium">
          Quản lý câu lạc bộ và tham gia các buổi đánh cầu lông
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000] relative overflow-hidden">
          {/* 2. Thanh tiến trình chạy ở đỉnh thẻ đăng nhập */}
          {loading && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-100 overflow-hidden">
              <div className="animate-progress-bar" />
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#fee2e2] border border-[#ef4444] text-[#b91c1c] text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                Địa Chỉ Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vidu@badminton.vn"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5c4ade] shadow-[2px_2px_0px_#000000]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                Mật Khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5c4ade] shadow-[2px_2px_0px_#000000]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full text-sm font-black uppercase bg-black text-white border border-black shadow-[3px_3px_0px_#55db9c] hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#55db9c]" />
                  <span>Đang Đăng Nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng Nhập Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Buttons */}
          <div className="mt-6 pt-5 border-t border-black/15">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-2.5">
              ⚡ Điền Nhanh Tài Khoản Mẫu (Mật khẩu: 123456):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@badminton.vn")}
                className="p-2 rounded-xl text-center border border-black bg-[#ffd731] text-[11px] font-bold shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
              >
                Trưởng Nhóm
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("treasurer@badminton.vn")}
                className="p-2 rounded-xl text-center border border-black bg-[#55db9c] text-[11px] font-bold shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
              >
                Thủ Quỹ
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("huy@badminton.vn")}
                className="p-2 rounded-xl text-center border border-black bg-[#e9ccff] text-[11px] font-bold shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
              >
                Hội Viên Huy
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs font-semibold text-zinc-600">
            Chưa có tài khoản?{" "}
            <Link href="/register" prefetch={true} className="font-black text-black underline underline-offset-2">
              Đăng ký miễn phí tại đây
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
