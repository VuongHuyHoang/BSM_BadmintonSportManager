"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Helper kiểm tra quyền Leader
async function checkLeaderRole(clubId: string, userId: string): Promise<boolean> {
  const member = await db.member.findFirst({
    where: {
      clubId,
      userId,
      role: { in: ["ADMIN", "TREASURER"] },
      isActive: true,
    },
  });
  return !!member;
}

export async function createMonthlyPeriod(clubId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const isLeader = await checkLeaderRole(clubId, session.user.id);
  if (!isLeader) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền tạo đợt thu quỹ tháng." };
  }

  const month = parseInt(formData.get("month") as string, 10);
  const year = parseInt(formData.get("year") as string, 10);
  const title = (formData.get("title") as string)?.trim() || `Quỹ Cố Định Tháng ${month}/${year}`;
  const defaultFeeStr = formData.get("feeAmount") as string;
  const defaultFee = defaultFeeStr ? parseInt(defaultFeeStr, 10) : 500000;
  const dueDateStr = formData.get("dueDate") as string;
  const dueDate = dueDateStr ? new Date(dueDateStr) : null;

  if (isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2020) {
    return { success: false, error: "Tháng hoặc năm không hợp lệ." };
  }

  try {
    // Kiểm tra xem kỳ thu tháng này đã tồn tại chưa
    const existing = await db.monthlySubscriptionPeriod.findUnique({
      where: {
        clubId_month_year: { clubId, month, year },
      },
    });

    if (existing) {
      return { success: false, error: `Kỳ thu Quỹ Tháng ${month}/${year} đã tồn tại.` };
    }

    // Lấy danh sách hội viên đóng gói tháng trong CLB
    const monthlyMembers = await db.member.findMany({
      where: {
        clubId,
        isActive: true,
        membershipType: { in: ["FULL_MONTHLY", "COURT_ONLY_MONTHLY"] },
      },
    });

    const period = await db.monthlySubscriptionPeriod.create({
      data: {
        clubId,
        month,
        year,
        title,
        feeAmount: defaultFee,
        dueDate,
        payments: {
          create: monthlyMembers.map((m) => ({
            memberId: m.id,
            amount: m.monthlyFeeAmount && m.monthlyFeeAmount > 0 ? m.monthlyFeeAmount : defaultFee,
            isPaid: false,
          })),
        },
      },
    });

    revalidatePath(`/clubs/${clubId}`);
    return { success: true, periodId: period.id };
  } catch (error) {
    console.error("Create monthly period error:", error);
    return { success: false, error: "Lỗi khi tạo đợt thu quỹ tháng." };
  }
}

export async function toggleMonthlyPayment(paymentId: string, isPaid: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  try {
    const payment = await db.monthlyMemberPayment.findUnique({
      where: { id: paymentId },
      include: {
        period: {
          include: { club: { include: { members: true } } },
        },
        member: true,
      },
    });

    if (!payment) {
      return { success: false, error: "Không tìm thấy thông tin nộp quỹ." };
    }

    const isLeader = await checkLeaderRole(payment.period.clubId, session.user.id);
    if (!isLeader) {
      return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền xác nhận tiền quỹ." };
    }

    const currentUserId = session.user.id;

    // Atomic transaction: Cập nhật payment & đồng bộ Sổ Quỹ
    await db.$transaction(async (tx) => {
      await tx.monthlyMemberPayment.update({
        where: { id: paymentId },
        data: {
          isPaid,
          paidAt: isPaid ? new Date() : null,
          confirmedBy: isPaid ? currentUserId : null,
        },
      });

      const txDescription = `Thu quỹ ${payment.period.title} - ${payment.member.displayName}`;

      if (isPaid) {
        // Tự động hạch toán vào Sổ Quỹ
        await tx.transaction.create({
          data: {
            clubId: payment.period.clubId,
            memberId: payment.memberId,
            type: "INCOME",
            category: "MONTHLY_FUND",
            amount: payment.amount,
            description: txDescription,
          },
        });
      } else {
        // Hủy gạch nợ: Xóa giao dịch thu quỹ tương ứng trong Sổ Quỹ
        await tx.transaction.deleteMany({
          where: {
            clubId: payment.period.clubId,
            memberId: payment.memberId,
            category: "MONTHLY_FUND",
            description: txDescription,
          },
        });
      }
    });

    revalidatePath(`/clubs/${payment.period.clubId}`);
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Toggle monthly payment error:", error);
    return { success: false, error: "Lỗi khi cập nhật trạng thái đóng quỹ tháng." };
  }
}

export async function deleteMonthlyPeriod(periodId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  try {
    const period = await db.monthlySubscriptionPeriod.findUnique({
      where: { id: periodId },
      include: { payments: true },
    });

    if (!period) {
      return { success: false, error: "Không tìm thấy kỳ thu quỹ." };
    }

    const isLeader = await checkLeaderRole(period.clubId, session.user.id);
    if (!isLeader) {
      return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền xóa đợt thu quỹ." };
    }

    // Kiểm tra an toàn: nếu đã có người nộp tiền, cảnh báo
    const hasPaid = period.payments.some((p) => p.isPaid);
    if (hasPaid) {
      return {
        success: false,
        error: "Không thể xóa đợt thu quỹ đã có thành viên nộp tiền. Vui lòng hủy gạch nợ trước nếu muốn xóa.",
      };
    }

    await db.monthlySubscriptionPeriod.delete({
      where: { id: periodId },
    });

    revalidatePath(`/clubs/${period.clubId}`);
    return { success: true };
  } catch (error) {
    console.error("Delete monthly period error:", error);
    return { success: false, error: "Lỗi khi xóa đợt thu quỹ tháng." };
  }
}
