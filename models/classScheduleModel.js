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
  return res.rows[0];
};


// Find the most recent active schedule for a course where class_start_time <= now() and still within attendance window
exports.findActiveScheduleForCourse = async (course_code) => {
  const res = await pool.query(
    `SELECT * FROM class_schedules 
     WHERE course_code = $1 
     AND is_active = true 
     AND class_start_time <= now() 
     AND now() <= (class_end_time + (COALESCE(attendance_window_minutes, 10) || ' minutes')::INTERVAL)
     ORDER BY class_start_time DESC LIMIT 1`,
    [course_code]
  );
  return res.rows[0];
};

// Get all schedules (for admin/lecturer views)
exports.getAllSchedules = async () => {
  const res = await pool.query(
    `SELECT * FROM class_schedules ORDER BY class_start_time DESC`
  );
  return res.rows;
};

// Optionally: find by id
exports.getById = async (id) => {
  const res = await pool.query(`SELECT * FROM class_schedules WHERE id = $1`, [
    id,
  ]);
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
  return res.rows[0];
};
