const fs = require("fs");
const path = require("path");
const pool = require("../db/config");

async function setup() {
  try {
    const sqlPath = path.join(__dirname, "../db/create_lecturers.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    await pool.query(sql);
    console.log("Successfully created lecturers table.");
  } catch (err) {
    console.error("Error creating lecturers table:", err);
  } finally {
    pool.end();
  }
}

setup();
