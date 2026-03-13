const jwt = require("jsonwebtoken");

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
