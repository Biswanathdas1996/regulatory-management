import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });

import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addRoleColumn() {
  try {
    console.log("Adding role column to users table...");

    const client = await pool.connect();

    // Check if role column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role' AND table_schema = 'public';
    `);

    if (checkResult.rows.length > 0) {
      console.log("Role column already exists in users table.");
      client.release();
      return;
    }

    // Add the role column
    await client.query(
      'ALTER TABLE "public"."users" ADD COLUMN "role" integer DEFAULT 0;'
    );

    console.log("Successfully added role column to users table.");
    client.release();
  } catch (error) {
    console.error("Error adding role column:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addRoleColumn();
