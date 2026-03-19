const pool = require("../db/config");

exports.findByEmail = async (email) => {
  const res = await pool.query("SELECT * FROM lecturers WHERE email = $1", [email]);
  return res.rows[0];
};

exports.createLecturer = async ({
  email,
  password,
  full_name,
  department,
  qualifications,
}) => {
  const res = await pool.query(
    "INSERT INTO lecturers (email, password, full_name, department, qualifications) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [email, password, full_name, department, qualifications]
  );
  return res.rows[0];
};

exports.findById = async (id) => {
  const res = await pool.query(
    "SELECT * FROM lecturers WHERE id = $1",
    [id]
  );
  return res.rows[0];
};

exports.updatePassword = async (email, newHashedPassword) => {
  const res = await pool.query(
    "UPDATE lecturers SET password = $1 WHERE email = $2 RETURNING *",
    [newHashedPassword, email]
  );
  return res.rows[0];
};

exports.getAllLecturersWithCourses = async () => {
  const res = await pool.query(
    `SELECT l.id, l.full_name, l.email, l.department, l.qualifications,
            COALESCE(json_agg(json_build_object('course_id', c.course_id, 'course_name', c.course_name)) FILTER (WHERE c.course_id IS NOT NULL), '[]') as courses
     FROM lecturers l
     LEFT JOIN courses c ON l.id = c.lecturer_id
     GROUP BY l.id
     ORDER BY l.full_name ASC`
  );
  return res.rows;
};
