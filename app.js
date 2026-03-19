const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // Security headers
const morgan = require("morgan");
require("dotenv").config();

const apiRoutes = require("./routes/api");
const pool = require("./db/config");
const fs = require("fs");
const path = require("path");

const app = express();

// Auto-run migrations on startup
async function runMigrations() {
  try {
    const migrations = ["add_radius_m.sql"];

    for (const file of migrations) {
      const sqlPath = path.join(__dirname, "db", file);
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, "utf-8");
        console.log(`Running migration: ${file}...`);
        await pool.query(sql);
      }
    }
    console.log("✅ All migrations completed!");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  }
}
runMigrations();


// Middleware
app.use(helmet()); // Protects against common web vulnerabilities
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static("public"));

// Routes
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Real-world Backend running on http://localhost:${PORT}`);
});