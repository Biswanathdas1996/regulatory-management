import { db, sqlite } from "./server/db";
import { 
  categoryTable, 
  users, 
  templates, 
  templateSheets, 
  validationRules, 
  validationResults, 
  templateSchemas, 
  processingStatus, 
  submissions, 
  comments 
} from "@shared/schema";
import bcrypt from "bcrypt";

async function setupDatabase() {
  console.log("Setting up SQLite database...");
  
  try {
    // Create all tables using raw SQL first
    console.log("Creating tables...");
    
    // Categories table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        icon TEXT DEFAULT 'Building',
        is_active INTEGER DEFAULT 1,
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'reporting_entity',
        category INTEGER REFERENCES categories(id),
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Templates table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        template_type TEXT,
        category INTEGER NOT NULL REFERENCES categories(id),
        frequency TEXT NOT NULL,
        last_submission_date TEXT,
        json_schema TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        validation_rules_path TEXT,
        validation_file_uploaded INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        is_xbrl INTEGER DEFAULT 0,
        xbrl_taxonomy_path TEXT,
        xbrl_schema_ref TEXT,
        xbrl_namespace TEXT,
        xbrl_version TEXT DEFAULT '2.1',
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Template sheets table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS template_sheets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        sheet_name TEXT NOT NULL,
        sheet_index INTEGER NOT NULL,
        data_point_count INTEGER NOT NULL,
        extracted_data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Validation rules table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS validation_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        sheet_id INTEGER REFERENCES template_sheets(id),
        rule_type TEXT NOT NULL,
        field TEXT NOT NULL,
        condition TEXT NOT NULL,
        error_message TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'error',
        row_range TEXT,
        column_range TEXT,
        cell_range TEXT,
        apply_to_all_rows INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Submissions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        category INTEGER NOT NULL REFERENCES categories(id),
        status TEXT NOT NULL DEFAULT 'pending',
        status_updated_by INTEGER REFERENCES users(id),
        status_updated_at TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        reporting_period TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Validation results table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS validation_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL REFERENCES submissions(id),
        rule_id INTEGER REFERENCES validation_rules(id),
        field TEXT NOT NULL,
        rule_type TEXT,
        condition TEXT,
        cell_reference TEXT,
        cell_value TEXT,
        message TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'error',
        is_valid INTEGER NOT NULL DEFAULT 0,
        sheet_name TEXT,
        row_number INTEGER,
        column_number INTEGER,
        column_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Template schemas table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS template_schemas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        sheet_id INTEGER REFERENCES template_sheets(id),
        schema_data TEXT NOT NULL,
        ai_confidence INTEGER NOT NULL,
        extraction_notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Processing status table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS processing_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        step TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        progress INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Comments table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        parent_comment_id INTEGER,
        text TEXT NOT NULL,
        system_generated INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    console.log("Tables created successfully!");
    
    // Insert default categories
    console.log("Inserting default categories...");
    await db.insert(categoryTable).values([
      {
        id: 1,
        name: "banking",
        displayName: "Banking",
        description: "Banking institutions regulated under IFSCA",
        color: "#3B82F6",
        icon: "Building2",
        isActive: true,
      },
      {
        id: 2,
        name: "nbfc",
        displayName: "NBFC",
        description: "Non-Banking Financial Companies",
        color: "#10B981",
        icon: "CreditCard",
        isActive: true,
      },
      {
        id: 3,
        name: "stock_exchange",
        displayName: "Stock Exchange",
        description: "Stock exchanges and trading platforms",
        color: "#8B5CF6",
        icon: "TrendingUp",
        isActive: true,
      },
    ]).onConflictDoNothing();

    // Create default users
    console.log("Creating default users...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    await db.insert(users).values([
      {
        id: 1,
        username: "super_admin",
        password: hashedPassword,
        role: "IFSCA",
        category: null,
      },
      {
        id: 2,
        username: "banking_admin",
        password: hashedPassword,
        role: "IFSCA_USER",
        category: 1,
        createdBy: 1,
      },
      {
        id: 3,
        username: "nbfc_admin",
        password: hashedPassword,
        role: "IFSCA_USER", 
        category: 2,
        createdBy: 1,
      },
      {
        id: 4,
        username: "stock_admin",
        password: hashedPassword,
        role: "IFSCA_USER",
        category: 3,
        createdBy: 1,
      },
      {
        id: 5,
        username: "reporting_entity_1",
        password: hashedPassword,
        role: "REPORTING_ENTITY",
        category: 1,
        createdBy: 2,
      },
    ]).onConflictDoNothing();

    console.log("SQLite database setup completed successfully!");
    console.log("Default users created:");
    console.log("- super_admin (IFSCA) - password: password123");
    console.log("- banking_admin (IFSCA_USER) - password: password123");
    console.log("- nbfc_admin (IFSCA_USER) - password: password123");
    console.log("- stock_admin (IFSCA_USER) - password: password123");
    console.log("- reporting_entity_1 (REPORTING_ENTITY) - password: password123");
    
  } catch (error) {
    console.error("Error setting up database:", error);
    throw error;
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log("Database setup complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database setup failed:", error);
    process.exit(1);
  });