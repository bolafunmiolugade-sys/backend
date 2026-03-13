const fs = require("fs");
const path = require("path");
const pool = require("../db/config");

async function setup() {
  try {
    const sqlPath = path.join(__dirname, "../db/create_password_resets.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    await pool.query(sql);
    console.log("Successfully created password_resets table.");
  } catch (err) {
    console.error("Error creating password_resets table:", err);
  } finally {
    pool.end();
  }
}

setup();
