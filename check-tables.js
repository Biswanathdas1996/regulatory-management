const pkg = require("pg");
const { Pool } = pkg;
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE column_name = 'category'
      ORDER BY table_name
    `);

    console.log("All tables with category column:");
    result.rows.forEach((row) => {
      console.log(`${row.table_name}.${row.column_name}: ${row.data_type}`);
    });

    // Also check the actual table structure
    const tables = ["users", "templates", "submissions"];

    for (const table of tables) {
      try {
        const desc = await pool.query(
          `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`
        );
        console.log(`\n${table} table structure:`);
        desc.rows.forEach((col) => {
          console.log(
            `  ${col.column_name}: ${col.data_type} ${
              col.is_nullable === "YES" ? "NULL" : "NOT NULL"
            }`
          );
        });
      } catch (error) {
        console.log(`Table ${table} does not exist`);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
