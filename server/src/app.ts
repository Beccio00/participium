import express, { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();   // Prisma Client

const app: Express = express();
const port = 4000;

app.use(express.json());  // middleware for JSON

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});


// close Prisma connection
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
