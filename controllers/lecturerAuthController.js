const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const lecturerModel = require("../models/lecturerModel");
const passwordResetModel = require("../models/passwordResetModel");
const emailUtils = require("../utils/emailUtils");

exports.register = async (req, res) => {
  const { email, password, full_name, department, qualifications } = req.body;
  
  if (!email || !password || !full_name || !department || !qualifications) {
    return res.status(400).json({
      message: "Email, password, full name, department and qualifications are required.",
    });
  }

  try {
    const existingEmail = await lecturerModel.findByEmail(email);
    if (existingEmail) {
      return res
        .status(400)
        .json({ message: "Lecturer already exists with that email." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const lecturer = await lecturerModel.createLecturer({
      email,
      password: hash,
      full_name,
      department,
      qualifications,
    });

    const token = jwt.sign(
      { id: lecturer.id, email: lecturer.email, role: "lecturer" },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({ token, user: lecturer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password required." });
  }

  try {
    const lecturer = await lecturerModel.findByEmail(email);
    if (!lecturer) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, lecturer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: lecturer.id, email: lecturer.email, role: "lecturer" },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({ token, user: lecturer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required." });
  }

  try {
    const lecturer = await lecturerModel.findByEmail(email);
    if (!lecturer) {
      return res.status(400).json({ message: "Invalid email." });
    }

    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    
    await passwordResetModel.saveCode(email, "lecturer", code);
    await emailUtils.sendResetCode(email, code);

    res.status(200).json({ message: "Password reset code sent to email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, code, new_password } = req.body;

  if (!email || !code || !new_password) {
    return res.status(400).json({ message: "Email, code, and new password required." });
  }

  try {
    const validCode = await passwordResetModel.verifyCode(email, "lecturer", code);
    if (!validCode) {
      return res.status(400).json({ message: "Invalid or expired reset code." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(new_password, salt);

    await lecturerModel.updatePassword(email, hash);
    await passwordResetModel.deleteCode(email, "lecturer");

    res.status(200).json({ message: "Password successfully reset." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
