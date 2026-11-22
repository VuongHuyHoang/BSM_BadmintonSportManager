"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const phone = (formData.get("phone") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password || !name) {
    return { success: false, error: "Vui lòng điền đầy đủ họ tên, email và mật khẩu." };
  }

  if (password.length < 6) {
    return { success: false, error: "Mật khẩu phải có tối thiểu 6 ký tự." };
  }

  const existingUser = await db.user.findFirst({
    where: {
      OR: [
        { email },
        ...(phone ? [{ phone }] : []),
      ],
    },
  });

  if (existingUser) {
    return { success: false, error: "Email hoặc số điện thoại này đã được đăng ký." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Register error:", err);
    return { success: false, error: "Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại." };
  }
}

export async function loginWithCredentials(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string) || "";
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  if (!email || !password) {
    return { success: false, error: "Vui lòng nhập email hoặc số điện thoại và mật khẩu." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
    return { success: true };
  } catch (error: any) {
    if (error?.message?.includes("NEXT_REDIRECT") || error?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Email/Số điện thoại hoặc mật khẩu không chính xác." };
        default:
          return { success: false, error: "Đăng nhập thất bại. Vui lòng thử lại." };
      }
    }
    console.error("Login unexpected error:", error);
    return { success: false, error: "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin tài khoản." };
  }
}

export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}
