import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { CitizenPhoto } from "../entities/CitizenPhoto";
import { Report } from "../entities/Report";
import { ReportPhoto } from "../entities/ReportPhoto";
import { ReportMessage } from "../entities/ReportMessage";
import { Notification } from "../entities/Notification";
import { ExternalCompany } from "../entities/ExternalCompany";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User, CitizenPhoto, Report, ReportPhoto, ReportMessage, Notification, ExternalCompany],
  migrations: ["src/migrations/*.ts"],
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
});

export default AppDataSource;