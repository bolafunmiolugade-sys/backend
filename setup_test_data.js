const pool = require("./db/config");
async function setupTestData() {
    try {
        const userRes = await pool.query("SELECT user_id FROM users WHERE matric_number = '230601037'");
        if (userRes.rows.length === 0) {
            console.error("Student not found");
            process.exit(1);
        }
        const userId = userRes.rows[0].user_id;
        
        // Insert dummy log
        const logRes = await pool.query(`
            INSERT INTO attendance_logs 
            (user_id, matric_number, course_id, schedule_id, device_uuid, status, distance_m, accuracy_m, log_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)
            RETURNING *
        `, [userId, '230601037', 'TEST202', 1, 'test-uuid-123', 'VALID', 5.2, 1.5]);
        
        console.log("Inserted log:", logRes.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
setupTestData();
