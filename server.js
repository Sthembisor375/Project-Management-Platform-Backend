const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDb = require("./config/dbConnection");
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/ticket");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 5005;

// Connect to MongoDB
connectDb();

// Request logging middleware (less verbose in production)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`📦 Body:`, {
        ...req.body,
        password: req.body.password ? "***" : undefined,
      });
    }
  }
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.get("/", (req, res) => {
  res.send("Project Manager Backend API");
});
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  }
  res.status(404).json({
    message: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Global error handler caught:", {
    message: err.message,
    name: err.name,
    code: err.code,
    url: req.url,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format",
      error: err.message,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `${
        field.charAt(0).toUpperCase() + field.slice(1)
      } already exists`,
      error: err.message,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token",
      error: err.message,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Token expired",
      error: err.message,
    });
  }

  // Default server error
  res.status(500).json({
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

  // Only log database status in development
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `📊 MongoDB: ${
        process.env.CONNECTION_STRING || process.env.MONGODB_URI
          ? "Configured"
          : "Not configured"
      }`
    );
  }
});
