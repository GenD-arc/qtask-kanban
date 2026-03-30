const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:5173", // Vite dev server
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
const registerRouter = require("./routes/register");
const loginRouter    = require("./routes/login");
const statusesRouter = require("./routes/statuses");
const tasksRouter    = require("./routes/tasks");
const usersRouter    = require("./routes/users");

app.use("/api/register", registerRouter);
app.use("/api/login",    loginRouter);
app.use("/api/statuses", statusesRouter);
app.use("/api/tasks",    tasksRouter);
app.use("/api/users",    usersRouter);

// ── Health check ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Q-Task API is running", version: "1.0.0" });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Q-Task API running on http://localhost:${PORT}`);
});
