import "./setupEnv";
import { setupTestDatabase, disconnectDatabase } from "./testSetup";

let isSetupDone = false;

/**
 * Global setup for Jest - runs once before all tests
 */
export default async function globalSetup(): Promise<void> {
  if (!isSetupDone) {
    console.log("🔧 Setting up test environment...");
    try {
      await setupTestDatabase();
      console.log("✅ Test database setup complete");
      isSetupDone = true;
    } catch (error) {
      console.error("❌ Test setup failed:", error);
      throw error;
    }
  }
}

/**
 * Global teardown for Jest - runs once after all tests
 */
export async function globalTeardown(): Promise<void> {
  try {
    await disconnectDatabase();
    console.log("✅ Test cleanup complete");
  } catch (error) {
    console.error("❌ Test cleanup failed:", error);
  }
}