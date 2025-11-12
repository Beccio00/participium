import "dotenv/config";
import { createApp } from "./app";
import { prisma } from "./utils/prismaClient";

const app = createApp();
const port = process.env.PORT || 4000;

// close Prisma connection
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});