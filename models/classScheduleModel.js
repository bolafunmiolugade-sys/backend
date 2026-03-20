const pool = require("../db/config");

exports.createSchedule = async ({
  course_code,
  lecturer_name,
  location_lat,
  location_long,
  class_start_time,
  class_end_time,
  attendance_window_minutes = 10,
  radius_m,
}) => {


  const res = await pool.query(
    `INSERT INTO class_schedules (course_code, lecturer_name, location_lat, location_long, class_start_time, class_end_time, attendance_window_minutes, radius_m)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      course_code,
      lecturer_name,
      location_lat,
      location_long,
      class_start_time,
      class_end_time,
      attendance_window_minutes,
      radius_m,
    ]
  );
  
  // Fetch the joined data to include course_name
  const joinedRes = await pool.query(
    `SELECT s.*, c.course_name 
     FROM class_schedules s
     LEFT JOIN courses c ON s.course_code = c.course_id
     WHERE s.id = $1`, [res.rows[0].id]
  );
  return joinedRes.rows[0];
};


// Find the most recent active schedule for a course where class_start_time <= now() and still within attendance window
exports.findActiveScheduleForCourse = async (course_code) => {
  const res = await pool.query(
    `SELECT s.*, c.course_name FROM class_schedules s
     LEFT JOIN courses c ON s.course_code = c.course_id
     WHERE s.course_code = $1 
     AND s.is_active = true 
     AND s.class_start_time <= now() 
     AND now() <= (s.class_end_time + (COALESCE(s.attendance_window_minutes, 10) || ' minutes')::INTERVAL)
     ORDER BY s.class_start_time DESC LIMIT 1`,
    [course_code]
  );
  return res.rows[0];
};

// Get all schedules (for admin/lecturer views)
exports.getAllSchedules = async () => {
  const res = await pool.query(
    `SELECT s.*, c.course_name 
     FROM class_schedules s
     LEFT JOIN courses c ON s.course_code = c.course_id
     ORDER BY s.class_start_time DESC`
  );
  return res.rows;
};

// Optionally: find by id
exports.getById = async (id) => {
  const res = await pool.query(
    `SELECT s.*, c.course_name 
     FROM class_schedules s
     LEFT JOIN courses c ON s.course_code = c.course_id
     WHERE s.id = $1`, [id]
  );
  return res.rows[0];
};

// Update attendance window minutes for a schedule
exports.updateAttendanceWindow = async (id, attendance_window_minutes) => {
  const res = await pool.query(
    `UPDATE class_schedules SET attendance_window_minutes = $1 WHERE id = $2 RETURNING *`,
    [attendance_window_minutes, id]
  );
  return res.rows[0];
};

// Update an existing schedule's details (for lecturers)
exports.updateSchedule = async (id, updates) => {
  const {
    location_lat,
    location_long,
    class_start_time,
    class_end_time,
    attendance_window_minutes,
    radius_m,
  } = updates;


  // Build dynamic query based on provided fields (excluding undefined/null ones if you wanted to, but we'll assume a full update for simplicity or handle it via coalesce)

  const res = await pool.query(
    `UPDATE class_schedules 
     SET 
        location_lat = COALESCE($1, location_lat),
        location_long = COALESCE($2, location_long),
        class_start_time = COALESCE($3, class_start_time),
        class_end_time = COALESCE($4, class_end_time),
        attendance_window_minutes = COALESCE($5, attendance_window_minutes),
        radius_m = COALESCE($6, radius_m)
     WHERE id = $7 RETURNING *`,
    [
      location_lat,
      location_long,
      class_start_time,
      class_end_time,
      attendance_window_minutes,
      radius_m,
      id
    ]
  );
  
  // Fetch the joined data to include course_name
  const joinedRes = await pool.query(
    `SELECT s.*, c.course_name 
     FROM class_schedules s
     LEFT JOIN courses c ON s.course_code = c.course_id
     WHERE s.id = $1`, [id]
  );
  return joinedRes.rows[0];
};

// Delete a schedule by ID
exports.deleteSchedule = async (id) => {
  const res = await pool.query(
    `DELETE FROM class_schedules WHERE id = $1 RETURNING *`,
    [id]
  );
  return res.rows[0];
};
// Get all schedules with attendance stats (for admin)
exports.getAllSchedulesWithStats = async (filters = {}) => {
  const { department, level, lecturer_id } = filters;
  let query = `
    SELECT 
        s.id,
        s.course_code,
        c.course_name,
        c.department,
        c.level,
        s.lecturer_name,
        s.class_start_time,
        s.class_end_time,
        s.is_active,
        s.radius_m,
        (SELECT COUNT(*) FROM student_courses WHERE s.course_code = ANY(courses)) as registered_count,
        (SELECT COUNT(DISTINCT matric_number) FROM attendance_logs WHERE schedule_id = s.id AND status = 'VALID') as present_count
    FROM class_schedules s
    LEFT JOIN courses c ON s.course_code = c.course_id
    WHERE 1=1
  `;
  const params = [];

  if (department) {
    params.push(department);
    query += ` AND c.department = $${params.length}`;
  }
  if (level) {
    params.push(level);
    query += ` AND c.level = $${params.length}`;
  }
  if (lecturer_id) {
    params.push(lecturer_id);
    query += ` AND c.lecturer_id = $${params.length}`;
  }

  query += ` ORDER BY s.class_start_time DESC`;
  
  const res = await pool.query(query, params);

  return res.rows;
};

// Get detailed attendance list for a specific schedule
exports.getScheduleAttendanceDetails = async (scheduleId, courseCode, filters = {}) => {
  const { department, level } = filters;
  let query = `
    SELECT 
        u.full_name,
        u.matric_number,
        u.department,
        u.level,
        al.status,
        al.log_date as marked_at,
        al.distance_m
    FROM (
        SELECT matric_number FROM student_courses WHERE $2 = ANY(courses)
    ) sc
    JOIN users u ON sc.matric_number = u.matric_number
    LEFT JOIN attendance_logs al ON al.matric_number = u.matric_number AND al.schedule_id = $1
    WHERE 1=1
  `;
  const params = [scheduleId, courseCode];

  if (department) {
    params.push(department);
    query += ` AND u.department = $${params.length}`;
  }
  if (level) {
    params.push(level);
    query += ` AND u.level = $${params.length}`;
  }

  query += ` ORDER BY u.full_name ASC`;
  const res = await pool.query(query, params);
  return res.rows;
};
