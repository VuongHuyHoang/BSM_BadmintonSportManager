"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createSession(clubId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập để tạo buổi đánh." };
  }

  // Quyền Admin hoặc Treasurer
  const actor = await db.member.findFirst({
    where: {
      clubId,
      userId: session.user.id,
      role: { in: ["ADMIN", "TREASURER"] },
    },
  });

  if (!actor) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền tạo buổi đánh." };
  }

  const courtName = (formData.get("courtName") as string)?.trim() || "Sân Cầu Lông";
  const startTimeStr = formData.get("startTime") as string;
  const durationHours = parseFloat((formData.get("durationHours") as string) || "2");
  const courtFee = parseInt((formData.get("courtFee") as string) || "180000", 10);
  const otherFee = parseInt((formData.get("otherFee") as string) || "0", 10);

  if (!startTimeStr) {
    return { success: false, error: "Vui lòng chọn thời gian bắt đầu." };
  }

  const startTime = new Date(startTimeStr);
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

  const club = await db.club.findUnique({
    where: { id: clubId },
    include: {
      members: {
        where: {
          isActive: true,
          membershipType: { in: ["FULL_MONTHLY", "COURT_ONLY_MONTHLY"] },
        },
      },
    },
  });

  if (!club) {
    return { success: false, error: "Không tìm thấy câu lạc bộ." };
  }

  try {
    // 1. Tạo buổi đánh
    const newSession = await db.badmintonSession.create({
      data: {
        clubId,
        courtName,
        startTime,
        endTime,
        courtFee: isNaN(courtFee) ? 0 : courtFee,
        otherFee: isNaN(otherFee) ? 0 : otherFee,
        status: "SCHEDULED",
        // Tạo sẵn 1 bản ghi đếm cầu mặc định
        shuttleLogs: {
          create: {
            brand: "Tiêu chuẩn CLB",
            quantity: 0,
            unitPrice: club.defaultShuttlePrice,
            totalAmount: 0,
          },
        },
        // Tự động nạp sẵn hội viên cố định (FULL_MONTHLY & COURT_ONLY_MONTHLY) với isCheckedIn = false
        attendances: {
          create: club.members.map((m) => ({
            memberId: m.id,
            isCheckedIn: false,
            checkInBy: "SELF",
            courtFeeShare: 0,
            shuttleFeeShare: 0,
            extraFeeShare: 0,
            totalAmount: 0,
            paymentStatus: m.membershipType === "FULL_MONTHLY" ? "COVERED_BY_SUBSCRIPTION" : "UNPAID",
          })),
        },
      },
    });

    revalidatePath(`/clubs/${clubId}`);
    return { success: true, sessionId: newSession.id };
  } catch (error) {
    console.error("Create session error:", error);
    return { success: false, error: "Lỗi khi tạo buổi đánh." };
  }
}

export async function toggleCheckIn(
  sessionId: string,
  memberId: string,
  newCheckInStatus: boolean,
  checkInBy: "SELF" | "TREASURER" = "TREASURER"
) {
  try {
    const attendance = await db.sessionAttendance.findUnique({
      where: {
        sessionId_memberId: { sessionId, memberId },
      },
    });

    if (!attendance) {
      return { success: false, error: "Không tìm thấy thông tin điểm danh." };
    }

    await db.sessionAttendance.update({
      where: {
        sessionId_memberId: { sessionId, memberId },
      },
      data: {
        isCheckedIn: newCheckInStatus,
        checkInBy,
      },
    });

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Toggle check-in error:", error);
    return { success: false, error: "Lỗi cập nhật điểm danh." };
  }
}

