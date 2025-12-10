import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../../src/entities/User";
import { CitizenPhoto } from "../../src/entities/CitizenPhoto";
import { Report } from "../../src/entities/Report";
import { ReportPhoto } from "../../src/entities/ReportPhoto";
import { ReportMessage } from "../../src/entities/ReportMessage";
import { Notification } from "../../src/entities/Notification";
import { ExternalCompany } from "../../src/entities/ExternalCompany";

// Test DataSource configuration
export const TestDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL || "postgresql://participium:participium_password@localhost:5432/participium_test",
  entities: [User, CitizenPhoto, Report, ReportPhoto, ReportMessage, Notification, ExternalCompany],
  synchronize: true,
  dropSchema: true, // Clean database on each test run
  logging: false,
});

/**
 * Initialize test database connection
 */
export async function setupTestDatabase() {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
  }
}

/**
 * Clean test database - runs before each test
 */
export async function cleanDatabase() {
  if (!TestDataSource.isInitialized) {
    await setupTestDatabase();
  }
  
  // Delete in order to respect foreign key constraints
  // Use createQueryBuilder to delete all records (TypeORM doesn't allow empty criteria with delete({}))
  await TestDataSource.getRepository(ReportMessage).createQueryBuilder().delete().execute();
  await TestDataSource.getRepository(ReportPhoto).createQueryBuilder().delete().execute();
  await TestDataSource.getRepository(Notification).createQueryBuilder().delete().execute();
  await TestDataSource.getRepository(Report).createQueryBuilder().delete().execute();
  await TestDataSource.getRepository(CitizenPhoto).createQueryBuilder().delete().execute();
  await TestDataSource.getRepository(ExternalCompany).createQueryBuilder().delete().execute();
  await TestDataSource.getRepository(User).createQueryBuilder().delete().execute();
}

/**
 * Disconnect database connection - runs after all tests complete
 */
export async function disconnectDatabase() {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
}

export { TestDataSource };
