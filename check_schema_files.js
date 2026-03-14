const pool = require("./db/config");
const fs = require("fs");
async function checkSchema() {
    try {
        const res = await pool.query("SELECT * FROM attendance_logs LIMIT 0");
        const columns = res.fields.map(f => f.name);
        fs.writeFileSync("columns_output.json", JSON.stringify(columns));
        const resUsers = await pool.query("SELECT * FROM users LIMIT 0");
        const userColumns = resUsers.fields.map(f => f.name);
        fs.writeFileSync("user_columns_output.json", JSON.stringify(userColumns));
        process.exit(0);
    } catch (err) {
        fs.writeFileSync("columns_error.txt", err.stack);
        process.exit(1);
    }
}
checkSchema();
