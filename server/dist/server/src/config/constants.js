"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
const path_1 = __importDefault(require("path"));
exports.CONFIG = {
    // Server
    PORT: process.env.PORT || 4000,
    // Session
    SESSION_SECRET: process.env.SESSION_SECRET || "shhhhh... it's a secret!",
    // CORS
    CORS: {
        ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ["http://localhost:5173", "http://localhost:3000"],
        CREDENTIALS: true,
        METHODS: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    },
    // Routes
    ROUTES: {
        ROOT: "/",
        API_PREFIX: "/api",
        SESSION: "/api/session",
        CITIZEN: "/api/citizen",
        ADMIN: "/api/admin",
        REPORTS: "/api/reports",
        NOTIFICATIONS: "/api/notifications",
        SWAGGER: "/api-docs",
    },
    // Swagger
    SWAGGER_FILE_PATH: path_1.default.resolve(__dirname, "../../../docs/swagger.yaml"),
    // API Info
    API: {
        NAME: "Participium API",
        VERSION: "1.1.0",
        DESCRIPTION: "Digital Citizen Participation Platform",
    },
};
