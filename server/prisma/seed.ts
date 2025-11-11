import "dotenv/config";
import { PrismaClient } from "./generated/client";
import { hashPassword } from "../src/services/passwordService";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Clear existing data
  await prisma.user.deleteMany();

  //insert example users
  await prisma.user.createMany({
    data: [
      {
        email: "admin@participium.com",
        first_name: "Admin",
        last_name: "User",
        password: "hashedpassword123",
        role: "ADMINISTRATOR",
      },
      {
        email: "citizen@participium.com",
        first_name: "John",
        last_name: "Doe",
        password: "hashedpassword456",
        role: "CITIZEN",
      },
      {
        email: "pr@participium.com",
        first_name: "Jane",
        last_name: "Smith",
        password: "hashedpassword789",
        role: "PUBLIC_RELATIONS",
      },
      {
        email: "tech@participium.com",
        first_name: "Tech",
        last_name: "Office",
        password: "hashedpassword000",
        role: "TECHNICAL_OFFICE",
      },
    ],
  });

  console.log("\nDatabase seed completed successfully!");
  console.log("\nSummary:");
  console.log("- Created 4 sample users with different roles");
  await prisma.user.deleteMany();

  // users to insert (plain passwords)
  const users = [
    {
      email: "admin@participium.com",
      first_name: "Admin",
      last_name: "User",
      password: "adminpass",
      role: "ADMINISTRATOR",
      telegram_username: null,
      email_notifications_enabled: true
    },
    {
      email: "citizen@participium.com",
      first_name: "John",
      last_name: "Doe",
      password: "citizenpass",
      role: "CITIZEN",
      telegram_username: null,
      email_notifications_enabled: true
    },
    {
      email: "pr@participium.com",
      first_name: "Jane",
      last_name: "Smith",
      password: "prpass",
      role: "PUBLIC_RELATIONS",
      telegram_username: null,
      email_notifications_enabled: true
    },
    {
      email: "tech@participium.com",
      first_name: "Tech",
      last_name: "Office",
      password: "techpass",
      role: "TECHNICAL_OFFICE",
      telegram_username: null,
      email_notifications_enabled: true
    },
  ];

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
        email_notifications_enabled: u.email_notifications_enabled
      },
    });
  }

  console.log("\nDatabase seed completed successfully!");
  console.log("\nSummary:");
  console.log(`- Created ${users.length} sample users with hashed passwords`);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
