const express = require("express");
const router  = express.Router();
const pool    = require("../config/db");

// ── Helper: get full project object ──────────────────────────
async function getProjectById(id) {
  const [rows] = await pool.query(
    `SELECT
       p.id, p.title, p.description, p.createdAt,
       p.pmId, u.name AS pmName, u.username AS pmUsername
     FROM projects p
     LEFT JOIN users u ON p.pmId = u.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

// ── GET /api/projects ─────────────────────────────────────────
// Admin — all projects
// PM    — only their own projects (pmId = userId from header)
router.get("/", async (req, res) => {
  const userId = req.headers["x-user-id"] ? Number(req.headers["x-user-id"]) : null;
  const role   = req.headers["x-user-role"] ?? null;

  try {
    const isPM    = role === "ProjectManager";
    const isAdmin = role === "Admin";

    if (!isPM && !isAdmin)
      return res.status(403).json({ message: "Access denied" });

    const [rows] = await pool.query(
      `SELECT
         p.id, p.title, p.description, p.createdAt,
         p.pmId, u.name AS pmName, u.username AS pmUsername,
         COUNT(t.id) AS taskCount
       FROM projects p
       LEFT JOIN users u ON p.pmId = u.id
       LEFT JOIN tasks t ON t.projectId = p.id
       ${isPM ? "WHERE p.pmId = ?" : ""}
       GROUP BY p.id
       ORDER BY p.createdAt DESC`,
      isPM ? [userId] : []
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// ── POST /api/projects ────────────────────────────────────────
// Admin only — create a new project.
router.post("/", async (req, res) => {
  const { title, description, pmId } = req.body;

  if (!title?.trim())
    return res.status(400).json({ message: "Title is required" });

  try {
    const [result] = await pool.query(
      "INSERT INTO projects (title, description, pmId) VALUES (?, ?, ?)",
      [title.trim(), description ?? null, pmId ?? null]
    );
    const project = await getProjectById(result.insertId);
    res.status(201).json(project);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Project title already exists" });
    console.error("POST /projects error:", err);
    res.status(500).json({ message: "Failed to create project" });
  }
});

// ── PUT /api/projects/:id ─────────────────────────────────────
// Admin only — update title, description, pmId.
router.put("/:id", async (req, res) => {
  const { id }                      = req.params;
  const { title, description, pmId } = req.body;

  if (!title?.trim())
    return res.status(400).json({ message: "Title is required" });

  try {
    await pool.query(
      "UPDATE projects SET title = ?, description = ?, pmId = ? WHERE id = ?",
      [title.trim(), description ?? null, pmId ?? null, id]
    );
    const project = await getProjectById(id);
    if (!project)
      return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Project title already exists" });
    console.error("PUT /projects/:id error:", err);
    res.status(500).json({ message: "Failed to update project" });
  }
});

// ── DELETE /api/projects/:id ──────────────────────────────────
// Admin only — delete a project.
// Tasks are NOT deleted — their projectId is set to NULL.
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM projects WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("DELETE /projects/:id error:", err);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

module.exports = router;