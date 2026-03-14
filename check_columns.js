const pool = require("./db/config");
async function checkSchema() {
    try {
        const res = await pool.query("SELECT * FROM attendance_logs LIMIT 0");
        console.log("attendance_logs columns:", res.fields.map(f => f.name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSchema();
