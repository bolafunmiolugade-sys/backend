const pool = require("./db/config");
async function checkSchema() {
    try {
        const res = await pool.query("SELECT * FROM class_schedules LIMIT 0");
        console.log("class_schedules columns:", res.fields.map(f => f.name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSchema();
