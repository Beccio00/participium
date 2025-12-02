"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const constants_1 = require("./config/constants");
const passport_2 = require("./config/passport");
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const rootRoutes_1 = __importDefault(require("./routes/rootRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const citizenRoutes_1 = __importDefault(require("./routes/citizenRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const validationMiddlewere_1 = require("./middlewares/validationMiddlewere");
const minioClient_1 = require("./utils/minioClient");
function createApp() {
    const app = (0, express_1.default)();
    // Log tutte le richieste HTTP
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cors_1.default)({
        origin: (origin, cb) => {
            // allow requests with no origin (mobile apps, curl)
            if (!origin)
                return cb(null, true);
            const allowed = constants_1.CONFIG.CORS.ORIGIN || [];
            // if exact match allowed
            if (allowed.includes(origin))
                return cb(null, true);
            // allow any localhost origin (different ports) and 127.0.0.1
            try {
                const u = new URL(origin);
                if (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
                    return cb(null, true);
            }
            catch (e) {
                // ignore
            }
            return cb(new Error('Not allowed by CORS'));
        },
        credentials: constants_1.CONFIG.CORS.CREDENTIALS,
        methods: constants_1.CONFIG.CORS.METHODS,
    }));
    app.use((0, express_session_1.default)({
        secret: constants_1.CONFIG.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    }));
    (0, passport_2.configurePassport)();
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    app.use(constants_1.CONFIG.ROUTES.SWAGGER, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(yamljs_1.default.load(constants_1.CONFIG.SWAGGER_FILE_PATH)));
    app.use(validationMiddlewere_1.ApiValidationMiddleware);
    app.use(constants_1.CONFIG.ROUTES.ROOT, rootRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.SESSION, authRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.CITIZEN, citizenRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.ADMIN, adminRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.REPORTS, reportRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.NOTIFICATIONS, notificationRoutes_1.default);
    app.use(errorMiddleware_1.errorHandler);
    // Log errori runtime
    app.use((err, req, res, next) => {
        console.error("Errore runtime:", err);
        next(err);
    });
    (0, minioClient_1.initMinio)().then(() => {
        console.log("MinIO initialized successfully");
    });
    return app;
}
