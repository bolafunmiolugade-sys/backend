const pool = require("./db/config");

async function migrate() {
  try {
    console.log("Adding department and department_code columns to courses table...");
    await pool.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS department VARCHAR(255),
      ADD COLUMN IF NOT EXISTS department_code VARCHAR(50);
    `);
    console.log("Migration successful!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
