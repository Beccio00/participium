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
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const rootRoutes_1 = __importDefault(require("./routes/rootRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const citizenRoutes_1 = __importDefault(require("./routes/citizenRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cors_1.default)({
        origin: constants_1.CONFIG.CORS.ORIGIN,
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
    const swaggerPath = path_1.default.join(__dirname, "..", constants_1.CONFIG.SWAGGER_FILE_PATH);
    app.use(constants_1.CONFIG.ROUTES.SWAGGER, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(yamljs_1.default.load(swaggerPath)));
    app.use(constants_1.CONFIG.ROUTES.ROOT, rootRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.SESSION, authRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.CITIZEN, citizenRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.ADMIN, adminRoutes_1.default);
    app.use(constants_1.CONFIG.ROUTES.REPORTS, reportRoutes_1.default);
    app.use(errorMiddleware_1.errorHandler);
    return app;
}
