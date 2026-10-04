require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./utils/db");

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");
const bookingRoutes = require("./routes/bookings");
const userRoutes = require("./routes/users");
const supportRoutes = require("./routes/support");
const assistantRoutes = require("./routes/assistant");

const app = express();
const PORT = process.env.PORT || 8000;

// Behind Vercel/Render's proxy: needed so rate-limiting sees the real client IP.
app.set("trust proxy", 1);

// CLIENT_URL can hold one or several comma-separated origins, e.g.
// https://houserent.vercel.app,https://www.mydomain.com
// When it's not set (local dev) every origin is allowed.
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "House Rent API is running" });
});

// Make sure MongoDB is connected before any /api request (works for both
// the long-running local server and Vercel's short-lived serverless functions).
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    res.status(503).json({ message: "Database unavailable. Please try again shortly." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/assistant", assistantRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler (also catches multer/CORS errors)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Image too large (max 4 MB each)" });
  }
  if (err.message === "Only image files are allowed") {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: "Internal server error" });
});

// Local / traditional hosting: `node index.js` starts a normal server.
// On Vercel the app is exported (see api/index.js) and no port is opened.
if (require.main === module) {
  connectDB()
    .then(() => {
      console.log("Connected to MongoDB");
      app.listen(PORT, () => console.log(`House Rent server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err.message);
      process.exit(1);
    });
}

module.exports = app;
