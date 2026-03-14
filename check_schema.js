const pool = require("./db/config");
async function checkSchema() {
    try {
        const res = await pool.query("SELECT * FROM attendance_logs LIMIT 1");
        console.log("Columns in attendance_logs:", Object.keys(res.rows[0] || {}));
        const resUsers = await pool.query("SELECT * FROM users LIMIT 1");
        console.log("Columns in users:", Object.keys(resUsers.rows[0] || {}));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSchema();
