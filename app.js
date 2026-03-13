const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // Security headers
const morgan = require("morgan");
require("dotenv").config();

const apiRoutes = require("./routes/api");

const app = express();

// Middleware
app.use(helmet()); // Protects against common web vulnerabilities
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Real-world Backend running on http://localhost:${PORT}`);
});