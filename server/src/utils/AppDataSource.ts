import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { CitizenPhoto } from "../entities/CitizenPhoto";
import { Report } from "../entities/Report";
import { ReportPhoto } from "../entities/ReportPhoto";
import { ReportMessage } from "../entities/ReportMessage";
import { Notification } from "../entities/Notification";
import { ExternalCompany } from "../entities/ExternalCompany";
import { InternalNote } from "../entities/InternalNote";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User, CitizenPhoto, Report, ReportPhoto, ReportMessage, Notification, ExternalCompany, InternalNote],
  migrations: ["dist/app/src/migrations/*.js"],
  // Force synchronization in Docker/production for setup
  synchronize: process.env.TYPEORM_SYNCHRONIZE === "true" || process.env.NODE_ENV === "development", 
  logging: process.env.NODE_ENV === "development" && process.env.TYPEORM_LOGGING === "true",
  // Enable schema creation in Docker environment
  dropSchema: false,
  // Additional connection options for Docker
  connectTimeoutMS: 20000,
  extra: {
    max: 10,
    connectionTimeoutMillis: 10000,
  },
});

export default AppDataSource;