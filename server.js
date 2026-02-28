require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const habitRoutes = require("./src/routes/habitRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const errorHandler = require("./src/middleware/errorHandler");

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS Configuration ──────────────────────────────────────────────────────
const allowedOrigins = [
  "https://habit-tracker-frontend-six-lake.vercel.app", "https://habit-tracker-frontend-six-lake.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(
        new Error(`CORS policy: Origin ${origin} not allowed`)
      );
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Explicitly handle preflight requests with the same config
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🏃 Habit Tracker API is running",
    version: "1.0.0",
    docs: "See README.md for full API documentation",
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"
    } mode`
  );
});

module.exports = app;
