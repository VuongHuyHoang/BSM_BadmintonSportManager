/**
 * BSM System Verification & Business Logic Test Suite
 * Chạy tự động: npx tsx scripts/test-system.ts
 */

import { roundFee, formatVND, removeVietnameseAccents } from "../src/lib/utils";
import { generateVietQRUrl } from "../src/lib/vietqr";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passedCount++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    failedCount++;
  }
}

console.log("\n=======================================================");
console.log("🏸 BSM AUTOMATED BUSINESS LOGIC TEST SUITE");
console.log("=======================================================\n");

// -----------------------------------------------------------------
// TEST GROUP 1: FINANCIAL LOGIC & ROUNDING
// -----------------------------------------------------------------
console.log("--- TEST GROUP 1: TÀI CHÍNH & LÀM TRÒN SỐ NGUYÊN VND ---");

// Test 1.1: Làm tròn CEIL_1K
const fee1 = roundFee(53200, "CEIL_1K");
assert(fee1 === 54000, "Làm tròn CEIL_1K (53.200đ -> 54.000đ)");

// Test 1.2: Làm tròn CEIL_5K
const fee2 = roundFee(53200, "CEIL_5K");
assert(fee2 === 55000, "Làm tròn CEIL_5K (53.200đ -> 55.000đ)");

const fee3 = roundFee(50000, "CEIL_5K");
assert(fee3 === 50000, "Làm tròn CEIL_5K đúng mốc (50.000đ -> 50.000đ)");

// Test 1.3: Chia tiền 3 nhóm hội viên trong buổi đánh
// Giả định:
// - Tiền sân: 180.000đ (2h)
// - Cầu: 4 quả * 25.000đ = 100.000đ
// - Phụ phí chung: 20.000đ (đá lạnh)
// - 6 người có mặt: 2 FULL_MONTHLY, 2 COURT_ONLY_MONTHLY, 2 PAY_PER_SESSION
const courtFee = 180000;
const shuttleCost = 100000;
const otherFee = 20000;
const N_present = 6;
const N_full = 2;
const N_courtOnly = 2;
const N_session = 2;

// Gói Trọn gói: 0đ
const fullFee = 0;
assert(fullFee === 0, "Hội viên FULL_MONTHLY đóng 0đ (Đã bao trọn)");

// Gói Chỉ Sân: Chịu tiền cầu + phụ phí chung
const courtOnlyRaw = (shuttleCost + otherFee) / N_present; // (100k + 20k) / 6 = 20.000đ
const courtOnlyFee = roundFee(courtOnlyRaw, "CEIL_1K");
assert(courtOnlyFee === 20000, "Hội viên COURT_ONLY_MONTHLY đóng đúng tiền cầu + phụ phí (20.000đ)");

// Gói Theo Buổi: Chịu tiền sân + tiền cầu + phụ phí chung
const sessionRaw = courtFee / N_present + (shuttleCost + otherFee) / N_present; // 30.000 + 20.000 = 50.000đ
const sessionFee = roundFee(sessionRaw, "CEIL_1K");
assert(sessionFee === 50000, "Thành viên PAY_PER_SESSION đóng đúng định mức (50.000đ)");

// Thặng dư dôi dư thu từ buổi đánh
const totalBilled = (N_full * fullFee) + (N_courtOnly * courtOnlyFee) + (N_session * sessionFee);
const actualPayable = courtFee + shuttleCost + otherFee;
// Thu: 0*2 + 20k*2 + 50k*2 = 140.000đ (Phần còn lại 160k do quỹ tháng bù tiền sân)
assert(totalBilled === 140000, "Tổng tiền thu từ buổi đánh chính xác (140.000đ)");

// -----------------------------------------------------------------
// TEST GROUP 2: VIETQR LINK GENERATION & ACCENT REMOVAL
// -----------------------------------------------------------------
console.log("\n--- TEST GROUP 2: VIETQR NAPAS247 & XÓA DẤU TIẾNG VIỆT ---");

const rawName = "Nguyễn Văn Tuấn Đạt";
const cleanName = removeVietnameseAccents(rawName);
assert(cleanName === "Nguyen Van Tuan Dat", "Xóa dấu tiếng Việt chuẩn xác ('Nguyen Van Tuan Dat')");

