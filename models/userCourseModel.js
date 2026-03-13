const pool = require("../db/config");

// Assigns an array of course IDs to the student identified by matricNumber.
// If the student already has a row, merge new courses (avoid duplicates).
exports.assignCoursesToUser = async (matricNumber, courseIds) => {
  if (!Array.isArray(courseIds) || courseIds.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // filter courseIds against existing courses table to skip unknown ids
    const validRes = await client.query(
      `SELECT course_id FROM courses WHERE course_id = ANY($1::varchar[])`,
      [courseIds]
    );
    const validIds = validRes.rows.map((r) => r.course_id);
    if (validIds.length === 0) {
      await client.query("COMMIT");
      return;
    }

    // check if student already has an entry
    const existing = await client.query(
      "SELECT courses FROM student_courses WHERE matric_number = $1",
      [matricNumber]
    );

    if (existing.rows.length === 0) {
      // insert new row
      await client.query(
        "INSERT INTO student_courses (matric_number, courses) VALUES ($1, $2)",
        [matricNumber, validIds]
      );
    } else {
      const current = existing.rows[0].courses || [];
      const merged = Array.from(new Set([...current, ...validIds]));
      await client.query(
        "UPDATE student_courses SET courses = $1 WHERE matric_number = $2",
        [merged, matricNumber]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// Returns full course rows for courses the student registered for
exports.getUserCourses = async (matricNumber) => {
  const res = await pool.query(
    `SELECT c.* FROM courses c
     JOIN student_courses sc ON c.course_id = ANY(sc.courses)
     WHERE sc.matric_number = $1`,
    [matricNumber]
  );
  return res.rows;
};
