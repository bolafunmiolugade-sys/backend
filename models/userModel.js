const pool = require("../db/config");

exports.findByMatricNumber = async (matric_number) => {
  const res = await pool.query("SELECT * FROM users WHERE matric_number = $1", [
    matric_number,
  ]);
  return res.rows[0];
};

// Keep email lookup for backward compatibility
exports.findByEmail = async (email) => {
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return res.rows[0];
};

exports.createUser = async ({
  matric_number,
  email,
  password,
  full_name,
  level,
  department,
}) => {
  const res = await pool.query(
    "INSERT INTO users (matric_number, email, password, full_name, level, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [matric_number, email, password, full_name, level, department]
  );
  return res.rows[0];
};

exports.findById = async (id) => {
  const res = await pool.query(
    "SELECT * FROM users WHERE user_id = $1 OR id = $1",
    [id]
  );
  return res.rows[0];
};

exports.updatePassword = async (email, newHashedPassword) => {
  const res = await pool.query(
    "UPDATE users SET password = $1 WHERE email = $2 RETURNING *",
    [newHashedPassword, email]
  );
  return res.rows[0];
};
