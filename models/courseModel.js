const pool = require("../db/config");

exports.getAllCourses = async () => {
  const res = await pool.query(
    "SELECT course_id, course_name, center_lat, center_lon, radius_m FROM courses ORDER BY course_id"
  );
  return res.rows;
};

exports.getCourseById = async (courseId) => {
  const res = await pool.query(
    "SELECT course_id, course_name, center_lat, center_lon, radius_m FROM courses WHERE course_id = $1",
    [courseId]
  );
  return res.rows[0];
};

exports.getCourseByCourseCode = async (course_id) => {
  const res = await pool.query(
    "SELECT course_id, course_name, center_lat, center_lon, radius_m FROM courses WHERE course_id = $1",
    [course_id]
  );
  return res.rows[0];
};

exports.createCourse = async ({
  course_id,
  course_name,
  center_lat,
  center_lon,
  radius_m = 40,
}) => {
  const res = await pool.query(
    `INSERT INTO courses (course_id, course_name, center_lat, center_lon, radius_m)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [course_id, course_name, center_lat, center_lon, radius_m]
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
  } = {}
) => {
  const res = await pool.query(
    `UPDATE courses
     SET course_name = COALESCE($2, course_name),
         center_lat = COALESCE($3, center_lat),
         center_lon = COALESCE($4, center_lon),
         radius_m = COALESCE($5, radius_m)
     WHERE course_id = $1
     RETURNING course_id, course_name, center_lat, center_lon, radius_m`,
    [courseId, course_name, center_lat, center_lon, radius_m]
  );
  return res.rows[0];
};

exports.deleteCourse = async (courseId) => {
  const res = await pool.query(
    `DELETE FROM courses WHERE course_id = $1 RETURNING *`,
    [courseId]
  );
  return res.rows[0];
};
