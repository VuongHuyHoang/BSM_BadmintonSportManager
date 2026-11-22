"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addGuestMember(clubId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  const member = await db.member.findFirst({
    where: {
      clubId,
      userId: session.user.id,
      role: { in: ["ADMIN", "TREASURER"] },
    },
  });

  if (!member) {
    return { success: false, error: "Chỉ Trưởng nhóm hoặc Thủ quỹ mới có quyền thêm khách vãng lai." };
  }

  const displayName = (formData.get("displayName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!displayName) {
    return { success: false, error: "Vui lòng nhập tên người chơi." };
  }

  try {
    await db.member.create({
      data: {
        clubId,
        displayName,
        phone: phone || null,
        role: "MEMBER",
        membershipType: "GUEST",
        isActive: true,
      },
    });

    revalidatePath(`/clubs/${clubId}`);
    return { success: true };
  } catch (error) {
    console.error("Add guest error:", error);
    return { success: false, error: "Không thể thêm khách vãng lai." };
  }
}

export async function updateMemberPackage(
  memberId: string,
  membershipType: string,
  monthlyFeeAmount?: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Chưa đăng nhập." };
  }

  const targetMember = await db.member.findUnique({
    where: { id: memberId },
  });

  if (!targetMember) {
    return { success: false, error: "Không tìm thấy hội viên." };
  }

  // Kiểm tra quyền
  const actor = await db.member.findFirst({
    where: {
      clubId: targetMember.clubId,
      userId: session.user.id,
      role: { in: ["ADMIN", "TREASURER"] },
    },
  });

  if (!actor) {
    return { success: false, error: "Bạn không có quyền thay đổi gói hội viên." };
  }

  try {
    await db.member.update({
      where: { id: memberId },
      data: {
        membershipType,
        monthlyFeeAmount: monthlyFeeAmount ?? targetMember.monthlyFeeAmount,
      },
    });

    revalidatePath(`/clubs/${targetMember.clubId}`);
    return { success: true };
  } catch (error) {
    console.error("Update package error:", error);
    return { success: false, error: "Lỗi cập nhật gói hội viên." };
  }
}

export async function updateMemberRole(memberId: string, newRole: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Chưa đăng nhập." };
  }

  const targetMember = await db.member.findUnique({
    where: { id: memberId },
  });

  if (!targetMember) {
    return { success: false, error: "Không tìm thấy hội viên." };
  }

  // Chỉ Admin mới được đổi quyền
  const adminActor = await db.member.findFirst({
    where: {
      clubId: targetMember.clubId,
      userId: session.user.id,
      role: "ADMIN",
    },
  });

  if (!adminActor) {
    return { success: false, error: "Chỉ Trưởng nhóm (Admin) mới có quyền đổi vai trò quản trị." };
  }

  try {
    await db.member.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    revalidatePath(`/clubs/${targetMember.clubId}`);
    return { success: true };
  } catch (error) {
    console.error("Update role error:", error);
    return { success: false, error: "Lỗi cập nhật vai trò hội viên." };
  }
}

export async function removeMember(memberId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Chưa đăng nhập." };
  }

  const targetMember = await db.member.findUnique({
    where: { id: memberId },
  });

  if (!targetMember) {
    return { success: false, error: "Không tìm thấy hội viên." };
  }

  // Admin hoặc Treasurer
  const actor = await db.member.findFirst({
    where: {
      clubId: targetMember.clubId,
      userId: session.user.id,
      role: "ADMIN",
    },
  });

  if (!actor) {
    return { success: false, error: "Chỉ Trưởng nhóm mới có quyền xóa hội viên khỏi CLB." };
  }

  if (targetMember.role === "ADMIN") {
    return { success: false, error: "Không thể xóa Trưởng nhóm." };
  }

  try {
    await db.member.delete({
      where: { id: memberId },
    });

    revalidatePath(`/clubs/${targetMember.clubId}`);
    return { success: true };
  } catch (error) {
    console.error("Remove member error:", error);
    return { success: false, error: "Lỗi khi xóa hội viên." };
  }
}

export async function leaveClub(clubId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập để thực hiện thao tác này." };
  }

  const member = await db.member.findFirst({
    where: {
      clubId,
      userId: session.user.id,
      isActive: true,
    },
  });

  if (!member) {
    return { success: false, error: "Bạn không phải là thành viên hoạt động trong CLB này." };
  }

  // 1. Nếu là Trưởng nhóm, phải chuyển quyền trước nếu là Admin duy nhất
  if (member.role === "ADMIN") {
    const otherAdmins = await db.member.count({
      where: {
        clubId,
        role: "ADMIN",
        isActive: true,
        id: { not: member.id },
      },
    });

    if (otherAdmins === 0) {
      return {
        success: false,
        error: "Bạn đang là Trưởng nhóm duy nhất của CLB. Vui lòng chuyển giao vai trò Trưởng nhóm cho thành viên khác trước khi rời CLB.",
      };
    }
  }

  // 2. Kiểm tra nếu đang có mặt trong buổi đánh chưa kết thúc (ONGOING hoặc SCHEDULED)
  const activeAttendance = await db.sessionAttendance.findFirst({
    where: {
      memberId: member.id,
      isCheckedIn: true,
      session: {
        status: { in: ["ONGOING", "SCHEDULED"] },
      },
    },
    include: { session: true },
  });

  if (activeAttendance) {
    return {
      success: false,
      error: `Bạn đang được điểm danh có mặt trong buổi đánh "${activeAttendance.session.courtName}" chưa kết thúc. Vui lòng đợi buổi đánh hoàn tất và thanh toán đầy đủ trước khi rời CLB.`,
    };
  }

  // 3. Kiểm tra các khoản nợ / phí chưa thanh toán ở tất cả buổi đánh
  const unpaidAttendance = await db.sessionAttendance.findFirst({
    where: {
      memberId: member.id,
      paymentStatus: "UNPAID",
    },
    include: { session: true },
  });

  if (unpaidAttendance) {
    return {
      success: false,
      error: `Bạn còn khoản tiền chưa thanh toán ở buổi đánh "${unpaidAttendance.session.courtName}". Vui lòng thanh toán toàn bộ chi phí trước khi rời CLB.`,
    };
  }

  // 4. Đủ điều kiện rời CLB -> Đặt isActive = false để bảo toàn lịch sử giao dịch & buổi đánh
  try {
    await db.member.update({
      where: { id: member.id },
      data: { isActive: false },
    });

    revalidatePath(`/clubs/${clubId}`);
    revalidatePath(`/dashboard`);
    return { success: true };
  } catch (error) {
    console.error("Leave club error:", error);
    return { success: false, error: "Lỗi hệ thống khi rời câu lạc bộ." };
  }
}
