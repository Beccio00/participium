import "reflect-metadata";
import { User } from "../../src/entities/User";
import { CitizenPhoto } from "../../src/entities/CitizenPhoto";
import { Report } from "../../src/entities/Report";
import { ReportPhoto } from "../../src/entities/ReportPhoto";
import { ReportMessage } from "../../src/entities/ReportMessage";
import { Notification } from "../../src/entities/Notification";
import { ExternalCompany } from "../../src/entities/ExternalCompany";
import { InternalNote } from "../../src/entities/InternalNote";
import { AppDataSource } from "../../src/utils/AppDataSource";

// Legacy Prisma adapter for backwards compatibility with old tests
// Project has migrated to TypeORM, this adapter bridges prisma API to TypeORM
export const prisma: any = {
  report: {
    create: async (args: any) => {
      const repo = AppDataSource.getRepository(Report);
      const data = { ...(args?.data || {}) };
      
      // Handle nested photos creation (prisma style)
      let photos = undefined;
      if (data.photos?.create) {
        photos = data.photos.create;
        delete data.photos;
      }
      
      const report = repo.create(data);
      const savedReport = (await repo.save(report)) as unknown as Report;
      
      // Create photos if provided
      if (photos && photos.length > 0) {
        const photoRepo = AppDataSource.getRepository(ReportPhoto);
        for (const photoData of photos) {
          const photo = photoRepo.create({
            ...photoData,
            reportId: (savedReport as any).id,
          });
          await photoRepo.save(photo);
        }
      }
      
      return savedReport;
    },
    findMany: async (args?: any) => {
      const repo = AppDataSource.getRepository(Report);
      return await repo.find(args?.where ? { where: args.where } : {});
    },
    findUnique: async (args: any) => {
      const repo = AppDataSource.getRepository(Report);
      const relations = [];
      if (args?.include?.messages) relations.push('messages');
      if (args?.include?.photos) relations.push('photos');
      if (args?.include?.user) relations.push('user');
      return await repo.findOne({ 
        where: args?.where,
        relations: relations.length > 0 ? relations : undefined
      });
    },
    update: async (args: any) => {
      const repo = AppDataSource.getRepository(Report);
      await repo.update(args?.where, args?.data);
      return await repo.findOne({ where: args?.where });
    },
    delete: async (args: any) => {
      const repo = AppDataSource.getRepository(Report);
      const entity = await repo.findOne({ where: args?.where });
      if (entity) await repo.remove(entity);
      return entity;
    },
  },
  user: {
    create: async (args: any) => {
      const repo = AppDataSource.getRepository(User);
      const user = repo.create(args?.data || {});
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
    findFirst: async (args?: any) => {
      const repo = AppDataSource.getRepository(User);
      return await repo.findOne(args?.where ? { where: args.where } : {});
    },
    update: async (args: any) => {
      const repo = AppDataSource.getRepository(User);
      await repo.update(args?.where, args?.data);
      return await repo.findOne({ where: args?.where });
    },
    delete: async (args: any) => {
      const repo = AppDataSource.getRepository(User);
      const entity = await repo.findOne({ where: args?.where });
      if (entity) await repo.remove(entity);
      return entity;
    },
  },
  notification: {
    create: async (args: any) => {
      const repo = AppDataSource.getRepository(Notification);
      const notification = repo.create(args?.data || {});
      return await repo.save(notification);
    },
    findMany: async (args?: any) => {
      const repo = AppDataSource.getRepository(Notification);
      return await repo.find(args?.where ? { where: args.where } : {});
    },
  },
  citizenPhoto: {
    create: async (args: any) => {
      const repo = AppDataSource.getRepository(CitizenPhoto);
      const photo = repo.create(args?.data || {});
      return await repo.save(photo);
    },
    findUnique: async (args: any) => {
      const repo = AppDataSource.getRepository(CitizenPhoto);
      return await repo.findOne({ where: args?.where });
    },
    delete: async (args: any) => {
      const repo = AppDataSource.getRepository(CitizenPhoto);
      const entity = await repo.findOne({ where: args?.where });
      if (entity) await repo.remove(entity);
      return entity;
    },
  },
  reportPhoto: {
    create: async (args: any) => {
      const repo = AppDataSource.getRepository(ReportPhoto);
      const photo = repo.create(args?.data || {});
      return await repo.save(photo);
    },
  },
  reportMessage: {
    create: async (args: any) => {
      const repo = AppDataSource.getRepository(ReportMessage);
      const message = repo.create(args?.data || {});
      return await repo.save(message);
    },
    findMany: async (args?: any) => {
      const repo = AppDataSource.getRepository(ReportMessage);
      return await repo.find(args?.where ? { where: args.where } : {});
    },
  },
  $disconnect: async () => {},
};

// Re-export AppDataSource as TestDataSource for backwards compatibility
export const TestDataSource = AppDataSource;

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
  // Use createQueryBuilder to delete all records (TypeORM doesn't allow empty criteria with delete({}))
  // Order: child tables first, then parent tables
  await AppDataSource.getRepository(InternalNote).createQueryBuilder().delete().execute();
  await AppDataSource.getRepository(ReportMessage).createQueryBuilder().delete().execute();
  await AppDataSource.getRepository(ReportPhoto).createQueryBuilder().delete().execute();
  await AppDataSource.getRepository(Notification).createQueryBuilder().delete().execute();
  await AppDataSource.getRepository(CitizenPhoto).createQueryBuilder().delete().execute();
  await AppDataSource.getRepository(Report).createQueryBuilder().delete().execute();
  await AppDataSource.getRepository(User).createQueryBuilder().delete().execute();
  await AppDataSource.getRepository(ExternalCompany).createQueryBuilder().delete().execute();
}

/**
 * Disconnect database connection - runs after all tests complete
 */
export async function disconnectDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
