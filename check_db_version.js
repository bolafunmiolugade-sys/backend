const pool = require("./db/config");
async function checkVersion() {
    try {
        console.log("Checking DB connection...");
        const res = await pool.query("SELECT version()");
        console.log("Connected to:", res.rows[0].version);
        process.exit(0);
    } catch (err) {
        console.error("Connection failed:", err.message);
        process.exit(1);
    }
}
checkVersion();
