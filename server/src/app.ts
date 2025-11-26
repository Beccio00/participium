import "dotenv/config";
import { Request, Response, NextFunction } from "express";
import express, { Express } from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { CONFIG } from "./config/constants";
import { configurePassport } from "./config/passport";
import { errorHandler } from "./middlewares/errorMiddleware";
import rootRoutes from "./routes/rootRoutes";
import authRoutes from "./routes/authRoutes";
import citizenRoutes from "./routes/citizenRoutes";
import adminRoutes from "./routes/adminRoutes";
import reportRoutes from "./routes/reportRoutes";
import { ApiValidationMiddleware } from "./middlewares/validationMiddlewere";
import { initMinio } from "./utils/minioClient";

export function createApp(): Express {
  const app: Express = express();
  // Log tutte le richieste HTTP
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: CONFIG.CORS.ORIGIN,
      credentials: CONFIG.CORS.CREDENTIALS,
      methods: CONFIG.CORS.METHODS,
    })
  );

  app.use(
    session({
      secret: CONFIG.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );

  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(
    CONFIG.ROUTES.SWAGGER,
    swaggerUi.serve,
    swaggerUi.setup(YAML.load(CONFIG.SWAGGER_FILE_PATH))
  );

  app.use(ApiValidationMiddleware);

  app.use(CONFIG.ROUTES.ROOT, rootRoutes);
  app.use(CONFIG.ROUTES.SESSION, authRoutes);
  app.use(CONFIG.ROUTES.CITIZEN, citizenRoutes);
  app.use(CONFIG.ROUTES.ADMIN, adminRoutes);
  app.use(CONFIG.ROUTES.REPORTS, reportRoutes);

  app.use(errorHandler);
  // Log errori runtime
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Errore runtime:", err);
    next(err);
  });
  initMinio().then(() => {
    console.log("MinIO initialized successfully");
  });

  return app;
}
