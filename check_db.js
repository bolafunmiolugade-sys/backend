const pool = require('./db/config');

async function checkData() {
  try {
    const courses = await pool.query('SELECT course_id, course_name, department, level FROM courses LIMIT 5');
    console.log('--- Sample Courses ---');
    console.table(courses.rows);

    const depts = await pool.query('SELECT DISTINCT department FROM courses');
    console.log('--- Unique Course Departments ---');
    console.table(depts.rows);

    const users = await pool.query('SELECT matric_number, level, department FROM users LIMIT 5');
    console.log('--- Sample Users ---');
    console.table(users.rows);

    const scheds = await pool.query('SELECT id, course_code FROM class_schedules LIMIT 5');
    console.log('--- Sample Schedules ---');
    console.table(scheds.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
