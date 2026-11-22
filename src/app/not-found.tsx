import Link from "next/link";
import { SearchX, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#dceeff] flex flex-col justify-center items-center px-4 py-12">
      <div className="bg-white border border-black rounded-[24px] p-8 max-w-md w-full text-center shadow-[6px_6px_0px_#000000] space-y-4">
        <div className="h-16 w-16 rounded-full bg-[#fef08a] border border-black flex items-center justify-center mx-auto shadow-[2px_2px_0px_#000000]">
          <SearchX className="w-8 h-8 text-black" />
        </div>
        
        <div className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black bg-[#fb4903] text-white border border-black uppercase tracking-wider">
          Lỗi 404
        </div>

        <h2 className="text-2xl font-black uppercase text-black">
          Không Tìm Thấy Trang
        </h2>
        
        <p className="text-xs text-zinc-600 font-medium">
          Dữ liệu hoặc trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc bạn không có quyền truy cập.
        </p>

        <div className="flex items-center justify-center gap-2 pt-3">
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#ffcf10] flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Dashboard</span>
          </Link>
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
