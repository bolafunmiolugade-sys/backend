module.exports = (req, res, next) => {
  // Lecturer JWT tokens include a role: "lecturer" payload
  if (req.user && req.user.role === "lecturer") {
    next();
  } else {
    res.status(403).json({ message: "Access Denied. Lecturer privileges required." });
  }
};