export async function addMemberToSession(sessionId: string, memberId: string) {
  try {
    const existing = await db.sessionAttendance.findUnique({
      where: {
        sessionId_memberId: { sessionId, memberId },
      },
    });

    if (existing) {
      await db.sessionAttendance.update({
        where: { id: existing.id },
        data: { isCheckedIn: true, checkInBy: "TREASURER" },
      });
    } else {
      const member = await db.member.findUnique({ where: { id: memberId } });
      await db.sessionAttendance.create({
        data: {
          sessionId,
          memberId,
          isCheckedIn: true,
          checkInBy: "TREASURER",
          paymentStatus: member?.membershipType === "FULL_MONTHLY" ? "COVERED_BY_SUBSCRIPTION" : "UNPAID",
        },
      });
    }

    revalidatePath(`/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Add member to session error:", error);
    return { success: false, error: "Lỗi thêm hội viên vào buổi đánh." };
  }
}

export async function addQuickGuestToSession(
  sessionId: string,
  clubId: string,
  displayName: string,
  phone?: string
) {
  try {
    // 1. Tạo Member loại GUEST trong CLB
    const guestMember = await db.member.create({
      data: {
        clubId,
        displayName: displayName.trim(),
        phone: phone?.trim() || null,
        role: "MEMBER",
        membershipType: "GUEST",
        isActive: true,
      },
    });

    // 2. Thêm ngay vào buổi đánh với isCheckedIn = true
    await db.sessionAttendance.create({
      data: {
        sessionId,
        memberId: guestMember.id,
        isCheckedIn: true,
        checkInBy: "TREASURER",
        paymentStatus: "UNPAID",
      },
    });

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/clubs/${clubId}`);
    return { success: true };
  } catch (error) {
    console.error("Add quick guest to session error:", error);
    return { success: false, error: "Lỗi thêm khách vãng lai." };
  }
}

export async function updateShuttleCount(sessionId: string, delta: number) {
  try {
    let log = await db.shuttleLog.findFirst({
      where: { sessionId },
    });

    if (!log) {
      const session = await db.badmintonSession.findUnique({
        where: { id: sessionId },
        include: { club: true },
      });
      log = await db.shuttleLog.create({
        data: {
          sessionId,
          brand: "Tiêu chuẩn CLB",
          quantity: 0,
          unitPrice: session?.club.defaultShuttlePrice || 25000,
          totalAmount: 0,
        },
      });
    }

    const newQty = Math.max(0, log.quantity + delta);
    const newTotal = newQty * log.unitPrice;

    await db.shuttleLog.update({
      where: { id: log.id },
      data: {
        quantity: newQty,
        totalAmount: newTotal,
      },
    });

    revalidatePath(`/sessions/${sessionId}`);
    return { success: true, newQuantity: newQty, newTotal };
  } catch (error) {
    console.error("Update shuttle count error:", error);
    return { success: false, error: "Lỗi cập nhật số quả cầu." };
  }
}

export async function updateSessionExtraFee(sessionId: string, otherFee: number) {
  try {
    await db.badmintonSession.update({
      where: { id: sessionId },
      data: {
        otherFee: Math.max(0, otherFee),
      },
    });

    revalidatePath(`/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Update extra fee error:", error);
    return { success: false, error: "Lỗi cập nhật phụ phí." };
  }
}

export async function updateSessionStatus(
  sessionId: string,
  newStatus: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED"
) {
  try {
    await db.badmintonSession.update({
      where: { id: sessionId },
      data: { status: newStatus },
    });

    revalidatePath(`/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Update session status error:", error);
    return { success: false, error: "Lỗi cập nhật trạng thái buổi đánh." };
  }
}

export async function extendSessionDuration(
  sessionId: string,
  addedHours: number,
  additionalCourtFee: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const existing = await db.badmintonSession.findUnique({
    where: { id: sessionId },
    include: {
      club: {
        include: { members: true },
      },
    },
  });

  if (!existing) {
    return { success: false, error: "Không tìm thấy buổi đánh." };
  }

  const actor = existing.club.members.find((m) => m.userId === session.user?.id);
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "TREASURER")) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền gia hạn giờ chơi." };
  }

  if (existing.hasExtendedDuration) {
    return {
      success: false,
      error: "Buổi đánh này đã được điều chỉnh giờ 1 lần trước đó. Tối đa chỉ được thay đổi 1 lần để đảm bảo minh bạch.",
    };
  }

  const newEndTime = new Date(existing.endTime.getTime() + addedHours * 60 * 60 * 1000);
  const newCourtFee = existing.courtFee + Math.max(0, additionalCourtFee);

  try {
    await db.badmintonSession.update({
      where: { id: sessionId },
      data: {
        endTime: newEndTime,
        courtFee: newCourtFee,
        hasExtendedDuration: true,
      },
    });

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/clubs/${existing.clubId}`);
    return { success: true };
  } catch (error) {
    console.error("Extend session duration error:", error);
    return { success: false, error: "Lỗi khi cập nhật thời gian đánh thêm." };
  }
}
