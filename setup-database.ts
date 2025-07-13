import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });

import { db } from "./server/db.js";
import { users } from "./shared/schema.js";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";

async function setupDatabase() {
  try {
    console.log("Setting up database...");

    // Check if role column exists
    try {
      await db.execute(sql`SELECT role FROM users LIMIT 1`);
      console.log("Role column already exists.");
    } catch (error) {
      console.log("Adding role column...");
      await db.execute(
        sql`ALTER TABLE users ADD COLUMN role integer DEFAULT 0`
      );
      console.log("Role column added successfully.");
    }

    // Check if admin user exists
    const adminExists = await db.execute(
      sql`SELECT id FROM users WHERE username = 'admin' LIMIT 1`
    );

    if (adminExists.rows.length === 0) {
      console.log("Creating default admin user...");
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        role: 1,
      });

      console.log(
        "Default admin user created with username: admin, password: admin123"
      );
    } else {
      console.log("Admin user already exists.");
    }

    console.log("Database setup complete!");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    process.exit(0);
  }
}

setupDatabase();
