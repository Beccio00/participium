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
const path_1 = __importDefault(require("path"));
const constants_1 = require("./config/constants");
const passport_2 = require("./config/passport");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const citizenRoutes_1 = __importDefault(require("./routes/citizenRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
function createApp() {
    const app = (0, express_1.default)();
    // Body parsing middleware
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // CORS middleware
    app.use((0, cors_1.default)({
        origin: constants_1.CONFIG.CORS.ORIGIN,
        credentials: constants_1.CONFIG.CORS.CREDENTIALS,
        methods: constants_1.CONFIG.CORS.METHODS,
    }));
    // Session middleware
    app.use((0, express_session_1.default)({
        secret: constants_1.CONFIG.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    }));
    // Passport middleware
    (0, passport_2.configurePassport)();
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    // Swagger documentation
    const swaggerPath = path_1.default.join(__dirname, "..", constants_1.CONFIG.SWAGGER_FILE_PATH);
    app.use(constants_1.CONFIG.ROUTES.SWAGGER, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(yamljs_1.default.load(swaggerPath)));
    // Root endpoint
    app.get(constants_1.CONFIG.ROUTES.ROOT, (req, res) => {
        res.json({
            message: constants_1.CONFIG.API.NAME,
            version: constants_1.CONFIG.API.VERSION,
            description: constants_1.CONFIG.API.DESCRIPTION,
            endpoints: {
                auth: constants_1.CONFIG.ROUTES.SESSION,
                citizens: constants_1.CONFIG.ROUTES.CITIZEN,
                admin: constants_1.CONFIG.ROUTES.ADMIN,
                docs: constants_1.CONFIG.ROUTES.SWAGGER,
            },
        });
    });
    // API Routes
    app.use(constants_1.CONFIG.ROUTES.SESSION, authRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.CITIZEN, citizenRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.ADMIN, adminRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.REPORTS, reportRoutes_1.default);
    // This must always be the last middleware added
    // TODO: Add error handler middleware here when implemented
    return app;
}
