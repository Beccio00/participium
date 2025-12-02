import { AppDataSource } from "../utils/AppDataSource";

const MAX_RETRIES = parseInt(process.env.DB_RETRY_ATTEMPTS || "5");
const RETRY_DELAY = parseInt(process.env.DB_RETRY_DELAY || "3000");

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const initializeDatabase = async (): Promise<void> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Database connection attempt ${attempt}/${MAX_RETRIES}...`);
      await AppDataSource.initialize();
      console.log("✅ Database connection initialized successfully");
      
      // Run synchronization if enabled (creates tables)
      if (process.env.TYPEORM_SYNCHRONIZE === "true") {
        console.log("🔄 Synchronizing database schema...");
        await AppDataSource.synchronize();
        console.log("✅ Database schema synchronized");
      }
      
      return;
    } catch (error) {
      lastError = error as Error;
      console.warn(`❌ Database connection attempt ${attempt} failed:`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  console.error("💥 Failed to establish database connection after all attempts");
  throw new Error(`Database connection failed after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
};