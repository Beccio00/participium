import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { CitizenPhoto } from "../entities/CitizenPhoto";
import { Report } from "../entities/Report";
import { ReportPhoto } from "../entities/ReportPhoto";
import { ReportMessage } from "../entities/ReportMessage";
import { Notification } from "../entities/Notification";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User, CitizenPhoto, Report, ReportPhoto, ReportMessage, Notification],
  migrations: ["dist/app/src/migrations/*.js"],
  // Force synchronization in Docker/production for setup
  synchronize: true, // Always sync in containerized environment
  logging: process.env.NODE_ENV === "development" || process.env.TYPEORM_LOGGING === "true",
  // Enable schema creation in Docker environment
  dropSchema: false,
});

export default AppDataSource;