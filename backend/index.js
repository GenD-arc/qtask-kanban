const express = require("express");
const cors    = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use("/api/register",   require("./routes/register"));
app.use("/api/login",      require("./routes/login"));
app.use("/api/statuses",   require("./routes/statuses"));
app.use("/api/severities", require("./routes/severities"));
app.use("/api/tasks",      require("./routes/tasks"));
app.use("/api/users",      require("./routes/users"));

// ── Health check ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Q-Task API is running", version: "1.0.0" });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Q-Task API running on http://localhost:${PORT}`);
});
