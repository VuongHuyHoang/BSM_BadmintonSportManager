import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu tạo dữ liệu mẫu cho Badminton Sport Manager (BSM)...");

  // 1. Tạo Tài khoản Admin / Thủ quỹ mẫu
  const passwordHash = await bcrypt.hash("123456", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@badminton.vn" },
    update: {},
    create: {
      name: "Nguyễn Văn Trưởng Nhóm",
      email: "admin@badminton.vn",
      phone: "0901234567",
      passwordHash,
    },
  });

  const treasurerUser = await prisma.user.upsert({
    where: { email: "treasurer@badminton.vn" },
    update: {},
    create: {
      name: "Trần Thị Thủ Quỹ",
      email: "treasurer@badminton.vn",
      phone: "0912345678",
      passwordHash,
    },
  });

  const memberUser1 = await prisma.user.upsert({
    where: { email: "huy@badminton.vn" },
    update: {},
    create: {
      name: "Lê Quốc Huy",
      email: "huy@badminton.vn",
      phone: "0987654321",
      passwordHash,
    },
  });

  console.log("✅ Đã tạo 3 tài khoản người dùng (Admin, Thủ quỹ, Hội viên). Mật khẩu: 123456");

  // 2. Tạo Câu lạc bộ mẫu
  const club = await prisma.club.upsert({
    where: { inviteCode: "KYHOA-CLUB" },
    update: {},
    create: {
      name: "CLB Cầu Lông Kỳ Hòa",
      inviteCode: "KYHOA-CLUB",
      bankCode: "970422", // MBBank
      bankAccountNo: "0912345678",
      bankAccountName: "TRAN THI THU QUY",
      defaultShuttlePrice: 25000,
      roundingMode: "CEIL_1K",
    },
  });

  console.log(`✅ Đã tạo CLB mẫu: ${club.name} (Mã mời: ${club.inviteCode})`);

  // 3. Tạo Thành viên CLB với 3 loại gói khác nhau
  const membersData = [
    {
      userId: adminUser.id,
      displayName: "Nguyễn Văn Trưởng Nhóm",
      role: "ADMIN",
      membershipType: "FULL_MONTHLY",
      monthlyFeeAmount: 450000,
    },
    {
      userId: treasurerUser.id,
      displayName: "Trần Thị Thủ Quỹ",
      role: "TREASURER",
      membershipType: "FULL_MONTHLY",
      monthlyFeeAmount: 450000,
    },
    {
      userId: memberUser1.id,
      displayName: "Lê Quốc Huy",
      role: "MEMBER",
      membershipType: "COURT_ONLY_MONTHLY", // Chỉ đóng tiền sân tháng
      monthlyFeeAmount: 250000,
    },
    {
      displayName: "Phạm Minh Tuấn",
      role: "MEMBER",
      membershipType: "PAY_PER_SESSION", // Đóng theo buổi
    },
    {
      displayName: "Khách Vãng Lai 01",
      role: "MEMBER",
      membershipType: "GUEST", // Khách vãng lai
    },
  ];

  const createdMembers = [];
  for (const m of membersData) {
    const member = await prisma.member.create({
      data: {
        clubId: club.id,
        userId: m.userId || null,
        displayName: m.displayName,
        role: m.role,
        membershipType: m.membershipType,
        monthlyFeeAmount: m.monthlyFeeAmount || null,
      },
    });
    createdMembers.push(member);
  }

  console.log(`✅ Đã tạo ${createdMembers.length} hội viên thuộc đủ các gói.`);

  // 4. Tạo 1 Buổi đánh mẫu
  const session = await prisma.badmintonSession.create({
    data: {
      clubId: club.id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 tiếng
      courtName: "Sân 3 - CLB Kỳ Hòa",
      courtFee: 180000, // 90k/h * 2h
      otherFee: 20000,  // Nước đá
      status: "ONGOING",
    },
  });

  // 5. Ghi nhận số quả cầu tiêu hao
  await prisma.shuttleLog.create({
    data: {
      sessionId: session.id,
      brand: "Thành Công Đỏ",
      quantity: 4,
      unitPrice: 25000,
      totalAmount: 100000,
    },
  });

  // 6. Điểm danh và tính toán tiền cho các thành viên trong buổi
  // Tổng chi phí buổi = Sân 180k + Cầu 100k + Nước 20k = 300.000đ
  for (const member of createdMembers) {
    let courtShare = 0;
    let shuttleShare = 0;
    let extraShare = 0;
    let total = 0;
    let status = "UNPAID";

    if (member.membershipType === "FULL_MONTHLY") {
      // Đã bao trọn tháng -> 0đ
      status = "COVERED_BY_SUBSCRIPTION";
      total = 0;
    } else if (member.membershipType === "COURT_ONLY_MONTHLY") {
      // Chỉ đóng tiền cầu + nước chia 5 người
      shuttleShare = Math.round(100000 / 5); // 20k
      extraShare = Math.round(20000 / 5);    // 4k
      total = 24000;
    } else {
      // Vãng lai / Theo buổi: Chia đều toàn bộ chi phí
      total = Math.ceil(300000 / 5 / 1000) * 1000; // 60k
      courtShare = 36000;
      shuttleShare = 20000;
      extraShare = 4000;
    }

    await prisma.sessionAttendance.create({
      data: {
        sessionId: session.id,
        memberId: member.id,
        checkInBy: "SELF",
        courtFeeShare: courtShare,
        shuttleFeeShare: shuttleShare,
        extraFeeShare: extraShare,
        totalAmount: total,
        paymentStatus: status,
      },
    });
  }

  // 7. Tạo giao dịch quỹ mở màn
  await prisma.transaction.create({
    data: {
      clubId: club.id,
      type: "INCOME",
      category: "MONTHLY_FUND",
      amount: 1500000,
      description: "Thu tiền quỹ tháng 11 từ hội viên cố định",
    },
  });

  console.log("🎉 Hoàn tất seed dữ liệu mẫu thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
