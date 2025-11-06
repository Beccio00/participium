import "dotenv/config";
import { PrismaClient } from "../src/generated/client";

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
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });