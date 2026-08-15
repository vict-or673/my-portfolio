require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./db");

const authRoutes = require("./routes/auth");
const postsRoutes = require("./routes/posts");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "app.html"));
});

// Serve index.html from the public folder
app.use(express.static(path.join(__dirname, "..", "public")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: "Internal server error"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});