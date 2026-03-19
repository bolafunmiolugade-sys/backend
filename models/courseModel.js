const pool = require("../db/config");

exports.getAllCourses = async () => {
  const res = await pool.query(
    `SELECT c.course_id, c.course_name, c.center_lat, c.center_lon, c.radius_m, 
            c.department, c.department_code, c.lecturer_id, l.full_name as lecturer_name
     FROM courses c
     LEFT JOIN lecturers l ON c.lecturer_id = l.id
     ORDER BY c.course_id`
  );
  return res.rows;
};

exports.getCourseById = async (courseId) => {
  const res = await pool.query(
    `SELECT c.course_id, c.course_name, c.center_lat, c.center_lon, c.radius_m, 
            c.department, c.department_code, c.lecturer_id, l.full_name as lecturer_name
     FROM courses c
     LEFT JOIN lecturers l ON c.lecturer_id = l.id
     WHERE c.course_id = $1`,
    [courseId]
  );
  return res.rows[0];
};

exports.getCourseByCourseCode = async (course_id) => {
  const res = await pool.query(
    `SELECT c.course_id, c.course_name, c.center_lat, c.center_lon, c.radius_m, 
            c.department, c.department_code, c.lecturer_id, l.full_name as lecturer_name
     FROM courses c
     LEFT JOIN lecturers l ON c.lecturer_id = l.id
     WHERE c.course_id = $1`,
    [course_id]
  );
  return res.rows[0];
};

exports.getCoursesByLecturerId = async (lecturerId) => {
  const res = await pool.query(
    `SELECT c.course_id, c.course_name, c.center_lat, c.center_lon, c.radius_m, 
            c.department, c.department_code, c.lecturer_id, l.full_name as lecturer_name
     FROM courses c
     LEFT JOIN lecturers l ON c.lecturer_id = l.id
     WHERE c.lecturer_id = $1
     ORDER BY c.course_id`,
    [lecturerId]
  );
  return res.rows;
};

exports.assignLecturer = async (courseId, lecturerId) => {
  const res = await pool.query(
    `UPDATE courses SET lecturer_id = $2 WHERE course_id = $1 RETURNING *`,
    [courseId, lecturerId]
  );
  return res.rows[0];
};

exports.createCourse = async ({
  course_id,
  course_name,
  center_lat,
  center_lon,
  radius_m = 40,
  department,
  department_code,
  lecturer_id = null,
}) => {
  const res = await pool.query(
    `INSERT INTO courses (course_id, course_name, center_lat, center_lon, radius_m, department, department_code, lecturer_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [course_id, course_name, center_lat, center_lon, radius_m, department, department_code, lecturer_id]
  );
  return res.rows[0];
};

exports.updateCourse = async (
  courseId,
  {
    course_name = null,
    center_lat = null,
    center_lon = null,
    radius_m = null,
    department = null,
    department_code = null,
    lecturer_id = null,
  } = {}
) => {
  const res = await pool.query(
    `UPDATE courses
     SET course_name = COALESCE($2, course_name),
         center_lat = COALESCE($3, center_lat),
         center_lon = COALESCE($4, center_lon),
         radius_m = COALESCE($5, radius_m),
         department = COALESCE($6, department),
         department_code = COALESCE($7, department_code),
         lecturer_id = COALESCE($8, lecturer_id)
     WHERE course_id = $1
     RETURNING *`,
    [courseId, course_name, center_lat, center_lon, radius_m, department, department_code, lecturer_id]
  );
  return res.rows[0];
};

exports.getUniqueDepartments = async () => {
  // Get departments from both courses and users to cover all bases
  const res = await pool.query(
    `SELECT DISTINCT department FROM (
      SELECT department FROM courses WHERE department IS NOT NULL AND department <> ''
      UNION
      SELECT department FROM users WHERE department IS NOT NULL AND department <> ''
    ) combined_depts ORDER BY department`
  );
  return res.rows.map(r => r.department);
};

exports.deleteCourse = async (courseId) => {
  const res = await pool.query(
    `DELETE FROM courses WHERE course_id = $1 RETURNING *`,
    [courseId]
  );
  return res.rows[0];
};
