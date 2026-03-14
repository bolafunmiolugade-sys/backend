const { Pool } = require("pg");
require("dotenv").config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // rejectUnauthorized: false,
    require: true,
  },
  family: 4,
});
pool.on("connect", () => {
  console.log("✅ Connected to the PostgreSQL database");
});
module.exports = pool;
