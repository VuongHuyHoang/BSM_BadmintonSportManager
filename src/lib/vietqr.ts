/**
 * Helper sinh link ảnh VietQR Napas247 QuickLink
 */
export interface VietQRParams {
  bankCode: string;
  accountNo: string;
  accountName?: string;
  amount: number;
  description: string;
}

export function generateVietQRUrl({
  bankCode,
  accountNo,
  accountName,
  amount,
  description,
}: VietQRParams): string {
  const cleanBank = encodeURIComponent(bankCode.trim());
  const cleanAccount = encodeURIComponent(accountNo.trim());
  const cleanDesc = encodeURIComponent(description.trim());
  const cleanName = accountName ? encodeURIComponent(accountName.trim()) : "";
  const validAmount = Math.max(0, Math.round(amount || 0));

  return `https://img.vietqr.io/image/${cleanBank}-${cleanAccount}-compact2.png?amount=${validAmount}&addInfo=${cleanDesc}${cleanName ? `&accountName=${cleanName}` : ""}`;
}
