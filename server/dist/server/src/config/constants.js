"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
exports.CONFIG = {
    // Server
    PORT: process.env.PORT || 4000,
    // Session
    SESSION_SECRET: process.env.SESSION_SECRET || "shhhhh... it's a secret!",
    // CORS
    CORS: {
        ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
        CREDENTIALS: true,
        METHODS: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    // Routes
    ROUTES: {
        ROOT: "/",
        API_PREFIX: "/api",
        SESSION: "/api/session",
        CITIZEN: "/api/citizen",
        ADMIN: "/api/admin",
        REPORTS: "/api/reports",
        SWAGGER: "/api-docs",
    },
    // Swagger
    SWAGGER_FILE_PATH: "../docs/swagger.yaml",
    // API Info
    API: {
        NAME: "Participium API",
        VERSION: "1.1.0",
        DESCRIPTION: "Digital Citizen Participation Platform",
    },
};
