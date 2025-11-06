import "dotenv/config";
import express, { Express, Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import { configurePassport } from "./config/passport";
import authRoutes from './routes/authRoutes';
import citizenRoutes from './routes/citizenRoutes';
import { PrismaClient } from "../prisma/generated/client";

export const prisma = new PrismaClient();

const app: Express = express();
const port = 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Session and Passport Middleware
app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false
}));
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({ 
    message: "Office Queue Management API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/session"
    }
  });
});

//API Routes
app.use('/api/session', authRoutes);
app.use('/api/citizen', citizenRoutes);

// close Prisma connection
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
