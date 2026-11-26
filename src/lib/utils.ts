import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng tiền tệ VND an toàn chuẩn Việt Nam
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Làm tròn tiền tệ theo phong trào cầu lông
 */
export function roundFee(amount: number, mode: "CEIL_1K" | "CEIL_5K" | "EXACT" = "CEIL_1K"): number {
  if (mode === "CEIL_1K") {
    return Math.ceil(amount / 1000) * 1000;
  }
  if (mode === "CEIL_5K") {
    return Math.ceil(amount / 5000) * 5000;
  }
  return Math.round(amount);
}

/**
 * Xóa dấu tiếng Việt an toàn cho nội dung chuyển khoản ngân hàng
 */
export function removeVietnameseAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim();
}

/**
 * Re-export tiện ích VietQR chuẩn quốc gia
 */
export { generateVietQRUrl, type VietQRParams } from "./vietqr";
