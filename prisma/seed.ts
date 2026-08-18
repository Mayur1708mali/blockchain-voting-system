import { PrismaClient, Role } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create default super admin
  const hashedPassword = await bcryptjs.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@voting.com" },
    update: {},
    create: {
      email: "admin@voting.com",
      name: "Super Admin",
      password: hashedPassword,
      prn: BigInt("1000000000000001"),
      class: "ADMIN",
      role: Role.SUPER_ADMIN,
      approved: true,
    },
  });

  console.log("Seeded super admin:", admin.email);

  // Create an election manager
  const managerPassword = await bcryptjs.hash("manager123", 12);
  const manager = await prisma.user.upsert({
    where: { email: "manager@voting.com" },
    update: {},
    create: {
      email: "manager@voting.com",
      name: "Election Manager",
      password: managerPassword,
      prn: BigInt("1000000000000002"),
      class: "ADMIN",
      role: Role.ELECTION_MANAGER,
      approved: true,
    },
  });

  console.log("Seeded election manager:", manager.email);

  // Create an auditor
  const auditorPassword = await bcryptjs.hash("auditor123", 12);
  const auditor = await prisma.user.upsert({
    where: { email: "auditor@voting.com" },
    update: {},
    create: {
      email: "auditor@voting.com",
      name: "Auditor",
      password: auditorPassword,
      prn: BigInt("1000000000000003"),
      class: "ADMIN",
      role: Role.AUDITOR,
      approved: true,
    },
  });

  console.log("Seeded auditor:", auditor.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
