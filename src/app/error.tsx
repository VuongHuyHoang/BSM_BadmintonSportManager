"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#dceeff] flex flex-col justify-center items-center px-4 py-12">
      <div className="bg-white border border-black rounded-[24px] p-8 max-w-md w-full text-center shadow-[6px_6px_0px_#000000] space-y-4">
        <div className="h-14 w-14 rounded-full bg-[#fee2e2] border border-black flex items-center justify-center mx-auto shadow-[2px_2px_0px_#000000]">
          <AlertCircle className="w-8 h-8 text-[#dc2626]" />
        </div>
        <h2 className="text-2xl font-black uppercase text-black">Đã Có Sự Cố Xảy Ra</h2>
        <p className="text-xs text-zinc-600 font-medium">
          Hệ thống gặp sự cố tạm thời khi tải dữ liệu. Bạn có thể nhấn thử lại hoặc quay về trang chủ.
        </p>
        {error?.digest && (
          <span className="text-[10px] font-mono text-zinc-400 block bg-zinc-50 py-1 px-2 rounded border border-black/10">
            Mã lỗi (Digest): {error.digest}
          </span>
        )}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2.5 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#ffcf10] flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử Lại</span>
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-full text-xs font-black uppercase bg-black text-white border border-black shadow-[2px_2px_0px_#55db9c] hover:bg-zinc-800 flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
