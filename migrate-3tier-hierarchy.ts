import { db } from "./server/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";

async function migrate3TierHierarchy() {
  console.log("Starting 3-tier hierarchy migration...");

  try {
    // Add new columns to users table
    console.log("Adding new columns to users table...");

    // Add role column (replacing the old integer role)
    await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS role CASCADE`);
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'reporting_entity'`
    );

    // Add category column
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS category TEXT`
    );

    // Add createdBy column
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INTEGER`
    );

    // Add timestamps
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL`
    );
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL`
    );

    // Add new columns to templates table
    console.log("Adding new columns to templates table...");

    // Add category column
    await db.execute(
      sql`ALTER TABLE templates ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'banking'`
    );

    // Add createdBy column
    await db.execute(
      sql`ALTER TABLE templates ADD COLUMN IF NOT EXISTS created_by INTEGER NOT NULL DEFAULT 1`
    );

    // Create default super admin user
    console.log("Creating default super admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await db.execute(sql`
      INSERT INTO users (username, password, role, category, created_at, updated_at)
      VALUES ('superadmin', ${hashedPassword}, 'super_admin', NULL, NOW(), NOW())
      ON CONFLICT (username) DO UPDATE SET 
        role = 'super_admin',
        category = NULL,
        updated_at = NOW()
    `);

    // Create default IFSCA users for each category
    console.log("Creating default IFSCA users...");

    const ifscaUsers = [
      { username: "ifsca_banking", category: "banking" },
      { username: "ifsca_nbfc", category: "nbfc" },
      { username: "ifsca_stock_exchange", category: "stock_exchange" },
    ];

    for (const user of ifscaUsers) {
      const ifscaPassword = await bcrypt.hash("ifsca123", 10);
      await db.execute(sql`
        INSERT INTO users (username, password, role, category, created_by, created_at, updated_at)
        VALUES (${user.username}, ${ifscaPassword}, 'ifsca_user', ${user.category}, 1, NOW(), NOW())
        ON CONFLICT (username) DO UPDATE SET 
          role = 'ifsca_user',
          category = ${user.category},
          created_by = 1,
          updated_at = NOW()
      `);
    }

    // Update existing users to be reporting entities if they're not already set
    console.log("Updating existing users to reporting entity role...");
    await db.execute(sql`
      UPDATE users 
      SET role = 'reporting_entity', 
          category = 'banking',
          updated_at = NOW()
      WHERE role NOT IN ('super_admin', 'ifsca_user')
    `);

    // Update existing templates to have default category
    console.log("Updating existing templates with default category...");
    await db.execute(sql`
      UPDATE templates 
      SET category = 'banking',
          created_by = 1,
          updated_at = NOW()
      WHERE category IS NULL OR category = ''
    `);

    console.log("Migration completed successfully!");
    console.log("\nDefault credentials created:");
    console.log("IFSCA: superadmin / admin123");
    console.log("IFSCA Banking: ifsca_banking / ifsca123");
    console.log("IFSCA NBFC: ifsca_nbfc / ifsca123");
    console.log("IFSCA Stock Exchange: ifsca_stock_exchange / ifsca123");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate3TierHierarchy()
    .then(() => {
      console.log("Migration script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

export { migrate3TierHierarchy };
