import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { getApiInfo } from "../controllers/rootController";
import { AppDataSource } from "../utils/AppDataSource";

const router = Router();

router.get("/", asyncHandler(getApiInfo));
router.get("/health", async (req, res) => {
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "participium-server",
    uptime: process.uptime(),
    database: "disconnected",
    version: process.env.npm_package_version || "unknown"
  };

  try {
    if (AppDataSource.isInitialized) {
      // Simple query to test database connection
      await AppDataSource.query("SELECT 1");
      healthStatus.database = "connected";
    }
  } catch (error) {
    console.warn("Health check database query failed:", error);
    healthStatus.database = "error";
    healthStatus.status = "degraded";
  }

  const statusCode = healthStatus.status === "ok" ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

export default router;
