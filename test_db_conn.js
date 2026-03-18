const pool = require("./db/config");
async function testConn() {
    try {
        const res = await pool.query("SELECT 1 as test");
        console.log("Connection test:", res.rows[0].test);
        process.exit(0);
    } catch (err) {
        console.error("Connection failed:", err.message);
        process.exit(1);
    }
}
testConn();
