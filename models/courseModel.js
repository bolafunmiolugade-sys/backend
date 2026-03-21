const pool = require("../db/config");

exports.getAllCourses = async (department = null, level = null) => {
  let query = `SELECT c.course_id, c.course_name, c.center_lat, c.center_lon, c.radius_m, 
            c.department, c.department_code, c.level, c.lecturer_id, l.full_name as lecturer_name,
            (SELECT COUNT(*) FROM student_courses sc WHERE c.course_id = ANY(sc.courses)) as student_count
     FROM courses c
     LEFT JOIN lecturers l ON c.lecturer_id = l.id`;
  
  const params = [];
  const filters = [];

  if (department) {
    params.push(department);
    filters.push(`c.department = $${params.length}`);
  }
  if (level) {
    params.push(level);
    filters.push(`c.level = $${params.length}`);
  }

  if (filters.length > 0) {
    query += " WHERE " + filters.join(" AND ");
  }

  query += ` ORDER BY c.department ASC, c.level ASC, c.course_id ASC`;

  const res = await pool.query(query, params);
  return res.rows;
};

exports.getCourseById = async (courseId) => {
  const res = await pool.query(
    `SELECT c.course_id, c.course_name, c.center_lat, c.center_lon, c.radius_m, 
            c.department, c.department_code, c.level, c.lecturer_id, l.full_name as lecturer_name,
            (SELECT COUNT(*) FROM student_courses sc WHERE c.course_id = ANY(sc.courses)) as student_count
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
            c.department, c.department_code, c.level, c.lecturer_id, l.full_name as lecturer_name
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
            c.department, c.department_code, c.level, c.lecturer_id, l.full_name as lecturer_name,
            (SELECT COUNT(*) FROM student_courses sc WHERE c.course_id = ANY(sc.courses)) as student_count
     FROM courses c
     LEFT JOIN lecturers l ON c.lecturer_id = l.id
     WHERE c.lecturer_id = $1
     ORDER BY c.department ASC, c.level ASC, c.course_id ASC`,
    [lecturerId]
  );
  return res.rows;
};

exports.getCourseMembers = async (courseId) => {
  const res = await pool.query(
    `SELECT u.user_id, u.full_name, u.matric_number, u.email, u.level, u.department
     FROM users u
     JOIN student_courses sc ON u.matric_number = sc.matric_number
     WHERE $1 = ANY(sc.courses)
     ORDER BY u.full_name ASC`,
    [courseId]
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
  level,
  lecturer_id = null,
}) => {
  const res = await pool.query(
    `INSERT INTO courses (course_id, course_name, center_lat, center_lon, radius_m, department, department_code, level, lecturer_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [course_id, course_name, center_lat, center_lon, radius_m, department, department_code, level, lecturer_id]
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
    level = null,
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
         level = COALESCE($8, level),
         lecturer_id = COALESCE($9, lecturer_id)
     WHERE course_id = $1
     RETURNING *`,
    [courseId, course_name, center_lat, center_lon, radius_m, department, department_code, level, lecturer_id]
  );
  return res.rows[0];
};

exports.getUniqueDepartments = async () => {
  // Get departments from both courses and users to cover all bases
  // Use INITCAP and TRIM to ensure uniqueness regardless of casing or extra spaces
  const res = await pool.query(
    `SELECT DISTINCT INITCAP(TRIM(department)) as department FROM (
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
