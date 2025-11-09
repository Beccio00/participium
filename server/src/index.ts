import "dotenv/config";
import { createApp } from "./app";
import  PrismaClient  from "./utils/PrismaClient";

export const prisma = new PrismaClient();

const app = createApp();
const port = process.env.PORT || 4000;

// close Prisma connection on shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
