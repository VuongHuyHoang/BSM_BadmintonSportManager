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
