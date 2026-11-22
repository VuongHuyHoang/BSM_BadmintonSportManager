"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Sinh mã mời ngẫu nhiên dạng CLB-ABC12
 */
function generateInviteCode(name: string): string {
  const prefix = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4) || "CLB";
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomSuffix}`;
}

export async function createClub(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập để tạo Câu Lạc Bộ." };
  }

  const name = (formData.get("name") as string)?.trim();
  const bankCode = (formData.get("bankCode") as string)?.trim();
  const bankAccountNo = (formData.get("bankAccountNo") as string)?.trim();
  const bankAccountName = (formData.get("bankAccountName") as string)?.trim()?.toUpperCase();
  const defaultShuttlePrice = parseInt((formData.get("defaultShuttlePrice") as string) || "25000", 10);
  const roundingMode = (formData.get("roundingMode") as string) || "CEIL_1K";

  if (!name) {
    return { success: false, error: "Vui lòng nhập tên Câu Lạc Bộ." };
  }

  try {
    const inviteCode = generateInviteCode(name);

    const club = await db.club.create({
      data: {
        name,
        inviteCode,
        bankCode: bankCode || null,
        bankAccountNo: bankAccountNo || null,
        bankAccountName: bankAccountName || null,
        defaultShuttlePrice: isNaN(defaultShuttlePrice) ? 25000 : defaultShuttlePrice,
        roundingMode,
        members: {
          create: {
            userId: session.user.id,
            displayName: session.user.name || "Trưởng Nhóm",
            role: "ADMIN",
            membershipType: "FULL_MONTHLY",
            monthlyFeeAmount: 400000,
          },
        },
      },
    });

    revalidatePath("/dashboard");
    return { success: true, clubId: club.id };
  } catch (error) {
    console.error("Create club error:", error);
    return { success: false, error: "Không thể tạo Câu Lạc Bộ. Vui lòng thử lại." };
  }
}

export async function updateClubSettings(clubId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập." };
  }

  // Kiểm tra quyền Admin/Treasurer
  const member = await db.member.findFirst({
    where: {
      clubId,
      userId: session.user.id,
      role: { in: ["ADMIN", "TREASURER"] },
    },
  });

  if (!member) {
    return { success: false, error: "Bạn không có quyền chỉnh sửa cài đặt CLB này." };
  }

  const name = (formData.get("name") as string)?.trim();
  const bankCode = (formData.get("bankCode") as string)?.trim();
  const bankAccountNo = (formData.get("bankAccountNo") as string)?.trim();
  const bankAccountName = (formData.get("bankAccountName") as string)?.trim()?.toUpperCase();
  const defaultShuttlePrice = parseInt((formData.get("defaultShuttlePrice") as string) || "25000", 10);
  const roundingMode = (formData.get("roundingMode") as string) || "CEIL_1K";

  try {
    await db.club.update({
      where: { id: clubId },
      data: {
        ...(name ? { name } : {}),
        bankCode: bankCode || null,
        bankAccountNo: bankAccountNo || null,
        bankAccountName: bankAccountName || null,
        defaultShuttlePrice: isNaN(defaultShuttlePrice) ? 25000 : defaultShuttlePrice,
        roundingMode,
      },
    });

    revalidatePath(`/clubs/${clubId}`);
    return { success: true };
  } catch (error) {
    console.error("Update club error:", error);
    return { success: false, error: "Lỗi cập nhật cài đặt CLB." };
  }
}

export async function joinClubByInviteCode(inviteCode: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Bạn cần đăng nhập để tham gia CLB." };
  }

  const cleanCode = inviteCode.trim().toUpperCase();

  const club = await db.club.findUnique({
    where: { inviteCode: cleanCode },
  });

  if (!club) {
    return { success: false, error: "Mã mời không tồn tại hoặc đã hết hạn." };
  }

  // Kiểm tra đã là thành viên chưa
  const existingMember = await db.member.findFirst({
    where: {
      clubId: club.id,
      userId: session.user.id,
    },
  });

  if (existingMember) {
    return { success: true, clubId: club.id, message: "Bạn đã là thành viên của CLB này." };
  }

  try {
    await db.member.create({
      data: {
        clubId: club.id,
        userId: session.user.id,
        displayName: session.user.name || "Thành viên mới",
        role: "MEMBER",
        membershipType: "PAY_PER_SESSION", // Mặc định tự động vào là đóng theo buổi
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/clubs/${club.id}`);
    return { success: true, clubId: club.id };
  } catch (error) {
    console.error("Join club error:", error);
    return { success: false, error: "Lỗi khi gia nhập CLB." };
  }
}
