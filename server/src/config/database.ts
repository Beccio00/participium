import { AppDataSource } from "../utils/AppDataSource";

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection initialized");
  } catch (error) {
    console.error("Error during database initialization:", error);
    throw error;
  }
};