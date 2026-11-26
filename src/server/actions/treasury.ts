"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTransaction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập để thao tác." };
  }

  const clubId = formData.get("clubId") as string;
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const category = (formData.get("category") as string) || "OTHER";
  const amountStr = formData.get("amount") as string;
  const description = (formData.get("description") as string)?.trim() || "";
  const memberId = (formData.get("memberId") as string) || null;

  if (!clubId || !type || !amountStr) {
    return { success: false, error: "Vui lòng nhập đầy đủ thông tin giao dịch." };
  }

  const amount = parseInt(amountStr.replace(/[^0-9]/g, ""), 10);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: "Số tiền không hợp lệ." };
  }

  // Quyền Trưởng nhóm hoặc Thủ quỹ
  const actor = await db.member.findFirst({
    where: {
      clubId,
      userId: session.user.id,
      role: { in: ["ADMIN", "TREASURER"] },
      isActive: true,
    },
  });

  if (!actor) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền ghi chép sổ quỹ." };
  }

  try {
    const shuttleTubesStr = formData.get("shuttleTubes") as string;
    const shuttleTubes = shuttleTubesStr ? parseInt(shuttleTubesStr, 10) : 0;

    await db.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          clubId,
          type,
          category,
          amount,
          description: description || (type === "INCOME" ? "Thu quỹ CLB" : "Chi tiêu CLB"),
          memberId: memberId || null,
        },
      });

      // Nếu là chi mua cầu và có nhập số ống, tự động tăng tồn kho CLB (1 ống = 12 quả)
      if (type === "EXPENSE" && category === "BUY_SHUTTLE" && shuttleTubes > 0) {
        await tx.club.update({
          where: { id: clubId },
          data: {
            shuttleStock: { increment: shuttleTubes * 12 },
          },
        });
      }
    });

    revalidatePath(`/clubs/${clubId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Create transaction error:", error);
    return { success: false, error: "Lỗi khi lưu giao dịch sổ quỹ." };
  }
}

export async function deleteTransaction(transactionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập để thao tác." };
  }

  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: {
      club: {
        include: { members: true },
      },
    },
  });

  if (!transaction) {
    return { success: false, error: "Không tìm thấy giao dịch." };
  }

  const actor = transaction.club.members.find((m) => m.userId === session.user?.id);
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "TREASURER")) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền xóa giao dịch." };
  }

  try {
    await db.transaction.delete({
      where: { id: transactionId },
    });

    revalidatePath(`/clubs/${transaction.clubId}`);
    return { success: true };
  } catch (error) {
    console.error("Delete transaction error:", error);
    return { success: false, error: "Lỗi khi xóa giao dịch." };
  }
}
