/**
 * Legacy Prisma client mock for backwards compatibility with old tests.
 * This project has migrated to TypeORM. This file exists only to allow
 * old test files to compile.
 * 
 * TODO: Update test files to use TypeORM repositories instead.
 */

// Mock Prisma client structure for test compatibility
export const prisma = {
  report: {
    create: async () => null,
    findMany: async () => [],
    findUnique: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  user: {
    create: async () => null,
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  notification: {
    create: async () => null,
    findMany: async () => [],
  },
  citizenPhoto: {
    create: async () => null,
    findUnique: async () => null,
    delete: async () => null,
  },
  reportPhoto: {
    create: async () => null,
  },
  reportMessage: {
    create: async () => null,
    findMany: async () => [],
  },
  $disconnect: async () => {},
};

export default prisma;

