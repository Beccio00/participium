import { Client } from 'pg';

/**
 * Creates the test database if it doesn't exist.
 * This function connects directly to PostgreSQL without specifying a database
 * and creates the participium_test database if needed.
 */
export async function createTestDatabaseIfNotExists(): Promise<void> {
  // Parse DATABASE_URL to get connection details
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://participium:participium_password@localhost:5432/participium_test';
  const url = new URL(databaseUrl);
  
  // Connect to default postgres database (not to participium_test which may not exist)
  const baseUrl = `postgresql://${url.username}:${url.password}@${url.hostname}:${url.port}/postgres`;
  
  const client = new Client({
    connectionString: baseUrl,
  });

  try {
    await client.connect();
    
    // Check if test database exists
    const dbName = url.pathname.slice(1); // Remove leading slash
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`🔧 Creating database "${dbName}"...`);
      // Create database (cannot use parameterized query for database name)
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully`);
    } else {
      console.log(`ℹ️  Database "${dbName}" already exists`);
    }
  } catch (error) {
    console.error('❌ Error creating test database:', error);
    throw error;
  } finally {
    await client.end();
  }
}