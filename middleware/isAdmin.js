module.exports = (req, res, next) => {
  // Admin JWT tokens include a role: "admin" payload
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access Denied. Administrator privileges required." });
  }
};
