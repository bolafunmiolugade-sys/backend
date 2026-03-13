const pool = require("../db/config");

// Save a code (upsert logic: delete old code for email/type, then insert new)
exports.saveCode = async (email, user_type, code, expires_in_mins = 15) => {
  // Clear any existing codes for this user first
  await pool.query(
    "DELETE FROM password_resets WHERE email = $1 AND user_type = $2",
    [email, user_type]
  );

  const res = await pool.query(
    `INSERT INTO password_resets (email, user_type, code, expires_at) 
     VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::INTERVAL) RETURNING *`,
    [email, user_type, code, expires_in_mins]
  );
  return res.rows[0];
};

// Verify a code (returns the record if valid and not expired, undefined otherwise)
exports.verifyCode = async (email, user_type, code) => {
  const res = await pool.query(
    `SELECT * FROM password_resets 
     WHERE email = $1 AND user_type = $2 AND code = $3 AND expires_at > NOW()`,
    [email, user_type, code]
  );
  return res.rows[0];
};

// Delete a code (after successful reset)
exports.deleteCode = async (email, user_type) => {
  const res = await pool.query(
    "DELETE FROM password_resets WHERE email = $1 AND user_type = $2 RETURNING *",
    [email, user_type]
  );
  return res.rows[0];
};
