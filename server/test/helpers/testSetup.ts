import { AppDataSource } from '../../src/utils/AppDataSource';
import { ReportMessage } from '../../src/entities/ReportMessage';
import { ReportPhoto } from '../../src/entities/ReportPhoto';
import { Report } from '../../src/entities/Report';
import { CitizenPhoto } from '../../src/entities/CitizenPhoto';
import { Notification } from '../../src/entities/Notification';
import { User } from '../../src/entities/User';
import { ExternalCompanyUser } from '../../src/entities/ExternalCompanyUser';
import { ExternalCompany } from '../../src/entities/ExternalCompany';

/**
 * Clean test database - runs before each test
 */
export async function cleanDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  
  // Delete in order to respect foreign key constraints
  await AppDataSource.getRepository(ReportMessage).delete({});
  await AppDataSource.getRepository(ReportPhoto).delete({});
  await AppDataSource.getRepository(Report).delete({});
  await AppDataSource.getRepository(CitizenPhoto).delete({});
  await AppDataSource.getRepository(Notification).delete({});
  await AppDataSource.getRepository(ExternalCompanyUser).delete({});
  await AppDataSource.getRepository(ExternalCompany).delete({});
  await AppDataSource.getRepository(User).delete({});
}

/**
 * Disconnect database connection - runs after all tests complete
 */
export async function disconnectDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

/**
 * Initialize test database - runs before tests start
 */
export async function setupTestDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await cleanDatabase();
}

