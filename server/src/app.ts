import "dotenv/config";
import express, { Express, Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { CONFIG } from "./config/constants";
import { configurePassport } from "./config/passport";
import authRoutes from "./routes/authRoutes";
import citizenRoutes from "./routes/citizenRoutes";
import adminRoutes from "./routes/adminRoutes";
import reportRoutes from './routes/reportRoutes';

export function createApp(): Express {
  const app: Express = express();

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS middleware
  app.use(
    cors({
      origin: CONFIG.CORS.ORIGIN,
      credentials: CONFIG.CORS.CREDENTIALS,
      methods: CONFIG.CORS.METHODS,
    })
  );

  // Session middleware
  app.use(
    session({
      secret: CONFIG.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );

  // Passport middleware
  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

    // Swagger documentation
  const swaggerPath = path.join(__dirname, "..", CONFIG.SWAGGER_FILE_PATH);
  app.use(
    CONFIG.ROUTES.SWAGGER,
    swaggerUi.serve,
    swaggerUi.setup(YAML.load(swaggerPath))
  );

  // Root endpoint
  app.get(CONFIG.ROUTES.ROOT, (req: Request, res: Response) => {
    res.json({
      message: CONFIG.API.NAME,
      version: CONFIG.API.VERSION,
      description: CONFIG.API.DESCRIPTION,
      endpoints: {
        auth: CONFIG.ROUTES.SESSION,
        citizens: CONFIG.ROUTES.CITIZEN,
        admin: CONFIG.ROUTES.ADMIN,
        docs: CONFIG.ROUTES.SWAGGER,
      },
    });
  });

  // API Routes
  app.use(CONFIG.ROUTES.SESSION, authRoutes);
  app.use(CONFIG.ROUTES.CITIZEN, citizenRoutes);
  app.use(CONFIG.ROUTES.ADMIN, adminRoutes);
  app.use(CONFIG.ROUTES.REPORT, reportRoutes);

  // This must always be the last middleware added
  // TODO: Add error handler middleware here when implemented

  return app;
}

