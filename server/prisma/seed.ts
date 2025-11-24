import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/services/passwordService";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing users
  await prisma.user.deleteMany();

  // Users to insert (plain passwords)
  const users = [
    {
      email: "admin@participium.com",
      first_name: "Admin",
      last_name: "User",
      password: "adminpass",
      role: "ADMINISTRATOR",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "citizen@participium.com",
      first_name: "Mario",
      last_name: "Rossi",
      password: "citizenpass",
      role: "CITIZEN",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "pr@participium.com",
      first_name: "Public",
      last_name: "Relations",
      password: "prpass",
      role: "PUBLIC_RELATIONS",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "tech@participium.com",
      first_name: "Municipal",
      last_name: "Building Maintenance",
      password: "techpass",
      role: "MUNICIPAL_BUILDING_MAINTENANCE",
      telegram_username: null,
      email_notifications_enabled: true,
    },
  ];

  // Hash passwords and insert users
  for (const u of users) {
    const { hashedPassword, salt } = await hashPassword(u.password);
    await prisma.user.create({
      data: {
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        password: hashedPassword,
        salt,
        role: u.role as any,
        telegram_username: u.telegram_username,
        email_notifications_enabled: u.email_notifications_enabled,
      },
    });
    console.log(`✅ Created user: ${u.email}`);
  }

  console.log("\n✅ Database seed completed successfully!");
  console.log(`\nCreated ${users.length} sample users with hashed passwords`);
  console.log("\n📋 Test credentials:");
  console.log("  Admin: admin@participium.com / adminpass");
  console.log("  Citizen: citizen@participium.com / citizenpass");
  console.log("  PR: pr@participium.com / prpass");
  console.log("  Tech: tech@participium.com / techpass");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
