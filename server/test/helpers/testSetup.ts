import { PrismaClient } from '../../prisma/generated/client';

const prisma = new PrismaClient();

/**
 * Clean test database - runs before each test
 */
export async function cleanDatabase() {
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

