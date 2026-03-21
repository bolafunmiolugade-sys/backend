const pool = require("./db/config");
async function checkSchema() {
    try {
        const resLecturers = await pool.query("SELECT * FROM lecturers LIMIT 1");
        console.log("Columns in lecturers:", Object.keys(resLecturers.rows[0] || {}));
        console.log("Sample lecturer:", resLecturers.rows[0]);

        const resCourses = await pool.query("SELECT * FROM courses LIMIT 1");
        console.log("Columns in courses:", Object.keys(resCourses.rows[0] || {}));
        console.log("Sample course:", resCourses.rows[0]);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSchema();
