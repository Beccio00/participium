import "reflect-metadata";
import "dotenv/config";
import { createApp } from "./app";
import { initializeDatabase } from "./config/database";
import { AppDataSource } from "./utils/AppDataSource";

const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    const app = createApp();
    const port = process.env.PORT || 4000;

    // Close database connection on shutdown
    process.on("SIGTERM", async () => {
      await AppDataSource.destroy();
    });

    // Start server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();