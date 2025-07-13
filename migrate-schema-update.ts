#!/usr/bin/env tsx

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be provided");
}

const sql = neon(process.env.DATABASE_URL);

async function migrateSchema() {
  console.log("🔄 Starting schema migration...");

  try {
    // Begin transaction
    await sql`BEGIN`;

    console.log("📋 Step 1: Backing up existing data...");

    // Create temporary backup tables for validation_results
    await sql`
      CREATE TABLE IF NOT EXISTS validation_results_backup AS 
      SELECT * FROM validation_results;
    `;

    // Create temporary backup table for submissions
    await sql`
      CREATE TABLE IF NOT EXISTS submissions_backup AS
      SELECT * FROM submissions;
    `;

    console.log("✅ Data backed up successfully");

    console.log("🔄 Step 2: Updating validation_results table...");

    // Add new columns to validation_results if they don't exist
    await sql`
      ALTER TABLE validation_results 
      ADD COLUMN IF NOT EXISTS message text,
      ADD COLUMN IF NOT EXISTS row_number integer,
      ADD COLUMN IF NOT EXISTS column_number integer,
      ADD COLUMN IF NOT EXISTS cell_value text,
      ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
    `;

    // Migrate data from old columns to new columns
    await sql`
      UPDATE validation_results 
      SET 
        message = COALESCE(error_message, 'Validation issue'),
        created_at = COALESCE(created_at, now())
      WHERE message IS NULL;
    `;

    // Make message column NOT NULL after data migration
    await sql`
      ALTER TABLE validation_results 
      ALTER COLUMN message SET NOT NULL;
    `;

    console.log("🔄 Step 3: Updating submissions table...");

    // Add created_at to submissions if it doesn't exist
    await sql`
      ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
    `;

    // Migrate submitted_at to created_at if it exists
    await sql`
      UPDATE submissions 
      SET created_at = COALESCE(submitted_at, created_at, now())
      WHERE created_at IS NULL OR created_at IS NULL;
    `;

    // Make created_at NOT NULL
    await sql`
      ALTER TABLE submissions 
      ALTER COLUMN created_at SET NOT NULL;
    `;

    console.log("🔄 Step 4: Dropping old columns...");

    // Drop old columns from validation_results (be careful here)
    const oldValidationColumns = ["value", "passed", "error_message"];
    for (const column of oldValidationColumns) {
      try {
        await sql(
          `ALTER TABLE validation_results DROP COLUMN IF EXISTS "${column}"`
        );
        console.log(`  ✅ Dropped column: ${column}`);
      } catch (error) {
        console.log(
          `  ⚠️  Column ${column} might not exist or has dependencies`
        );
      }
    }

    // Drop old columns from submissions
    const oldSubmissionColumns = [
      "validation_errors",
      "validation_warnings",
      "submitted_at",
      "validated_at",
    ];
    for (const column of oldSubmissionColumns) {
      try {
        await sql(`ALTER TABLE submissions DROP COLUMN IF EXISTS "${column}"`);
        console.log(`  ✅ Dropped column: ${column}`);
      } catch (error) {
        console.log(
          `  ⚠️  Column ${column} might not exist or has dependencies`
        );
      }
    }

    // Commit transaction
    await sql`COMMIT`;

    console.log("✅ Schema migration completed successfully!");
    console.log(
      "💡 Backup tables created: validation_results_backup, submissions_backup"
    );
    console.log("🚨 You can now run 'yarn db:push' safely");
  } catch (error) {
    // Rollback on error
    await sql`ROLLBACK`;
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
migrateSchema()
  .then(() => {
    console.log("🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });
