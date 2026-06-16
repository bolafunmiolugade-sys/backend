const pool = require("../db/config");

const courseSelect = `c.course_id, c.course_name, c.center_lat, c.center_lon, c.radius_m, 
            c.department, c.department_code, c.level, c.eligible_departments, c.lecturer_id, l.full_name as lecturer_name`;

exports.getAllCourses = async (department = null, level = null) => {
  let query = `SELECT ${courseSelect},
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
    `SELECT ${courseSelect},
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
    `SELECT ${courseSelect}
     FROM courses c
     LEFT JOIN lecturers l ON c.lecturer_id = l.id
     WHERE c.course_id = $1`,
    [course_id]
  );
  return res.rows[0];
};

exports.getCoursesByLecturerId = async (lecturerId) => {
  const res = await pool.query(
    `SELECT ${courseSelect},
            (SELECT COUNT(*) FROM student_courses sc WHERE c.course_id = ANY(sc.courses)) as student_count
     FROM courses c
     LEFT JOIN lecturers l ON c.lecturer_id = l.id
     WHERE c.lecturer_id = $1
     ORDER BY c.department ASC, c.level ASC, c.course_id ASC`,
    [lecturerId]
  );
  return res.rows;
};

exports.getEligibleCoursesForStudent = async (matricNumber) => {
  const res = await pool.query(
    `WITH student AS (
       SELECT matric_number, level, department
       FROM users
       WHERE matric_number = $1
     ),
     student_with_code AS (
       SELECT s.*,
              UPPER(REGEXP_REPLACE(s.department, '[[:space:]]+', '', 'g')) AS department_key,
              (
                SELECT UPPER(REGEXP_REPLACE(c2.department_code, '[[:space:]]+', '', 'g'))
                FROM courses c2
                WHERE c2.department_code IS NOT NULL
                  AND REGEXP_REPLACE(c2.department_code, '[[:space:]]+', '', 'g') <> ''
                  AND LOWER(TRIM(c2.department)) = LOWER(TRIM(s.department))
                ORDER BY c2.course_id ASC
                LIMIT 1
              ) AS department_code
       FROM student s
     )
     SELECT c.course_id, c.course_name, c.center_lat, c.center_lon, c.radius_m,
            INITCAP(TRIM(s.department)) as department,
            COALESCE(s.department_code, UPPER(REGEXP_REPLACE(s.department, '[[:space:]]+', '', 'g'))) as department_code,
            c.department as owning_department,
            c.department_code as owning_department_code,
            c.level, c.eligible_departments, c.lecturer_id, l.full_name as lecturer_name,
            (SELECT COUNT(*) FROM student_courses sc WHERE c.course_id = ANY(sc.courses)) as student_count
     FROM courses c
     LEFT JOIN lecturers l ON c.lecturer_id = l.id
     CROSS JOIN student_with_code s
     WHERE c.level = s.level
       AND (
         LOWER(TRIM(c.department)) = LOWER(TRIM(s.department))
         OR (
           s.department_code IS NOT NULL
           AND UPPER(REGEXP_REPLACE(c.department_code, '[[:space:]]+', '', 'g')) = s.department_code
         )
         OR (
           s.department_code IS NOT NULL
           AND s.department_code = ANY(
             ARRAY(SELECT UPPER(REGEXP_REPLACE(value, '[[:space:]]+', '', 'g')) FROM unnest(c.eligible_departments) AS value)
           )
         )
         OR s.department_key = ANY(
           ARRAY(SELECT UPPER(REGEXP_REPLACE(value, '[[:space:]]+', '', 'g')) FROM unnest(c.eligible_departments) AS value)
         )
         OR 'ALL' = ANY(
           ARRAY(SELECT UPPER(REGEXP_REPLACE(value, '[[:space:]]+', '', 'g')) FROM unnest(c.eligible_departments) AS value)
         )
       )
     ORDER BY c.department ASC, c.level ASC, c.course_id ASC`,
    [matricNumber]
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
  eligible_departments = null,
}) => {
  const res = await pool.query(
    `INSERT INTO courses (course_id, course_name, center_lat, center_lon, radius_m, department, department_code, level, lecturer_id, eligible_departments)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [course_id, course_name, center_lat, center_lon, radius_m, department, department_code, level, lecturer_id, eligible_departments]
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
    eligible_departments = undefined,
  } = {}
) => {
  const hasEligibleDepartments = eligible_departments !== undefined;
  const res = await pool.query(
    `UPDATE courses
     SET course_name = COALESCE($2, course_name),
         center_lat = COALESCE($3, center_lat),
         center_lon = COALESCE($4, center_lon),
         radius_m = COALESCE($5, radius_m),
         department = COALESCE($6, department),
         department_code = COALESCE($7, department_code),
         level = COALESCE($8, level),
         lecturer_id = COALESCE($9, lecturer_id),
         eligible_departments = CASE WHEN $10 THEN $11 ELSE eligible_departments END
     WHERE course_id = $1
     RETURNING *`,
    [courseId, course_name, center_lat, center_lon, radius_m, department, department_code, level, lecturer_id, hasEligibleDepartments, eligible_departments]
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

exports.getUniqueDepartmentCodes = async () => {
  const res = await pool.query(
    `SELECT DISTINCT UPPER(REGEXP_REPLACE(department_code, '[[:space:]]+', '', 'g')) as department_code
     FROM courses
     WHERE department_code IS NOT NULL AND REGEXP_REPLACE(department_code, '[[:space:]]+', '', 'g') <> ''
     ORDER BY department_code`
  );
  return res.rows.map((r) => r.department_code);
};

exports.getDepartmentCodeOptions = async () => {
  const res = await pool.query(
    `WITH course_options AS (
       SELECT
         UPPER(REGEXP_REPLACE(department_code, '[[:space:]]+', '', 'g')) as eligible_value,
         INITCAP(TRIM(department)) as department,
         1 as priority
       FROM courses
       WHERE department_code IS NOT NULL
         AND REGEXP_REPLACE(department_code, '[[:space:]]+', '', 'g') <> ''
         AND department IS NOT NULL
         AND TRIM(department) <> ''
     ),
     user_options AS (
       SELECT
         UPPER(TRIM(department)) as eligible_value,
         INITCAP(TRIM(department)) as department,
         2 as priority
       FROM users
       WHERE department IS NOT NULL
         AND TRIM(department) <> ''
     )
     SELECT DISTINCT ON (department)
       eligible_value,
       CASE WHEN priority = 1 THEN eligible_value ELSE NULL END as department_code,
       department
     FROM (
       SELECT * FROM course_options
       UNION ALL
       SELECT * FROM user_options
     ) normalized_departments
     ORDER BY department, priority, eligible_value`
  );
  return res.rows;
};

exports.deleteCourse = async (courseId) => {
  const res = await pool.query(
    `DELETE FROM courses WHERE course_id = $1 RETURNING *`,
    [courseId]
  );
  return res.rows[0];
};
