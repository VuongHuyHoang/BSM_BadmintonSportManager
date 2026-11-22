"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/server/actions/auth";
import { ArrowRight, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await registerUser(formData);

    if (res.success) {
      router.push("/login?registered=true");
    } else {
      setError(res.error || "Đăng ký thất bại.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#dceeff] flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-full bg-[#55db9c] border border-black flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_#000000]">
            🏸
          </div>
          <span className="text-2xl font-black tracking-tight text-black">BSM</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
          Tạo Tài Khoản Mới
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-zinc-700 font-medium">
          Tham gia hoặc tự tạo câu lạc bộ cầu lông của riêng bạn
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000]">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#fee2e2] border border-[#ef4444] text-[#b91c1c] text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                Họ & Tên
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Nguyễn Văn A"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5c4ade] shadow-[2px_2px_0px_#000000]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                Số Điện Thoại (Tùy chọn)
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="0901234567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5c4ade] shadow-[2px_2px_0px_#000000]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                Địa Chỉ Email
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="vidu@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5c4ade] shadow-[2px_2px_0px_#000000]"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-zinc-700 mb-1">
                Mật Khẩu (Tối thiểu 6 ký tự)
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5c4ade] shadow-[2px_2px_0px_#000000]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full text-sm font-black uppercase bg-[#55db9c] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#45cc89] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              <span>{loading ? "Đang Khởi Tạo..." : "Đăng Ký Tài Khoản"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs font-semibold text-zinc-600">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-black text-black underline underline-offset-2">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
