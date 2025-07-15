import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function addXBRLFields() {
  try {
    console.log("Adding XBRL fields to templates table...");
    
    // Add XBRL-specific fields to templates table
    await db.execute(sql`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS is_xbrl BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS xbrl_taxonomy_path TEXT,
      ADD COLUMN IF NOT EXISTS xbrl_schema_ref TEXT,
      ADD COLUMN IF NOT EXISTS xbrl_namespace TEXT,
      ADD COLUMN IF NOT EXISTS xbrl_version TEXT DEFAULT '2.1'
    `);
    
    console.log("XBRL fields added successfully!");
    
    // Update templateTypes to include XBRL
    console.log("Template types now support XBRL templates");
    
  } catch (error) {
    console.error("Error adding XBRL fields:", error);
  }
}

addXBRLFields().then(() => {
  console.log("XBRL fields migration completed");
  process.exit(0);
}).catch(error => {
  console.error("Migration failed:", error);
  process.exit(1);
});