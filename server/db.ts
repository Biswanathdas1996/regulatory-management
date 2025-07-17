import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import fs from "fs";
import path from "path";

// Ensure the database directory exists
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "ifsca.db");

// Initialize SQLite database
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma("foreign_keys = ON");

// Create the database connection
export const db = drizzle(sqlite, { schema });

// Export for direct SQL operations if needed
export { sqlite };

console.log(`SQLite database initialized at: ${dbPath}`);