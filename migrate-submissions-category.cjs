const pkg = require("pg");
const { Pool } = pkg;
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateSubmissionsCategory() {
  try {
    console.log("Starting migration of submissions table category column...");

    // First, get all categories
    const categoriesResult = await pool.query(
      "SELECT id, name FROM categories ORDER BY id"
    );
    const categoryMap = new Map(
      categoriesResult.rows.map((c) => [c.name, c.id])
    );

    console.log("Found categories:", Array.from(categoryMap.entries()));

    // Step 1: Add new column for category ID
    console.log("Adding categoryId column to submissions...");

    await pool.query(`
      ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);
    `);

    // Step 2: Populate the new column with category IDs based on category names
    console.log("Updating submissions with category IDs...");

    const allSubmissions = await pool.query(
      "SELECT id, category FROM submissions"
    );
    for (const submission of allSubmissions.rows) {
      if (submission.category && categoryMap.has(submission.category)) {
        const categoryId = categoryMap.get(submission.category);
        await pool.query(
          "UPDATE submissions SET category_id = $1 WHERE id = $2",
          [categoryId, submission.id]
        );
        console.log(
          `Updated submission ${submission.id} with categoryId ${categoryId}`
        );
      } else {
        // Set a default category if the current category doesn't match
        const defaultCategoryId = categoriesResult.rows[0].id; // Use first category as default
        await pool.query(
          "UPDATE submissions SET category_id = $1 WHERE id = $2",
          [defaultCategoryId, submission.id]
        );
        console.log(
          `Updated submission ${submission.id} with default categoryId ${defaultCategoryId}`
        );
      }
    }

    // Step 3: Make categoryId NOT NULL and drop old category column
    console.log("Finalizing schema changes...");

    // Check if all submissions have categoryId set
    const submissionsWithoutCategory = await pool.query(
      "SELECT id FROM submissions WHERE category_id IS NULL"
    );

    if (submissionsWithoutCategory.rows.length > 0) {
      console.log(
        "Found submissions without categories:",
        submissionsWithoutCategory.rows.length
      );
      // Set a default category
      const defaultCategory = categoriesResult.rows[0];
      await pool.query(
        "UPDATE submissions SET category_id = $1 WHERE category_id IS NULL",
        [defaultCategory.id]
      );
      console.log(
        `Set default category ${defaultCategory.name} for submissions without categories`
      );
    }

    // Make categoryId NOT NULL
    await pool.query(
      "ALTER TABLE submissions ALTER COLUMN category_id SET NOT NULL"
    );

    // Drop old category column
    await pool.query("ALTER TABLE submissions DROP COLUMN IF EXISTS category");

    // Rename categoryId to category
    await pool.query(
      "ALTER TABLE submissions RENAME COLUMN category_id TO category"
    );

    console.log("✅ Submissions table migration completed successfully!");
    console.log("Submissions now use category IDs instead of category names.");
  } catch (error) {
    console.error("❌ Error during submissions migration:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateSubmissionsCategory();
