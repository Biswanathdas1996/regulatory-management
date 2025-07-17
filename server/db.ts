import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";

// Create or connect to SQLite database file - use simple relative path
const dbPath = "database.sqlite";
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

export const db = drizzle({ client: sqlite, schema });
