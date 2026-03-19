const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
  connectionTimeoutMillis: 5000,
});

async function check() {
  try {
    console.log("Connecting to database...");
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_logs';
    `);
    console.log("Columns in attendance_logs:");
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    await pool.end();
  } catch (err) {
    console.error("Error checking schema:", err.message);
    process.exit(1);
  }
}

check();
