import "reflect-metadata";
import { AppDataSource } from "../../src/utils/AppDataSource";
import { User } from "../../src/entities/User";
import { CitizenPhoto } from "../../src/entities/CitizenPhoto";
import { Report } from "../../src/entities/Report";
import { ReportPhoto } from "../../src/entities/ReportPhoto";
import { ReportMessage } from "../../src/entities/ReportMessage";
import { Notification } from "../../src/entities/Notification";
import { ExternalCompany } from "../../src/entities/ExternalCompany";

// Use the application's AppDataSource directly
export { AppDataSource };
export const TestDataSource = AppDataSource;

// Legacy Prisma mock for backwards compatibility with old tests
// Project has migrated to TypeORM but some tests still use prisma
export const prisma: any = {
  report: {
    create: async (args: any) => {
      const repo = AppDataSource.getRepository(Report);
      const data = { ...(args?.data || {}) };
      const report = repo.create(data);
      return await repo.save(report);
    },
    findMany: async (args?: any) => {
      const repo = AppDataSource.getRepository(Report);
      return await repo.find(args?.where ? { where: args.where } : {});
    },
    findUnique: async (args: any) => {
      const repo = AppDataSource.getRepository(Report);
      return await repo.findOne({ where: args?.where });
    },
    update: async (args: any) => {
      const repo = AppDataSource.getRepository(Report);
      await repo.update(args?.where, args?.data);
      return await repo.findOne({ where: args?.where });
    },
  },
  user: {
    create: async (args: any) => {
      const repo = AppDataSource.getRepository(User);
      const user = repo.create(args?.data);
      return await repo.save(user);
    },
    findMany: async (args?: any) => {
      const repo = AppDataSource.getRepository(User);
      return await repo.find(args?.where ? { where: args.where } : {});
    },
    findUnique: async (args: any) => {
      const repo = AppDataSource.getRepository(User);
      return await repo.findOne({ where: args?.where });
    },
    update: async (args: any) => {
      const repo = AppDataSource.getRepository(User);
      await repo.update(args?.where, args?.data);
      return await repo.findOne({ where: args?.where });
    },
  },
  $disconnect: async () => {},
};

/**
 * Initialize test database connection
 */
export async function setupTestDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}

/**
 * Clean test database - runs before each test
 */
export async function cleanDatabase() {
  if (!AppDataSource.isInitialized) {
    await setupTestDatabase();
  }
  
  // Delete in order to respect foreign key constraints
  // Use createQueryBuilder to delete all records (delete({}) is not allowed in TypeORM)
  // Order: child tables first, then parent tables
  await AppDataSource.createQueryBuilder().delete().from(Notification).execute(); // references Report and User
  await AppDataSource.createQueryBuilder().delete().from(ReportMessage).execute(); // references Report and User
  await AppDataSource.createQueryBuilder().delete().from(ReportPhoto).execute(); // references Report
  await AppDataSource.createQueryBuilder().delete().from(Report).execute(); // references User
  await AppDataSource.createQueryBuilder().delete().from(CitizenPhoto).execute(); // references User
  await AppDataSource.createQueryBuilder().delete().from(User).execute(); // references ExternalCompany
  await AppDataSource.createQueryBuilder().delete().from(ExternalCompany).execute(); // no dependencies
}

/**
 * Disconnect database connection - runs after all tests complete
 */
export async function disconnectDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
