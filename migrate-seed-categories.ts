import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { categoryTable } from './shared/schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seedCategories() {
  try {
    console.log('Starting category seeding...');

    // Default categories with proper styling
    const defaultCategories = [
      {
        name: 'banking',
        displayName: 'Banking',
        description: 'Traditional banking institutions and services',
        color: '#3B82F6', // Blue
        icon: 'Landmark',
        createdBy: 3, // Super admin ID
      },
      {
        name: 'nbfc',
        displayName: 'NBFC',
        description: 'Non-Banking Financial Companies',
        color: '#8B5CF6', // Purple
        icon: 'Briefcase',
        createdBy: 3, // Super admin ID
      },
      {
        name: 'stock_exchange',
        displayName: 'Stock Exchange',
        description: 'Stock exchanges and securities trading platforms',
        color: '#10B981', // Green
        icon: 'TrendingUp',
        createdBy: 3, // Super admin ID
      },
    ];

    console.log('Inserting default categories...');
    
    for (const category of defaultCategories) {
      try {
        await db.insert(categoryTable).values(category).onConflictDoNothing();
        console.log(`✓ Created category: ${category.displayName}`);
      } catch (error) {
        console.log(`Category ${category.displayName} already exists or error occurred:`, error);
      }
    }

    console.log('✅ Category seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeding
seedCategories();