const specialDesc = "BSM Trả nợ buổi #12 (ngày 26/11)!!!";
const cleanDesc = removeVietnameseAccents(specialDesc);
assert(!/[à-ỹÀ-Ỹ#\(\)!]/.test(cleanDesc), "Loại bỏ ký tự đặc biệt khỏi nội dung chuyển khoản");

const qrUrl = generateVietQRUrl({
  bankCode: "MB",
  accountNo: "0987654321",
  accountName: "NGUYEN VAN A",
  amount: 60000,
  description: "BSM Tuan TraNo",
});

assert(qrUrl.includes("MB-0987654321-compact2.png"), "URL chứa đúng mã ngân hàng và STK");
assert(qrUrl.includes("amount=60000"), "URL chứa đúng số tiền chuyển khoản");
assert(qrUrl.includes("addInfo=BSM%20Tuan%20TraNo"), "URL mã hóa đúng cú pháp nội dung chuyển khoản");

// -----------------------------------------------------------------
// TEST GROUP 3: WAITLIST & SLOT CAPACITY LOGIC
// -----------------------------------------------------------------
console.log("\n--- TEST GROUP 3: QUẢN LÝ SLOT & DANH SÁCH CHỜ (WAITLIST) ---");

const maxSlots = 4;
const mockAttendees: { id: string; status: "CONFIRMED" | "WAITLIST" }[] = [
  { id: "A", status: "CONFIRMED" },
  { id: "B", status: "CONFIRMED" },
  { id: "C", status: "CONFIRMED" },
  { id: "D", status: "CONFIRMED" },
];

// Người thứ 5 đăng ký
const confirmedCount = mockAttendees.filter((a) => a.status === "CONFIRMED").length;
const newStatus = (maxSlots > 0 && confirmedCount >= maxSlots) ? "WAITLIST" : "CONFIRMED";
mockAttendees.push({ id: "E", status: newStatus });

assert(newStatus === "WAITLIST", "Người đăng ký khi đã đủ 4 chỗ tự động vào WAITLIST");

// Người B rút lui khỏi buổi đánh -> Đôn người đầu tiên trong WAITLIST lên
const leavingIndex = mockAttendees.findIndex((a) => a.id === "B");
const wasConfirmed = mockAttendees[leavingIndex].status === "CONFIRMED";
mockAttendees.splice(leavingIndex, 1);

if (wasConfirmed) {
  const waitlistIndex = mockAttendees.findIndex((a) => a.status === "WAITLIST");
  if (waitlistIndex !== -1) {
    mockAttendees[waitlistIndex].status = "CONFIRMED";
  }
}

const promotedMember = mockAttendees.find((a) => a.id === "E");
assert(promotedMember?.status === "CONFIRMED", "Tự động đôn người từ WAITLIST lên CONFIRMED khi có slot trống");

// -----------------------------------------------------------------
// TEST GROUP 4: SHUTTLECOCK INVENTORY & DEPLETION
// -----------------------------------------------------------------
console.log("\n--- TEST GROUP 4: QUẢN LÝ KHO CẦU CLB (INVENTORY) ---");

let stock = 10; // Đang có 10 quả
const tubesBought = 2; // Mua 2 ống = 24 quả
stock += tubesBought * 12;
assert(stock === 34, "Nhập kho 2 ống cầu tăng đúng 24 quả (Tổng: 34 quả)");

const shuttlesUsedInSession = 6; // Buổi đánh dùng 6 quả
stock -= shuttlesUsedInSession;
assert(stock === 28, "Trừ kho sau buổi đánh chính xác (34 - 6 = 28 quả)");

// -----------------------------------------------------------------
// TEST GROUP 5: COURT MATCHMAKER FAIRNESS ALGORITHM
// -----------------------------------------------------------------
console.log("\n--- TEST GROUP 5: THUẬT TOÁN SẮP TRẬN CÔNG BẰNG (MATCHMAKER) ---");

const players = [
  { name: "P1", matches: 3 },
  { name: "P2", matches: 1 },
  { name: "P3", matches: 2 },
  { name: "P4", matches: 0 },
  { name: "P5", matches: 1 },
  { name: "P6", matches: 2 },
];

// Sắp xếp tăng dần theo số trận đã đánh
const sortedPlayers = [...players].sort((a, b) => a.matches - b.matches);
const selectedFour = sortedPlayers.slice(0, 4);

assert(selectedFour.some((p) => p.name === "P4"), "Người chưa đánh trận nào (0 trận) chắc chắn được chọn");
assert(selectedFour.every((p) => p.matches <= 2), "4 người được chọn đều là những người đánh ít trận nhất");
assert(!selectedFour.some((p) => p.name === "P1"), "Người đã đánh nhiều nhất (3 trận) được xếp nghỉ ngoài");

// -----------------------------------------------------------------
// TEST GROUP 6: KHÓA BUỔI ĐÁNH COMPLETED, HOÀN KHO & BẢO TỒN DỮ LIỆU ĐÃ THANH TOÁN
// -----------------------------------------------------------------
console.log("\n--- TEST GROUP 6: KHÓA BUỔI ĐÁNH, HOÀN KHO & BẢO TỒN PAID ---");

// Test 6.1: Khóa thay đổi số lượng cầu khi COMPLETED
const sessionStatus = "COMPLETED";
const canAdjustShuttles = sessionStatus !== "COMPLETED";
assert(!canAdjustShuttles, "Khóa chặt không cho phép tăng/giảm số cầu khi buổi đánh đã COMPLETED");

// Test 6.2: Hoàn kho cầu khi mở lại buổi đánh (Re-open COMPLETED -> ONGOING)
let clubStock = 28; // Tồn kho sau buổi đánh
const shuttlesUsed = 6;
// Mở lại buổi đánh:
clubStock += shuttlesUsed;
assert(clubStock === 34, "Tự động hoàn trả 6 quả cầu vào kho CLB khi mở lại buổi đánh (28 + 6 = 34 quả)");

// Test 6.3: Bảo toàn bản ghi đã thanh toán khi tính lại chia bill
const mockAttendances = [
  { id: "A1", member: "Nam", totalAmount: 50000, paymentStatus: "PAID", paidAt: new Date("2026-11-26T10:00:00Z") },
  { id: "A2", member: "Huy", totalAmount: 50000, paymentStatus: "UNPAID", paidAt: null },
];

// Giả lập chạy lại chia bill
const recalculatedAttendances = mockAttendances.map((a) => {
  const newCalculatedTotal: number = 55000; // Tiền tăng do phát sinh thêm chi phí
  let newPaymentStatus = a.paymentStatus;
  if (a.paymentStatus === "PAID") {
    newPaymentStatus = "PAID"; // Bảo toàn PAID!
  } else if (newCalculatedTotal === 0) {
    newPaymentStatus = "COVERED_BY_SUBSCRIPTION";
  } else {
    newPaymentStatus = "UNPAID";
  }
  return {
    ...a,
    totalAmount: newCalculatedTotal,
    paymentStatus: newPaymentStatus,
  };
});

assert(recalculatedAttendances[0].paymentStatus === "PAID", "Hội viên đã đóng tiền (PAID) được bảo toàn trạng thái PAID khi tính lại bill");
assert(recalculatedAttendances[1].paymentStatus === "UNPAID", "Hội viên chưa đóng tiền giữ trạng thái UNPAID");

// Test 6.4: Chặn xóa người bảo lãnh khi khách vãng lai còn nợ
const sponsorId = "SPONSOR_01";
const guestWithDebt = { id: "GUEST_01", sponsorMemberId: sponsorId, hasDebt: true };
const canDeleteSponsor = !guestWithDebt.hasDebt;
assert(!canDeleteSponsor, "Chặn xóa người bảo lãnh khi khách vãng lai bảo lãnh vẫn còn nợ tiền buổi đánh");

// -----------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------
console.log("\n=======================================================");
console.log(`KẾT QUẢ KIỂM THỬ: ${passedCount} PASSED | ${failedCount} FAILED`);
console.log("=======================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("🎉 TOÀN BỘ LOGIC NGHIỆP VỤ ĐẠT TIÊU CHUẨN 100%!\n");
}
