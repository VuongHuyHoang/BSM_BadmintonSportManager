"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { roundFee } from "@/lib/utils";

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
  const maxAttendees = parseInt((formData.get("maxAttendees") as string) || "0", 10);

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
        maxAttendees: isNaN(maxAttendees) ? 0 : Math.max(0, maxAttendees),
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
        // Tự động nạp sẵn hội viên cố định (FULL_MONTHLY & COURT_ONLY_MONTHLY) với isCheckedIn = false, status = CONFIRMED
        attendances: {
          create: club.members.map((m) => ({
            memberId: m.id,
            isCheckedIn: false,
            attendanceStatus: "CONFIRMED",
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

export async function editSession(sessionId: string, formData: FormData) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const badmSession = await db.badmintonSession.findUnique({
    where: { id: sessionId },
  });
  if (!badmSession) {
    return { success: false, error: "Không tìm thấy buổi đánh." };
  }

  const isLeader = await checkLeaderRole(badmSession.clubId, sessionUser.user.id);
  if (!isLeader) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền chỉnh sửa buổi đánh." };
  }

  const courtName = (formData.get("courtName") as string)?.trim() || badmSession.courtName;
  const startTimeStr = formData.get("startTime") as string;
  const durationHours = parseFloat((formData.get("durationHours") as string) || "2");
  const courtFee = parseInt((formData.get("courtFee") as string) || String(badmSession.courtFee), 10);
  const otherFee = parseInt((formData.get("otherFee") as string) || String(badmSession.otherFee), 10);
  const maxAttendeesStr = formData.get("maxAttendees") as string;
  const maxAttendees = maxAttendeesStr !== null ? parseInt(maxAttendeesStr, 10) : badmSession.maxAttendees;

  let startTime = badmSession.startTime;
  let endTime = badmSession.endTime;
  if (startTimeStr) {
    startTime = new Date(startTimeStr);
    endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
  }

  try {
    await db.badmintonSession.update({
      where: { id: sessionId },
      data: {
        courtName,
        startTime,
        endTime,
        courtFee: isNaN(courtFee) ? badmSession.courtFee : Math.max(0, courtFee),
        otherFee: isNaN(otherFee) ? badmSession.otherFee : Math.max(0, otherFee),
        maxAttendees: isNaN(maxAttendees) ? badmSession.maxAttendees : Math.max(0, maxAttendees),
      },
    });

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/clubs/${badmSession.clubId}`);
    return { success: true };
  } catch (error) {
    console.error("Edit session error:", error);
    return { success: false, error: "Lỗi cập nhật thông tin buổi đánh." };
  }
}

export async function deleteSession(sessionId: string) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const badmSession = await db.badmintonSession.findUnique({
    where: { id: sessionId },
    include: {
      attendances: true,
    },
  });
  if (!badmSession) {
    return { success: false, error: "Không tìm thấy buổi đánh." };
  }

  const isLeader = await checkLeaderRole(badmSession.clubId, sessionUser.user.id);
  if (!isLeader) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền xóa buổi đánh." };
  }

  // An toàn dữ liệu tài chính: Không cho xóa nếu đã có thành viên thanh toán PAID
  const hasPaid = badmSession.attendances.some((a) => a.paymentStatus === "PAID");
  if (hasPaid) {
    return {
      success: false,
      error: "Không thể xóa buổi đánh đã có thành viên thanh toán tiền. Hãy chuyển trạng thái sang Đã Hủy nếu cần.",
    };
  }

  try {
    // Xóa transaction liên quan nếu có
    await db.transaction.deleteMany({
      where: { sessionId },
    });

    // Xóa buổi đánh (các bảng phụ thuộc có onDelete: Cascade)
    await db.badmintonSession.delete({
      where: { id: sessionId },
    });

    revalidatePath(`/clubs/${badmSession.clubId}`);
    revalidatePath("/dashboard");
    return { success: true, clubId: badmSession.clubId };
  } catch (error) {
    console.error("Delete session error:", error);
    return { success: false, error: "Lỗi khi xóa buổi đánh." };
  }
}

// Helper kiểm tra quyền Admin hoặc Treasurer trong CLB
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

export async function toggleCheckIn(
  sessionId: string,
  memberId: string,
  newCheckInStatus: boolean,
  checkInBy: "SELF" | "TREASURER" = "TREASURER"
) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  try {
    const attendance = await db.sessionAttendance.findUnique({
      where: {
        sessionId_memberId: { sessionId, memberId },
      },
      include: {
        member: true,
        session: true,
      },
    });

    if (!attendance) {
      return { success: false, error: "Không tìm thấy dữ liệu điểm danh." };
    }

    if (attendance.session.status === "COMPLETED") {
      return { success: false, error: "Buổi đánh đã kết thúc và chốt sổ, không thể thay đổi điểm danh." };
    }

    if (checkInBy === "SELF") {
      // Tự điểm danh: chỉ được thao tác trên tài khoản của chính mình
      if (attendance.member.userId !== sessionUser.user.id) {
        return { success: false, error: "Bạn chỉ có thể tự điểm danh cho tài khoản của chính mình." };
      }
    } else {
      // Thủ quỹ / Admin điểm danh hộ: phải có vai trò Leader
      const isLeader = await checkLeaderRole(attendance.session.clubId, sessionUser.user.id);
      if (!isLeader) {
        return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền điểm danh hộ." };
      }
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
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Toggle check-in error:", error);
    return { success: false, error: "Lỗi cập nhật điểm danh." };
  }
}

export async function addMemberToSession(sessionId: string, memberId: string) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  try {
    const badmSession = await db.badmintonSession.findUnique({ where: { id: sessionId } });
    if (!badmSession) {
      return { success: false, error: "Không tìm thấy buổi đánh." };
    }

    if (badmSession.status === "COMPLETED") {
      return { success: false, error: "Buổi đánh đã kết thúc và chốt sổ, không thể thêm hội viên mới." };
    }

    const isLeader = await checkLeaderRole(badmSession.clubId, sessionUser.user.id);
    if (!isLeader) {
      return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền thêm hội viên vào buổi đánh." };
    }

    const existing = await db.sessionAttendance.findUnique({
      where: {
        sessionId_memberId: { sessionId, memberId },
      },
    });

    // Kiểm tra slot còn trống không
    const confirmedCount = await db.sessionAttendance.count({
      where: { sessionId, attendanceStatus: "CONFIRMED" },
    });
    const targetStatus = (badmSession.maxAttendees > 0 && confirmedCount >= badmSession.maxAttendees)
      ? "WAITLIST"
      : "CONFIRMED";

    if (existing) {
      await db.sessionAttendance.update({
        where: { id: existing.id },
        data: {
          attendanceStatus: targetStatus,
          isCheckedIn: targetStatus === "CONFIRMED",
          checkInBy: "TREASURER",
        },
      });
    } else {
      const member = await db.member.findUnique({ where: { id: memberId } });
      await db.sessionAttendance.create({
        data: {
          sessionId,
          memberId,
          attendanceStatus: targetStatus,
          isCheckedIn: targetStatus === "CONFIRMED",
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

// Chức năng cho phép thành viên tự đăng ký tham gia buổi đánh (hỗ trợ Waitlist)
export async function joinSession(sessionId: string) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập để tham gia buổi đánh." };
  }

  const currentUserId = sessionUser.user.id;

  try {
    const badmSession = await db.badmintonSession.findUnique({
      where: { id: sessionId },
      include: { club: { include: { members: true } } },
    });

    if (!badmSession) {
      return { success: false, error: "Không tìm thấy buổi đánh." };
    }

    if (badmSession.status === "COMPLETED") {
      return { success: false, error: "Buổi đánh đã kết thúc, không thể đăng ký tham gia." };
    }

    // Kiểm tra user có là thành viên hoạt động trong CLB này không
    const member = badmSession.club.members.find(
      (m) => m.userId === currentUserId && m.isActive
    );

    if (!member) {
      return { success: false, error: "Bạn chưa là thành viên của CLB này." };
    }

    // Kiểm tra số slot đã CONFIRMED
    const confirmedCount = await db.sessionAttendance.count({
      where: { sessionId, attendanceStatus: "CONFIRMED" },
    });
    const isFull = badmSession.maxAttendees > 0 && confirmedCount >= badmSession.maxAttendees;
    const targetStatus = isFull ? "WAITLIST" : "CONFIRMED";

    const existing = await db.sessionAttendance.findUnique({
      where: {
        sessionId_memberId: { sessionId, memberId: member.id },
      },
    });

    if (existing) {
      await db.sessionAttendance.update({
        where: { id: existing.id },
        data: {
          attendanceStatus: targetStatus,
          isCheckedIn: targetStatus === "CONFIRMED",
          checkInBy: "SELF",
        },
      });
    } else {
      await db.sessionAttendance.create({
        data: {
          sessionId,
          memberId: member.id,
          attendanceStatus: targetStatus,
          isCheckedIn: targetStatus === "CONFIRMED",
          checkInBy: "SELF",
          paymentStatus: member.membershipType === "FULL_MONTHLY" ? "COVERED_BY_SUBSCRIPTION" : "UNPAID",
        },
      });
    }

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { 
      success: true, 
      status: targetStatus,
      message: targetStatus === "WAITLIST" 
        ? "Buổi đánh đã đủ số lượng, bạn đã được xếp vào Danh Sách Chờ (Dự Bị)!" 
        : "Đăng ký tham gia thành công!" 
    };
  } catch (error) {
    console.error("Join session error:", error);
    return { success: false, error: "Lỗi khi đăng ký tham gia buổi đánh." };
  }
}

// Chức năng rời buổi đánh hoặc Leader xóa người khỏi buổi (Tự động đôn người từ Waitlist lên)
export async function leaveSession(sessionId: string, targetMemberId?: string) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const currentUserId = sessionUser.user.id;

  try {
    const badmSession = await db.badmintonSession.findUnique({
      where: { id: sessionId },
      include: { club: { include: { members: true } } },
    });

    if (!badmSession) {
      return { success: false, error: "Không tìm thấy buổi đánh." };
    }

    if (badmSession.status === "COMPLETED") {
      return { success: false, error: "Buổi đánh đã kết thúc và chốt sổ, không thể rời buổi đánh." };
    }

    const currentMember = badmSession.club.members.find((m) => m.userId === currentUserId);
    const isLeader = currentMember?.role === "ADMIN" || currentMember?.role === "TREASURER";

    // Xác định memberId cần xóa: nếu là Leader truyền targetMemberId thì xóa người đó, ngược lại xóa chính mình
    const memberIdToDelete = (isLeader && targetMemberId) ? targetMemberId : currentMember?.id;
    if (!memberIdToDelete) {
      return { success: false, error: "Không tìm thấy hội viên cần rời buổi." };
    }

    const attendance = await db.sessionAttendance.findUnique({
      where: { sessionId_memberId: { sessionId, memberId: memberIdToDelete } },
    });

    if (!attendance) {
      return { success: false, error: "Hội viên chưa tham gia buổi đánh này." };
    }

    if (attendance.paymentStatus === "PAID") {
      return { success: false, error: "Không thể rời buổi đánh khi đã thanh toán tiền." };
    }

    const wasConfirmed = attendance.attendanceStatus === "CONFIRMED";

    // Xóa điểm danh
    await db.sessionAttendance.delete({
      where: { id: attendance.id },
    });

    // Nếu người vừa rời ở vị trí CONFIRMED, tự động đôn người đầu tiên trong WAITLIST lên
    if (wasConfirmed) {
      const firstWaitlist = await db.sessionAttendance.findFirst({
        where: { sessionId, attendanceStatus: "WAITLIST" },
        orderBy: { id: "asc" },
      });

      if (firstWaitlist) {
        await db.sessionAttendance.update({
          where: { id: firstWaitlist.id },
          data: {
            attendanceStatus: "CONFIRMED",
            isCheckedIn: true,
          },
        });
      }
    }

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Leave session error:", error);
    return { success: false, error: "Lỗi khi rời buổi đánh." };
  }
}

export async function addQuickGuestToSession(
  sessionId: string,
  clubId: string,
  displayName: string,
  phone?: string,
  sponsorMemberId?: string
) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const isLeader = await checkLeaderRole(clubId, sessionUser.user.id);
  if (!isLeader) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền thêm khách vãng lai." };
  }

  try {
    const badmSession = await db.badmintonSession.findUnique({
      where: { id: sessionId },
    });
    if (!badmSession) {
      return { success: false, error: "Không tìm thấy buổi đánh." };
    }
    if (badmSession.status === "COMPLETED") {
      return { success: false, error: "Buổi đánh đã kết thúc và chốt sổ, không thể thêm khách vãng lai." };
    }

    // 1. Tạo Member loại GUEST trong CLB kèm người bảo lãnh nếu có
    const guestMember = await db.member.create({
      data: {
        clubId,
        displayName: displayName.trim(),
        phone: phone?.trim() || null,
        sponsorMemberId: sponsorMemberId || null,
        role: "MEMBER",
        membershipType: "GUEST",
        isActive: true,
      },
    });

    // 2. Thêm ngay vào buổi đánh với isCheckedIn = true, attendanceStatus = CONFIRMED
    await db.sessionAttendance.create({
      data: {
        sessionId,
        memberId: guestMember.id,
        attendanceStatus: "CONFIRMED",
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
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  try {
    const badmSession = await db.badmintonSession.findUnique({
      where: { id: sessionId },
      include: { club: true },
    });

    if (!badmSession) {
      return { success: false, error: "Không tìm thấy buổi đánh." };
    }

    if (badmSession.status === "COMPLETED") {
      return { success: false, error: "Buổi đánh đã kết thúc và chốt số liệu. Không thể điều chỉnh số lượng cầu. Nếu cần sửa, hãy mở lại buổi đánh." };
    }

    const isLeader = await checkLeaderRole(badmSession.clubId, sessionUser.user.id);
    if (!isLeader) {
      return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền cập nhật số quả cầu." };
    }

    let log = await db.shuttleLog.findFirst({
      where: { sessionId },
    });

    if (!log) {
      log = await db.shuttleLog.create({
        data: {
          sessionId,
          brand: "Tiêu chuẩn CLB",
          quantity: 0,
          unitPrice: badmSession.club.defaultShuttlePrice || 25000,
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
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  try {
    const badmSession = await db.badmintonSession.findUnique({ where: { id: sessionId } });
    if (!badmSession) {
      return { success: false, error: "Không tìm thấy buổi đánh." };
    }

    if (badmSession.status === "COMPLETED") {
      return { success: false, error: "Buổi đánh đã kết thúc và chốt số liệu. Không thể điều chỉnh số lượng cầu. Nếu cần sửa, hãy mở lại buổi đánh." };
    }

    if (badmSession.status === "COMPLETED") {
      return { success: false, error: "Buổi đánh đã kết thúc và chốt số liệu. Không thể điều chỉnh phụ phí chung." };
    }

    const isLeader = await checkLeaderRole(badmSession.clubId, sessionUser.user.id);
    if (!isLeader) {
      return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền cập nhật phụ phí chung." };
    }

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
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  try {
    const badmSession = await db.badmintonSession.findUnique({ where: { id: sessionId } });
    if (!badmSession) {
      return { success: false, error: "Không tìm thấy buổi đánh." };
    }

    if (badmSession.status === "COMPLETED") {
      return { success: false, error: "Buổi đánh đã kết thúc và chốt số liệu. Không thể điều chỉnh số lượng cầu. Nếu cần sửa, hãy mở lại buổi đánh." };
    }

    const isLeader = await checkLeaderRole(badmSession.clubId, sessionUser.user.id);
    if (!isLeader) {
      return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền thay đổi trạng thái buổi đánh." };
    }

    const previousStatus = badmSession.status;
    await db.badmintonSession.update({
      where: { id: sessionId },
      data: { status: newStatus },
    });

    // 1. Nếu buổi đánh chuyển từ COMPLETED sang trạng thái khác (mở lại buổi đánh) -> Tự động hoàn trả tồn kho cầu
    if (previousStatus === "COMPLETED" && newStatus !== "COMPLETED") {
      const shuttleLog = await db.shuttleLog.findFirst({
        where: { sessionId },
      });
      if (shuttleLog && shuttleLog.quantity > 0) {
        await db.club.update({
          where: { id: badmSession.clubId },
          data: {
            shuttleStock: { increment: shuttleLog.quantity },
          },
        });
      }
    }

    // 2. Nếu buổi đánh chuyển sang COMPLETED lần đầu hoặc từ trạng thái khác sang, tự động trừ số lượng quả cầu đã tiêu thụ vào kho CLB
    if (newStatus === "COMPLETED" && previousStatus !== "COMPLETED") {
      const shuttleLog = await db.shuttleLog.findFirst({
        where: { sessionId },
      });
      if (shuttleLog && shuttleLog.quantity > 0) {
        await db.club.update({
          where: { id: badmSession.clubId },
          data: {
            shuttleStock: { decrement: shuttleLog.quantity },
          },
        });
      }
    }

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/clubs/${badmSession.clubId}`);
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

  if (existing.status === "COMPLETED") {
    return { success: false, error: "Buổi đánh đã kết thúc, không thể gia hạn thêm giờ." };
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

export async function addExtraItemToAttendance(
  attendanceId: string,
  itemName: string,
  quantity: number = 1,
  unitPrice: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const attendance = await db.sessionAttendance.findUnique({
    where: { id: attendanceId },
    include: {
      session: {
        include: {
          club: { include: { members: true } },
        },
      },
      extraItems: true,
    },
  });

  if (!attendance) {
    return { success: false, error: "Không tìm thấy thông tin người tham gia." };
  }

  if (attendance.session.status === "COMPLETED") {
    return { success: false, error: "Buổi đánh đã kết thúc và chốt số liệu. Không thể thêm phụ phí riêng." };
  }

  // Check leader role
  const actor = attendance.session.club.members.find((m) => m.userId === session.user?.id);
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "TREASURER")) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền ghi phụ phí riêng." };
  }

  const cleanName = itemName.trim();
  const validQty = Math.max(1, quantity);
  const validPrice = Math.max(0, unitPrice);

  try {
    // Kiểm tra xem sản phẩm có tên giống nhau (không phân biệt hoa thường) đã tồn tại chưa
    const existing = attendance.extraItems.find(
      (item) => item.itemName.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (existing) {
      // Gộp vào bản ghi đã có và x số lượng
      const newQty = existing.quantity + validQty;
      const newTotal = newQty * existing.unitPrice;
      await db.attendanceExtraItem.update({
        where: { id: existing.id },
        data: {
          quantity: newQty,
          totalPrice: newTotal,
        },
      });
    } else {
      await db.attendanceExtraItem.create({
        data: {
          attendanceId,
          itemName: cleanName,
          quantity: validQty,
          unitPrice: validPrice,
          totalPrice: validQty * validPrice,
        },
      });
    }

    // Cập nhật lại extraFeeShare trong sessionAttendance
    const allItems = await db.attendanceExtraItem.findMany({
      where: { attendanceId },
    });
    const newTotalExtra = allItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

    await db.sessionAttendance.update({
      where: { id: attendanceId },
      data: { extraFeeShare: newTotalExtra },
    });

    revalidatePath(`/sessions/${attendance.sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Add extra item error:", error);
    return { success: false, error: "Lỗi khi thêm phụ phí riêng." };
  }
}

export async function updateExtraItemQuantity(itemId: string, delta: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const item = await db.attendanceExtraItem.findUnique({
    where: { id: itemId },
    include: {
      attendance: {
        include: {
          session: {
            include: {
              club: { include: { members: true } },
            },
          },
        },
      },
    },
  });

  if (!item) {
    return { success: false, error: "Không tìm thấy mục phụ phí." };
  }

  if (item.attendance.session.status === "COMPLETED") {
    return { success: false, error: "Buổi đánh đã kết thúc và chốt số liệu. Không thể thay đổi phụ phí." };
  }

  const actor = item.attendance.session.club.members.find((m) => m.userId === session.user?.id);
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "TREASURER")) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền chỉnh sửa." };
  }

  const attendanceId = item.attendanceId;
  const sessionId = item.attendance.sessionId;
  const newQty = item.quantity + delta;

  try {
    if (newQty <= 0) {
      await db.attendanceExtraItem.delete({
        where: { id: itemId },
      });
    } else {
      await db.attendanceExtraItem.update({
        where: { id: itemId },
        data: {
          quantity: newQty,
          totalPrice: newQty * item.unitPrice,
        },
      });
    }

    // Recalculate
    const allItems = await db.attendanceExtraItem.findMany({
      where: { attendanceId },
    });
    const newTotalExtra = allItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

    await db.sessionAttendance.update({
      where: { id: attendanceId },
      data: { extraFeeShare: newTotalExtra },
    });

    revalidatePath(`/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Update extra item quantity error:", error);
    return { success: false, error: "Lỗi khi thay đổi số lượng." };
  }
}

export async function removeExtraItemFromAttendance(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const item = await db.attendanceExtraItem.findUnique({
    where: { id: itemId },
    include: {
      attendance: {
        include: {
          session: {
            include: {
              club: { include: { members: true } },
            },
          },
        },
      },
    },
  });

  if (!item) {
    return { success: false, error: "Không tìm thấy mục phụ phí." };
  }

  if (item.attendance.session.status === "COMPLETED") {
    return { success: false, error: "Buổi đánh đã kết thúc và chốt số liệu. Không thể thay đổi phụ phí." };
  }

  const actor = item.attendance.session.club.members.find((m) => m.userId === session.user?.id);
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "TREASURER")) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền xóa phụ phí." };
  }

  const attendanceId = item.attendanceId;
  const sessionId = item.attendance.sessionId;

  try {
    await db.attendanceExtraItem.delete({
      where: { id: itemId },
    });

    // Recalculate
    const allItems = await db.attendanceExtraItem.findMany({
      where: { attendanceId },
    });
    const newTotalExtra = allItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

    await db.sessionAttendance.update({
      where: { id: attendanceId },
      data: { extraFeeShare: newTotalExtra },
    });

    revalidatePath(`/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Remove extra item error:", error);
    return { success: false, error: "Lỗi khi xóa phụ phí." };
  }
}

export async function calculateAndSaveSessionFees(
  sessionId: string,
  guestFixedFee?: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const badmSession = await db.badmintonSession.findUnique({
    where: { id: sessionId },
    include: {
      club: {
        include: { members: true },
      },
      shuttleLogs: true,
      attendances: {
        include: {
          member: true,
          extraItems: true,
        },
      },
    },
  });

  if (!badmSession) {
    return { success: false, error: "Không tìm thấy buổi đánh." };
  }

  // Check role: Leader
  const actor = badmSession.club.members.find((m) => m.userId === session.user?.id);
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "TREASURER")) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền chốt chia tiền." };
  }

  const clubRounding = (badmSession.club.roundingMode as "CEIL_1K" | "CEIL_5K") || "CEIL_1K";

  // Lọc những người có mặt thực tế
  const checkedInAttendances = badmSession.attendances.filter((a) => a.isCheckedIn);
  const totalPresent = checkedInAttendances.length;

  if (totalPresent === 0) {
    return { success: false, error: "Buổi đánh chưa có ai điểm danh có mặt để chia tiền." };
  }

  // Tổng tiền cầu
  const shuttleLog = badmSession.shuttleLogs[0] || { quantity: 0, unitPrice: badmSession.club.defaultShuttlePrice, totalAmount: 0 };
  const totalShuttleCost = shuttleLog.totalAmount;
  const courtFee = badmSession.courtFee;
  const otherSharedFee = badmSession.otherFee;

  // Tính các phần chia cơ bản
  const rawShuttleShare = totalShuttleCost / totalPresent;
  const rawSharedExtraShare = otherSharedFee / totalPresent;
  const rawCourtShare = courtFee / totalPresent;

  // Chuẩn bị danh sách cập nhật đồng thời trong transaction
  let totalBilled = 0;
  let totalPersonalExtraAll = 0;

  const updateOperations = badmSession.attendances.map((attendance) => {
    // Nếu vắng mặt:
    if (!attendance.isCheckedIn) {
      return db.sessionAttendance.update({
        where: { id: attendance.id },
        data: {
          courtFeeShare: 0,
          shuttleFeeShare: 0,
          extraFeeShare: 0,
          totalAmount: 0,
          paymentStatus: "COVERED_BY_SUBSCRIPTION",
        },
      });
    }

    // Tính phụ phí riêng (nước, quấn cán, tất...)
    const personalExtra = attendance.extraItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    totalPersonalExtraAll += personalExtra;
    const membershipType = attendance.member.membershipType;

    let courtFeeShare = 0;
    let shuttleFeeShare = 0;
    let extraFeeShare = personalExtra;
    let totalAmount = 0;

    if (membershipType === "FULL_MONTHLY") {
      // Gói tháng trọn gói: sân = 0, cầu = 0, chỉ chịu phụ phí riêng
      courtFeeShare = 0;
      shuttleFeeShare = 0;
      extraFeeShare = personalExtra;
      totalAmount = personalExtra;
    } else if (membershipType === "COURT_ONLY_MONTHLY") {
      // Gói tháng chỉ sân: sân = 0, cầu chia đều + phụ phí chung chia đều + phụ phí riêng
      courtFeeShare = 0;
      shuttleFeeShare = roundFee(rawShuttleShare, clubRounding);
      const sharedExtraRounded = roundFee(rawSharedExtraShare, clubRounding);
      extraFeeShare = sharedExtraRounded + personalExtra;
      totalAmount = roundFee(shuttleFeeShare + extraFeeShare, clubRounding);
    } else {
      // Đóng theo buổi hoặc Khách vãng lai (PAY_PER_SESSION / GUEST)
      if (guestFixedFee && guestFixedFee > 0 && (membershipType === "GUEST" || membershipType === "PAY_PER_SESSION")) {
        // Áp dụng giá cố định cho khách
        courtFeeShare = guestFixedFee;
        shuttleFeeShare = 0;
        extraFeeShare = personalExtra;
        totalAmount = guestFixedFee + personalExtra;
      } else {
        // Chia đều chuẩn
        courtFeeShare = roundFee(rawCourtShare, clubRounding);
        shuttleFeeShare = roundFee(rawShuttleShare, clubRounding);
        const sharedExtraRounded = roundFee(rawSharedExtraShare, clubRounding);
        extraFeeShare = sharedExtraRounded + personalExtra;
        totalAmount = roundFee(courtFeeShare + shuttleFeeShare + extraFeeShare, clubRounding);
      }
    }

    totalBilled += totalAmount;

    // Trạng thái thanh toán: nếu người này đã nộp tiền (PAID), giữ nguyên trạng thái PAID và thông tin đối soát
    let newPaymentStatus = attendance.paymentStatus;
    if (attendance.paymentStatus === "PAID") {
      newPaymentStatus = "PAID";
    } else if (totalAmount === 0) {
      newPaymentStatus = "COVERED_BY_SUBSCRIPTION";
    } else if (attendance.paymentStatus === "COVERED_BY_SUBSCRIPTION") {
      newPaymentStatus = "UNPAID";
    }

    return db.sessionAttendance.update({
      where: { id: attendance.id },
      data: {
        courtFeeShare,
        shuttleFeeShare,
        extraFeeShare,
        totalAmount,
        paymentStatus: newPaymentStatus,
        paidAt: attendance.paymentStatus === "PAID" ? attendance.paidAt : undefined,
        confirmedBy: attendance.paymentStatus === "PAID" ? attendance.confirmedBy : undefined,
      },
    });
  });

  // Thực thi toàn bộ trong atomic transaction
  await db.$transaction(updateOperations);

  // Tự động hạch toán tiền dôi dư vào Sổ Quỹ (Auto Surplus Accrual)
  // Tổng chi phí thực tế phát sinh của buổi đánh
  const actualCost = courtFee + totalShuttleCost + otherSharedFee + totalPersonalExtraAll;
  const surplus = totalBilled - actualCost;

  if (surplus > 0) {
    try {
      const existingTx = await db.transaction.findFirst({
        where: {
          sessionId,
          category: "SESSION_FEE",
        },
      });

      if (existingTx) {
        await db.transaction.update({
          where: { id: existingTx.id },
          data: {
            amount: surplus,
            description: `Dôi dư làm tròn buổi đánh ${badmSession.courtName}`,
          },
        });
      } else {
        await db.transaction.create({
          data: {
            clubId: badmSession.clubId,
            sessionId,
            type: "INCOME",
            category: "SESSION_FEE",
            amount: surplus,
            description: `Dôi dư làm tròn buổi đánh ${badmSession.courtName}`,
          },
        });
      }
    } catch (txErr) {
      console.warn("Auto surplus transaction error (non-fatal):", txErr);
    }
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/split`);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true };
}

