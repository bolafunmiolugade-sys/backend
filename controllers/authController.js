const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userModel = require("../models/userModel");
const passwordResetModel = require("../models/passwordResetModel");
const emailUtils = require("../utils/emailUtils");

exports.register = async (req, res) => {
  const { matric_number, email, password, full_name, level, department } =
    req.body;
  if (
    !matric_number ||
    !email ||
    !password ||
    !full_name ||
    !level ||
    !department
  )
    return res.status(400).json({
      message:
        "Matric number, email, password, full name, level and department required.",
    });

  try {
    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail)
      return res
        .status(400)
        .json({ message: "User already exists with that email." });

    const existingMatric = await userModel.findByMatricNumber(matric_number);
    if (existingMatric)
      return res
        .status(400)
        .json({ message: "User already exists with that matric number." });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await userModel.createUser({
      matric_number,
      email,
      password: hash,
      full_name,
      level,
      department,
    });

    // registration is for creating user only; course assignment is handled
    // via a separate authenticated endpoint

    const id = user.user_id || user.id;
    const token = jwt.sign(
      { id, email: user.email, matric_number: user.matric_number },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.login = async (req, res) => {
  const { matric_number, password } = req.body;
  if (!matric_number || !password)
    return res
      .status(400)
      .json({ message: "Matric number and password required." });

  try {
    const user = await userModel.findByMatricNumber(matric_number);
    if (!user) return res.status(400).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials." });

    const id = user.user_id || user.id;
    const token = jwt.sign(
      { id, email: user.email, matric_number: user.matric_number },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { matric_number, email } = req.body;

  if (!matric_number || !email) {
    return res
      .status(400)
      .json({ message: "Matric number and email required." });
  }

  try {
    const user = await userModel.findByMatricNumber(matric_number);
    if (!user || user.email !== email) {
      return res.status(400).json({ message: "Invalid user credentials." });
    }

    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();

    await passwordResetModel.saveCode(email, "user", code);
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
    return res
      .status(400)
      .json({ message: "Email, code, and new password required." });
  }

  try {
    const validCode = await passwordResetModel.verifyCode(email, "user", code);
    if (!validCode) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset code." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(new_password, salt);

    await userModel.updatePassword(email, hash);
    await passwordResetModel.deleteCode(email, "user");

    res.status(200).json({ message: "Password successfully reset." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
