import "reflect-metadata";
import "dotenv/config";
import { createApp } from "./app";
import { initializeDatabase } from "./config/database";
import { AppDataSource } from "./utils/AppDataSource";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const runSeed = async (): Promise<void> => {
  try {
    console.log('🌱 Running database seed...');
    // Give a small delay to ensure tables are ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    const { stdout, stderr } = await execAsync('npm run seed');
    if (stdout) console.log('Seed output:', stdout);
    if (stderr) console.warn('Seed warnings:', stderr);
    console.log('✅ Database seed completed successfully');
  } catch (error) {
    console.error('🔥 Database seed failed:', (error as Error).message);
    // Don't throw - let the server continue even if seed fails
  }
};

const startServer = async () => {
  try {
    console.log('🚀 Starting Participium Server...');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      AUTO_SEED: process.env.AUTO_SEED,
      DATABASE_URL: process.env.DATABASE_URL ? '[REDACTED]' : 'Not set'
    });
    
    // Initialize database connection
    console.log('🔗 Initializing database connection...');
    await initializeDatabase();
    
    // Run seed if AUTO_SEED is enabled
    if (process.env.AUTO_SEED === "true") {
      console.log('🌱 AUTO_SEED enabled, running seed after server start...');
      // Start server first, then seed
      const app = createApp();
      const port = process.env.PORT || 4000;

      // Close database connection on shutdown
      process.on("SIGTERM", async () => {
        console.log('🚨 Received SIGTERM, closing database connection...');
        await AppDataSource.destroy();
      });

      // Start server
      const server = app.listen(port, async () => {
        console.log(`✅ Server is running on http://localhost:${port}`);
        
        // Run seed after server starts
        await runSeed();
      });
    } else {
      console.log('⏭️ AUTO_SEED disabled, skipping seed');
      const app = createApp();
      const port = process.env.PORT || 4000;

      // Close database connection on shutdown
      process.on("SIGTERM", async () => {
        console.log('🚨 Received SIGTERM, closing database connection...');
        await AppDataSource.destroy();
      });

      // Start server
      app.listen(port, () => {
        console.log(`✅ Server is running on http://localhost:${port}`);
      });
    }
  } catch (error) {
    console.error("💥 Failed to start server:", error);
    process.exit(1);
  }
};

startServer();