import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pkg from "pg";
const { Pool } = pkg;
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config(); // Load environment variables

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log("Starting migration...");

  try {
    await db.execute(sql`
      -- Add new status column to submissions table
      ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS status_updated_by integer REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS status_updated_at timestamp;
      
      -- Add system_generated column to comments table
      ALTER TABLE comments
      ADD COLUMN IF NOT EXISTS system_generated boolean NOT NULL DEFAULT false;
    `);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  await pool.end();
}

main();
