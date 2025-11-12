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
require("dotenv/config");
const app_1 = require("./app");
const client_1 = require("../prisma/generated/client");
exports.prisma = new client_1.PrismaClient();
const app = (0, app_1.createApp)();
const port = process.env.PORT || 4000;
// close Prisma connection
process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
    yield exports.prisma.$disconnect();
}));
// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
