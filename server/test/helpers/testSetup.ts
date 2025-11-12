import { PrismaClient } from '../../prisma/generated/client';

const prisma = new PrismaClient();

/**
 * Clean test database - runs before each test
 */
export async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await prisma.reportMessage.deleteMany();
  await prisma.reportPhoto.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Disconnect database connection - runs after all tests complete
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

/**
 * Initialize test database - runs before tests start
 */
export async function setupTestDatabase() {
  await cleanDatabase();
}

export { prisma };

