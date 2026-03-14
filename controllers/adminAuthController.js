const jwt = require("jsonwebtoken");
const pool = require("../db/config");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password required." });
  }

  // Fallback credentials if environment variables are missing
  const adminEmail = process.env.ADMIN_EMAIL || "admin@university.edu";
  const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword";

  try {
    if (email === adminEmail && password === adminPassword) {
      const token = jwt.sign(
        { email: adminEmail, role: "admin" },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );
      
      return res.json({ token, user: { email: adminEmail, role: "admin" } });
    }

    return res.status(400).json({ message: "Invalid admin credentials." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAllStudents = async (req, res) => {
  const { level, department } = req.query;
  
  try {
    let query = "SELECT matric_number, email, full_name, level, department FROM users";
    const params = [];
    const conditions = [];

    if (level) {
      params.push(level);
      conditions.push(`level = $${params.length}`);
    }
    if (department) {
      params.push(department);
      conditions.push(`department = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY full_name ASC";

    const result = await pool.query(query, params);
    res.status(200).json({ success: true, students: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
