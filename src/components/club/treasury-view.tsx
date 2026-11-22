"use client";

import { useState } from "react";
import { formatVND } from "@/lib/utils";
import { deleteTransaction } from "@/server/actions/treasury";
import { AddTransactionModal } from "@/components/club/add-transaction-modal";
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  Tag, 
  Users,
  Sparkles,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface ClubMember {
  id: string;
  displayName: string;
  membershipType: string;
}

interface TransactionItem {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  createdAt: Date;
  member?: {
    id: string;
    displayName: string;
  } | null;
}

interface TreasuryViewProps {
  clubId: string;
  transactions: TransactionItem[];
  members: ClubMember[];
  isLeader: boolean;
}

export function TreasuryView({
  clubId,
  transactions,
  members,
  isLeader,
}: TreasuryViewProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "INCOME") return t.type === "INCOME";
    if (filter === "EXPENSE") return t.type === "EXPENSE";
    return true;
  });

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) return;
    setDeletingId(transactionId);
    const res = await deleteTransaction(transactionId);
    setDeletingId(null);
    if (!res.success) {
      alert(res.error || "Lỗi khi xóa giao dịch.");
    }
  };

  const formatCategoryName = (category: string, type: string) => {
    switch (category) {
      case "MONTHLY_FUND":
        return "Quỹ Tháng";
      case "SESSION_SURPLUS":
        return "Dôi Dư Buổi Đánh";
      case "SPONSOR":
        return "Tài Trợ / Thưởng";
      case "BUY_SHUTTLE":
        return "Mua Cầu";
      case "COURT_DEPOSIT":
        return "Cọc Sân";
      case "PARTY":
        return "Liên Hoan / Nước";
      case "EQUIPMENT":
        return "Phụ Kiện Sân";
      default:
        return type === "INCOME" ? "Thu Khác" : "Chi Khác";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & KPI Cards */}
      <div className="bg-white border border-black rounded-[24px] p-6 sm:p-7 shadow-[6px_6px_0px_#000000]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#ffd731] text-black border border-black shadow-[1px_1px_0px_#000000] mb-2">
              <span>Sổ Quỹ & Tài Chính Nhóm</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black leading-tight">
              Sổ Quỹ Câu Lạc Bộ
            </h2>
            <p className="text-xs text-zinc-600 font-medium mt-1">
              Theo dõi minh bạch số dư, các khoản thu quỹ tháng và chi tiêu chung của CLB
            </p>
          </div>

          {isLeader && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-full text-xs font-black uppercase bg-[#55db9c] text-black border border-black shadow-[3px_3px_0px_#000000] hover:bg-[#43c487] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4 text-black" />
              <span>+ Thêm Thu / Chi</span>
            </button>
          )}
        </div>

        {/* 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6">
          {/* Số dư hiện tại */}
          <div className="bg-[#f1f3f6] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
              Số Dư Quỹ Hiện Tại
            </span>
            <span className={`text-2xl sm:text-3xl font-black block mt-1 tracking-tight ${
              currentBalance >= 0 ? "text-[#16a34a]" : "text-[#fb4903]"
            }`}>
              {formatVND(currentBalance)}
            </span>
            <span className="text-[10px] text-zinc-500 font-bold block mt-1">
              {currentBalance >= 0 ? "✓ Quỹ dương an toàn" : "⚡ Quỹ đang âm"}
            </span>
          </div>

          {/* Tổng thu */}
          <div className="bg-[#f0fdf4] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#16a34a]" />
              <span>Tổng Thu Vào Quỹ</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#16a34a] block mt-1 tracking-tight">
              +{formatVND(totalIncome)}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium block mt-1">
              Từ hội viên & tài trợ
            </span>
          </div>

          {/* Tổng chi */}
          <div className="bg-[#fff7ed] border border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000000]">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-[#fb4903]" />
              <span>Tổng Chi Tiêu Nhóm</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#fb4903] block mt-1 tracking-tight">
              -{formatVND(totalExpense)}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium block mt-1">
              Mua cầu, cọc sân, liên hoan
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "ALL"
                ? "bg-black text-white shadow-[2px_2px_0px_#55db9c]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Tất Cả ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("INCOME")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "INCOME"
                ? "bg-[#55db9c] text-black shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Khoản Thu (+)
          </button>
          <button
            type="button"
            onClick={() => setFilter("EXPENSE")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase border border-black transition-all ${
              filter === "EXPENSE"
                ? "bg-[#fb4903] text-white shadow-[2px_2px_0px_#000000]"
                : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Khoản Chi (-)
          </button>
        </div>
      </div>

      {/* 3. Transaction List */}
      <div className="bg-white border border-black rounded-[24px] p-5 sm:p-7 shadow-[6px_6px_0px_#000000]">
        <h3 className="text-base font-black uppercase text-black mb-4 flex items-center gap-2">
          <span>Lịch Sử Dòng Tiền Thu Chi</span>
          <span className="text-xs font-normal text-zinc-500">
            ({filteredTransactions.length} giao dịch)
          </span>
        </h3>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-black/20 rounded-2xl bg-[#f8fafc]">
            <Wallet className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
            <h4 className="text-sm font-black uppercase text-black">Chưa Có Giao Dịch Nào</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
              Thủ quỹ hoặc Trưởng nhóm có thể bấm "+ Thêm Thu / Chi" để bắt đầu ghi chép các khoản tiền quỹ tháng hoặc chi mua cầu.
            </p>
            {isLeader && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-full text-xs font-black uppercase bg-[#55db9c] text-black border border-black shadow-[2px_2px_0px_#000000]"
              >
                + Thêm Giao Dịch Đầu Tiên
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {filteredTransactions.map((t) => {
              const isIncome = t.type === "INCOME";

              return (
                <div
                  key={t.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f8fafc] px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl border border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000000] ${
                        isIncome ? "bg-[#55db9c]" : "bg-[#fb4903] text-white"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-black">
                          {t.description}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black border border-black/20 ${
                            isIncome
                              ? "bg-[#dcfce7] text-emerald-900"
                              : "bg-[#fee2e2] text-rose-900"
                          }`}
                        >
                          {formatCategoryName(t.category, t.type)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500 font-semibold flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(t.createdAt)}
                        </span>
                        {t.member && (
                          <span className="flex items-center gap-1 text-black font-bold">
                            <Users className="w-3 h-3 text-zinc-500" />
                            {t.member.displayName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                    <span
                      className={`text-base sm:text-lg font-black tracking-tight ${
                        isIncome ? "text-[#16a34a]" : "text-[#fb4903]"
                      }`}
                    >
                      {isIncome ? "+" : "-"}{formatVND(t.amount)}
                    </span>

                    {isLeader && (
                      <button
                        type="button"
                        disabled={deletingId === t.id}
                        onClick={() => handleDelete(t.id)}
                        className="text-zinc-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Xóa giao dịch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thêm Thu/Chi */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        clubId={clubId}
        members={members}
      />
    </div>
  );
}
