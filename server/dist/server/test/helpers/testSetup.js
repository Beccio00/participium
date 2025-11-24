"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.cleanDatabase = cleanDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.setupTestDatabase = setupTestDatabase;
const client_1 = require("../../prisma/generated/client");
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
/**
 * Clean test database - runs before each test
 */
function cleanDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        // Delete in order to respect foreign key constraints
        yield prisma.reportMessage.deleteMany();
        yield prisma.reportPhoto.deleteMany();
        yield prisma.report.deleteMany();
        yield prisma.user.deleteMany();
    });
}
/**
 * Disconnect database connection - runs after all tests complete
 */
function disconnectDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma.$disconnect();
    });
}
/**
 * Initialize test database - runs before tests start
 */
function setupTestDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        yield cleanDatabase();
    });
}
