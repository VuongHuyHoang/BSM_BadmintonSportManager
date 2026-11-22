"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leaveClub } from "@/server/actions/member";
import { LogOut, AlertTriangle } from "lucide-react";

interface LeaveClubButtonProps {
  clubId: string;
  clubName: string;
}

export function LeaveClubButton({ clubId, clubName }: LeaveClubButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLeave = async () => {
    const confirmed = confirm(
      `Bạn có chắc chắn muốn rời câu lạc bộ "${clubName}"?\n\nLưu ý: Bạn phải hoàn tất tất cả khoản nợ và không thể rời khi đang có mặt trong buổi đánh chưa kết thúc trên sân.`
    );

    if (!confirmed) return;

    setLoading(true);
    const res = await leaveClub(clubId);
    setLoading(false);

    if (res.success) {
      alert(`Bạn đã rời câu lạc bộ "${clubName}" thành công.`);
      router.push("/dashboard");
      router.refresh();
    } else {
      alert(`⚠️ KHÔNG THỂ RỜI CÂU LẠC BỘ:\n\n${res.error}`);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleLeave}
      className="px-4 py-2 rounded-full text-xs font-black uppercase text-red-600 bg-white border border-red-400 shadow-[2px_2px_0px_#ef4444] hover:bg-red-50 active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 disabled:opacity-50"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{loading ? "Đang Kiểm Tra..." : "Rời Câu Lạc Bộ"}</span>
    </button>
  );
}
