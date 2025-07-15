import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, templates, categoryTable } from './shared/schema.js';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function migrateCategoryToIds() {
  try {
    console.log('Starting migration to use category IDs...');

    // First, get all categories
    const categories = await db.select().from(categoryTable);
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    
    console.log('Found categories:', Array.from(categoryMap.entries()));

    // Step 1: Add new columns for category IDs
    console.log('Adding categoryId columns...');
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);
    `);
    
    await pool.query(`
      ALTER TABLE templates 
      ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);
    `);

    // Step 2: Populate the new columns with category IDs based on category names
    console.log('Updating users with category IDs...');
    
    const allUsers = await db.select().from(users);
    for (const user of allUsers) {
      if (user.category && categoryMap.has(user.category)) {
        const categoryId = categoryMap.get(user.category);
        await db.update(users)
          .set({ 
            // @ts-ignore - We're adding a new column temporarily
            categoryId: categoryId 
          })
          .where(eq(users.id, user.id));
        console.log(`Updated user ${user.username} with categoryId ${categoryId}`);
      }
    }

    console.log('Updating templates with category IDs...');
    
    const allTemplates = await db.select().from(templates);
    for (const template of allTemplates) {
      if (template.category && categoryMap.has(template.category)) {
        const categoryId = categoryMap.get(template.category);
        await db.update(templates)
          .set({ 
            // @ts-ignore - We're adding a new column temporarily
            categoryId: categoryId 
          })
          .where(eq(templates.id, template.id));
        console.log(`Updated template ${template.name} with categoryId ${categoryId}`);
      }
    }

    // Step 3: Make categoryId NOT NULL and drop old category columns
    console.log('Finalizing schema changes...');
    
    // For users, categoryId can be NULL (for super_admin)
    await pool.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS category;
    `);
    
    await pool.query(`
      ALTER TABLE users 
      RENAME COLUMN category_id TO category;
    `);

    // First check if all templates have categoryId set
    const templatesWithoutCategory = await pool.query(`
      SELECT id, name FROM templates WHERE category_id IS NULL
    `);
    
    if (templatesWithoutCategory.rows.length > 0) {
      console.log('Found templates without categories:', templatesWithoutCategory.rows);
      // Set a default category (e.g., first available category)
      const defaultCategory = categories[0];
      await pool.query(`
        UPDATE templates 
        SET category_id = $1 
        WHERE category_id IS NULL
      `, [defaultCategory.id]);
      console.log(`Set default category ${defaultCategory.name} for templates without categories`);
    }
    
    // For templates, categoryId should NOT be NULL
    await pool.query(`
      ALTER TABLE templates 
      ALTER COLUMN category_id SET NOT NULL;
    `);
    
    await pool.query(`
      ALTER TABLE templates 
      DROP COLUMN IF EXISTS category;
    `);
    
    await pool.query(`
      ALTER TABLE templates 
      RENAME COLUMN category_id TO category;
    `);

    console.log('✅ Migration completed successfully!');
    console.log('Users and templates now use category IDs instead of category names.');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateCategoryToIds();