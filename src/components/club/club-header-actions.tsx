"use client";

import { useState } from "react";
import Link from "next/link";
import { EditClubModal } from "@/components/club/edit-club-modal";
import { PlusCircle, Settings, QrCode } from "lucide-react";

interface ClubHeaderActionsProps {
  club: {
    id: string;
    name: string;
    bankCode: string | null;
    bankAccountNo: string | null;
    bankAccountName: string | null;
    defaultShuttlePrice: number;
    roundingMode: string;
  };
  isLeader: boolean;
}

export function ClubHeaderActions({ club, isLeader }: ClubHeaderActionsProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  if (!isLeader) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Nút Sửa Cài Đặt CLB & VietQR */}
        <button
          type="button"
          onClick={() => setShowEditModal(true)}
          className="px-3.5 py-2.5 rounded-full text-xs font-black uppercase bg-white text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5 text-[#5c4ade]" />
          <span>Sửa VietQR & Giá Cầu</span>
        </button>

        {/* Nút Tạo Buổi Đánh Mới */}
        <Link
          href={`/clubs/${club.id}/sessions/new`}
          className="px-4 py-2.5 rounded-full text-xs font-black uppercase bg-[#ffd731] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#f3cc24] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tạo Buổi Đánh Mới</span>
        </Link>
      </div>

      {/* Modal Sửa Cài Đặt */}
      <EditClubModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        club={club}
      />
    </>
  );
}