export async function togglePaymentStatus(
  attendanceId: string,
  newStatus: "PAID" | "UNPAID"
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const attendance = await db.sessionAttendance.findUnique({
    where: { id: attendanceId },
    include: {
      session: {
        include: {
          club: { include: { members: true } },
        },
      },
    },
  });

  if (!attendance) {
    return { success: false, error: "Không tìm thấy thông tin điểm danh." };
  }

  const actor = attendance.session.club.members.find((m) => m.userId === session.user?.id);
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "TREASURER")) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền xác nhận tiền." };
  }

  try {
    await db.sessionAttendance.update({
      where: { id: attendanceId },
      data: {
        paymentStatus: newStatus,
        paidAt: newStatus === "PAID" ? new Date() : null,
        confirmedBy: newStatus === "PAID" ? session.user.id : null,
      },
    });

    revalidatePath(`/sessions/${attendance.sessionId}`);
    revalidatePath(`/sessions/${attendance.sessionId}/split`);
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Toggle payment status error:", error);
    return { success: false, error: "Lỗi cập nhật trạng thái thanh toán." };
  }
}

// Gạch nợ toàn bộ các buổi đánh cho 1 hội viên (Thanh toán gộp / Batch Settlement)
export async function settleAllDebtsForMember(clubId: string, memberId: string) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const isLeader = await checkLeaderRole(clubId, sessionUser.user.id);
  if (!isLeader) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền gạch nợ." };
  }

  try {
    // Tìm tất cả các buổi đánh có attendance chưa thanh toán của member này trong CLB
    const unpaidAttendances = await db.sessionAttendance.findMany({
      where: {
        memberId,
        paymentStatus: "UNPAID",
        session: { clubId },
      },
      select: { id: true, sessionId: true },
    });

    if (unpaidAttendances.length === 0) {
      return { success: false, error: "Thành viên này không còn khoản nợ nào chưa thanh toán." };
    }

    const attendanceIds = unpaidAttendances.map((a) => a.id);
    const now = new Date();
    const currentUserId = sessionUser.user.id;

    await db.$transaction(
      attendanceIds.map((id) =>
        db.sessionAttendance.update({
          where: { id },
          data: {
            paymentStatus: "PAID",
            paidAt: now,
            confirmedBy: currentUserId,
          },
        })
      )
    );

    revalidatePath(`/clubs/${clubId}`);
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true, count: attendanceIds.length };
  } catch (error) {
    console.error("Settle all debts error:", error);
    return { success: false, error: "Lỗi khi gạch nợ toàn bộ các buổi đánh." };
  }
}

// Ghi nhận trận đấu tại sân (Court Matchmaker / Queue Rotation)
export async function recordMatch(sessionId: string, playerMemberIds: string[]) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  if (!playerMemberIds || playerMemberIds.length === 0) {
    return { success: false, error: "Vui lòng chọn danh sách người chơi trong trận." };
  }

  try {
    const badmSession = await db.badmintonSession.findUnique({
      where: { id: sessionId },
    });
    if (!badmSession) {
      return { success: false, error: "Không tìm thấy buổi đánh." };
    }

    if (badmSession.status === "COMPLETED") {
      return { success: false, error: "Buổi đánh đã kết thúc và chốt số liệu. Không thể điều chỉnh số lượng cầu. Nếu cần sửa, hãy mở lại buổi đánh." };
    }

    // Tăng matchesPlayed cho những thành viên tham gia trận
    await db.$transaction(
      playerMemberIds.map((memberId) =>
        db.sessionAttendance.updateMany({
          where: { sessionId, memberId },
          data: {
            matchesPlayed: { increment: 1 },
          },
        })
      )
    );

    revalidatePath(`/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Record match error:", error);
    return { success: false, error: "Lỗi ghi nhận trận đấu." };
  }
}
