import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Configure neon for serverless environment
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 60000,
  max: 20,
});

export const db = drizzle({ client: pool, schema });
