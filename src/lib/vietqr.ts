import { removeVietnameseAccents } from "./utils";

/**
 * Tham số tạo mã QR QuickLink Napas247 chuẩn quốc gia
 */
export interface VietQRParams {
  bankCode: string;
  accountNo: string;
  accountName?: string | null;
  amount: number;
  description: string;
}

/**
 * Helper sinh link ảnh VietQR Napas247 QuickLink an toàn
 * Tự động xóa dấu tiếng Việt, giới hạn độ dài nội dung và làm tròn tiền tệ
 */
export function generateVietQRUrl({
  bankCode,
  accountNo,
  accountName,
  amount,
  description,
}: VietQRParams): string {
  const cleanBank = encodeURIComponent(bankCode.trim());
  const cleanAccount = encodeURIComponent(accountNo.trim());
  const cleanDesc = encodeURIComponent(removeVietnameseAccents(description).slice(0, 50));
  const cleanName = accountName ? encodeURIComponent(accountName.trim().toUpperCase()) : "";
  const validAmount = Math.max(0, Math.round(amount || 0));

  return `https://img.vietqr.io/image/${cleanBank}-${cleanAccount}-compact2.png?amount=${validAmount}&addInfo=${cleanDesc}${cleanName ? `&accountName=${cleanName}` : ""}`;
}
