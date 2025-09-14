import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Database connection variables (no validation at import time)
let pool: Pool | null = null;
let db: any = null;

// Initialize database connection function (called safely from startup)
function initializeDatabase(): void {
  console.log('[DATABASE] Initializing database connection...');

  if (!process.env.DATABASE_URL) {
    console.error('[DATABASE ERROR] DATABASE_URL environment variable is not set');
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  // Validate DATABASE_URL format
  try {
    new URL(process.env.DATABASE_URL);
    console.log('[DATABASE] DATABASE_URL format validation passed');
  } catch (error) {
    console.error('[DATABASE ERROR] Invalid DATABASE_URL format:', error);
    throw new Error("DATABASE_URL must be a valid URL");
  }

  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

// Get database instance (initialize if needed)
export function getDb() {
  if (!db) {
    initializeDatabase();
  }
  return db;
}

// Get pool instance (initialize if needed)  
export function getPool(): Pool {
  if (!pool) {
    initializeDatabase();
  }
  return pool!; // Assert non-null after initialization
}

// Export for backward compatibility - use lazy initialization
const dbProxy = new Proxy({} as any, {
  get(target, prop) {
    const dbInstance = getDb();
    return dbInstance[prop];
  }
});

const poolProxy = new Proxy({} as any, {
  get(target, prop) {
    const poolInstance = getPool();
    return (poolInstance as any)[prop];
  }
});

export { dbProxy as db, poolProxy as pool };

// Database connection validation function
export async function validateDatabaseConnection(): Promise<void> {
  console.log('[DATABASE] Testing database connection...');
  try {
    // Initialize database if not already done
    const dbInstance = getDb();
    
    // Test basic connection using proper Drizzle syntax
    const result = await dbInstance.execute(sql`SELECT 1 as test`);
    console.log('[DATABASE] Connection test successful');
    
    // Test schema access
    const tables = await dbInstance.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `);
    console.log(`[DATABASE] Found ${tables.rowCount} tables in database`);
    console.log('[DATABASE] Database validation completed successfully');
    
  } catch (error) {
    console.error('[DATABASE ERROR] Database connection validation failed:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Graceful shutdown for database connections
export async function closeDatabaseConnection(): Promise<void> {
  try {
    console.log('[DATABASE] Closing database connections...');
    // Only close if pool was already initialized
    if (pool) {
      await pool.end();
      console.log('[DATABASE] Database connections closed successfully');
    }
  } catch (error) {
    console.error('[DATABASE ERROR] Error closing database connections:', error);
  }
}