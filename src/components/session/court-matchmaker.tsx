"use client";

import { useState } from "react";
import { recordMatch } from "@/server/actions/session";
import { 
  Shuffle, 
  CheckCircle2, 
  Users, 
  Trophy, 
  Play, 
  Sparkles,
  RotateCcw
} from "lucide-react";

interface MatchmakerPlayer {
  id: string; // attendanceId
  memberId: string;
  displayName: string;
  matchesPlayed: number;
  isCheckedIn: boolean;
  attendanceStatus: string;
}

interface CourtMatchmakerProps {
  sessionId: string;
  players: MatchmakerPlayer[];
  isLeader: boolean;
}

export function CourtMatchmaker({
  sessionId,
  players,
  isLeader,
}: CourtMatchmakerProps) {
  // Lọc những người đã có mặt trên sân và là CONFIRMED
  const eligiblePlayers = players.filter(
    (p) => p.isCheckedIn && p.attendanceStatus === "CONFIRMED"
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastMatchRecorded, setLastMatchRecorded] = useState(false);

  // Thuật toán bốc thăm công bằng:
  // 1. Sắp xếp người chơi theo số trận đã đánh tăng dần
  // 2. Nhóm những người cùng số trận và random xáo trộn bên trong
  // 3. Chọn 4 người đầu tiên
  const handleAutoShuffle = () => {
    if (eligiblePlayers.length < 4) {
      alert("Cần ít nhất 4 người có mặt trên sân để bốc thăm trận đôi.");
      return;
    }

    // Nhóm theo matchesPlayed
    const sorted = [...eligiblePlayers].sort((a, b) => {
      if (a.matchesPlayed !== b.matchesPlayed) {
        return a.matchesPlayed - b.matchesPlayed;
      }
      return Math.random() - 0.5; // Xáo ngẫu nhiên nếu cùng số trận
    });

    const chosen = sorted.slice(0, 4).map((p) => p.memberId);
    setSelectedIds(chosen);
    setLastMatchRecorded(false);
  };

  const toggleSelectPlayer = (memberId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      }
      if (prev.length >= 4) {
        alert("Một trận cầu lông đôi chỉ chọn tối đa 4 người trên sân.");
        return prev;
      }
      return [...prev, memberId];
    });
    setLastMatchRecorded(false);
  };

  const handleFinishMatch = async () => {
    if (selectedIds.length !== 4) {
      alert("Vui lòng chọn đủ 4 người chơi trong trận trước khi ghi nhận.");
      return;
    }

    setLoading(true);
    const res = await recordMatch(sessionId, selectedIds);
    setLoading(false);

    if (res.success) {
      setLastMatchRecorded(true);
      // Tự động gợi ý trận tiếp theo
      setTimeout(() => {
        handleAutoShuffle();
      }, 500);
    } else {
      alert(res.error || "Lỗi ghi nhận trận đấu.");
    }
  };

  return (
    <div className="bg-white border border-black rounded-[24px] p-5 sm:p-6 shadow-[5px_5px_0px_#000000] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-0.5">
            Xoay Vòng Sân Đấu Tự Động
          </span>
          <h3 className="text-lg font-black uppercase text-black leading-tight flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-[#5c4ade]" />
            <span>Bốc Thăm & Sắp Trận Live</span>
          </h3>
        </div>

        <button
          type="button"
          onClick={handleAutoShuffle}
          disabled={eligiblePlayers.length < 4}
          className="px-4 py-2 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#f0c518] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-black" />
          <span>⚡ Bốc Thăm Công Bằng</span>
        </button>
      </div>

      {eligiblePlayers.length < 4 ? (
        <p className="text-xs font-semibold text-zinc-500 italic text-center py-2">
          Cần ít nhất 4 người có mặt điểm danh để bắt đầu xoay vòng trận đấu.
        </p>
      ) : (
        <>
          {/* Sân đấu mô phỏng 4 người */}
          <div className="bg-[#107c41] border-2 border-black rounded-2xl p-4 text-white relative shadow-[4px_4px_0px_#000000]">
            <div className="text-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#55db9c] bg-black/40 px-3 py-1 rounded-full border border-[#55db9c]/30">
                🏸 Sân Đang Đánh ({selectedIds.length}/4 Người)
              </span>
            </div>

            {selectedIds.length === 4 ? (
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-black text-center text-xs font-black">
                {/* Đội 1 */}
                <div className="space-y-2 p-2.5 bg-white/90 rounded-xl border border-black">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Đội A</span>
                  <div className="truncate">
                    {eligiblePlayers.find((p) => p.memberId === selectedIds[0])?.displayName}
                  </div>
                  <div className="truncate">
                    {eligiblePlayers.find((p) => p.memberId === selectedIds[1])?.displayName}
                  </div>
                </div>

                {/* Đội 2 */}
                <div className="space-y-2 p-2.5 bg-white/90 rounded-xl border border-black">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Đội B</span>
                  <div className="truncate">
                    {eligiblePlayers.find((p) => p.memberId === selectedIds[2])?.displayName}
                  </div>
                  <div className="truncate">
                    {eligiblePlayers.find((p) => p.memberId === selectedIds[3])?.displayName}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-white/80 py-2">
                Bấm nút <strong>&quot;⚡ Bốc Thăm Công Bằng&quot;</strong> hoặc bấm chọn 4 người bên dưới để xếp trận.
              </p>
            )}

            {isLeader && selectedIds.length === 4 && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinishMatch}
                  className="px-5 py-2.5 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#f0c518] transition-all inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>{loading ? "Đang Lưu..." : "✓ Trận Đấu Kết Thúc (Tăng Trận)"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Danh sách người chơi và số trận đã đánh */}
          <div>
            <span className="text-[10px] font-black uppercase text-zinc-500 block mb-2">
              Danh Sách Người Có Mặt (Bấm để chọn/bỏ chọn vào sân):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {eligiblePlayers.map((p) => {
                const isSelected = selectedIds.includes(p.memberId);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSelectPlayer(p.memberId)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? "bg-[#e9ccff] border-black shadow-[2px_2px_0px_#000000]"
                        : "bg-[#f8fafc] border-black/20 hover:border-black"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-black text-black block truncate">
                        {p.displayName}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-500">
                        Đã đánh: <strong className="text-black">{p.matchesPlayed}</strong> trận
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center">
                          ✓
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-black/30 block" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
