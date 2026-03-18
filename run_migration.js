const pool = require("./db/config");
const fs = require("fs");
const path = require("path");

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, "db", "fix_attendance_logs_id.sql");
        const sql = fs.readFileSync(sqlPath, "utf-8");
        console.log("Running migration...");
        await pool.query(sql);
        console.log("✅ Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}
runMigration();
