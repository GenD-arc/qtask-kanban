const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ─── Helper: build a full task object with joined data ───────────────────────
async function getTaskById(id) {
  const [rows] = await pool.query(
    `SELECT
       t.id, t.title, t.description, t.progress,
       t.targetDate, t.actualEndDate, t.createdAt, t.updatedAt,
       t.statusId,   s.label  AS statusLabel,   s.isFinal AS statusIsFinal,
       t.phaseId,    p.label  AS phaseLabel,
       t.severityId, sv.label AS severityLabel,
       t.assigneeId, u.name   AS assigneeName,  u.username AS assigneeUsername
     FROM tasks t
     LEFT JOIN statuses   s  ON t.statusId   = s.id
     LEFT JOIN phases     p  ON t.phaseId    = p.id
     LEFT JOIN severities sv ON t.severityId = sv.id
     LEFT JOIN users      u  ON t.assigneeId = u.id
     WHERE t.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const task = rows[0];

  // Attach subtasks
  const [subtasks] = await pool.query(
    "SELECT id, title, isDone FROM subtasks WHERE taskId = ? ORDER BY id ASC",
    [id]
  );
  task.subtasks = subtasks;
  return task;
}

// ─── GET /api/tasks ──────────────────────────────────────────────────────────
// Returns all tasks with joined status, phase, severity, assignee, subtasks.
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         t.id, t.title, t.description, t.progress,
         t.targetDate, t.actualEndDate, t.createdAt, t.updatedAt,
         t.statusId,   s.label  AS statusLabel,   s.isFinal AS statusIsFinal,
         t.phaseId,    p.label  AS phaseLabel,
         t.severityId, sv.label AS severityLabel,
         t.assigneeId, u.name   AS assigneeName,  u.username AS assigneeUsername
       FROM tasks t
       LEFT JOIN statuses   s  ON t.statusId   = s.id
       LEFT JOIN phases     p  ON t.phaseId    = p.id
       LEFT JOIN severities sv ON t.severityId = sv.id
       LEFT JOIN users      u  ON t.assigneeId = u.id
       ORDER BY t.createdAt DESC`
    );

    // Attach subtasks to each task
    for (const task of rows) {
      const [subtasks] = await pool.query(
        "SELECT id, title, isDone FROM subtasks WHERE taskId = ? ORDER BY id ASC",
        [task.id]
      );
      task.subtasks = subtasks;
    }

    res.json(rows);
  } catch (err) {
    console.error("GET /tasks error:", err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// ─── POST /api/tasks ─────────────────────────────────────────────────────────
// Creates a new task. Status defaults to the isDefault status if not provided.
router.post("/", async (req, res) => {
  const { title, description, statusId, phaseId, severityId, assigneeId, targetDate } = req.body;

  if (!title?.trim())
    return res.status(400).json({ message: "Title is required" });

  try {
    // Resolve default status if not provided
    let resolvedStatusId = statusId;
    if (!resolvedStatusId) {
      const [defaults] = await pool.query(
        "SELECT id FROM statuses WHERE isDefault = 1 LIMIT 1"
      );
      if (defaults.length === 0)
        return res.status(500).json({ message: "No default status configured" });
      resolvedStatusId = defaults[0].id;
    }

    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, statusId, phaseId, severityId, assigneeId, targetDate, progress)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        title.trim(),
        description ?? null,
        resolvedStatusId,
        phaseId ?? null,
        severityId ?? null,
        assigneeId ?? null,
        targetDate ?? null,
      ]
    );

    // Log creation
    await pool.query(
      "INSERT INTO activity_logs (taskId, action) VALUES (?, ?)",
      [result.insertId, "Task created"]
    );

    const task = await getTaskById(result.insertId);
    res.status(201).json(task);
  } catch (err) {
    console.error("POST /tasks error:", err);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// ─── PATCH /api/tasks/:id/status ─────────────────────────────────────────────
// Moves a task to a new status (Kanban drag-and-drop).
// If the new status isFinal, actualEndDate must be provided in the body.
// This is the primary endpoint called when a card is dragged to a new column.
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { statusId, actualEndDate } = req.body;

  if (!statusId)
    return res.status(400).json({ message: "statusId is required" });

  try {
    // Fetch current task for audit log
    const [current] = await pool.query(
      "SELECT t.statusId, s.label AS oldLabel FROM tasks t LEFT JOIN statuses s ON t.statusId = s.id WHERE t.id = ?",
      [id]
    );
    if (current.length === 0)
      return res.status(404).json({ message: "Task not found" });

    // Fetch new status label and isFinal flag
    const [newStatus] = await pool.query(
      "SELECT label, isFinal FROM statuses WHERE id = ?",
      [statusId]
    );
    if (newStatus.length === 0)
      return res.status(404).json({ message: "Status not found" });

    const isFinal = newStatus[0].isFinal;

    // Build update query
    const updates = { statusId };
    if (isFinal) {
      updates.actualEndDate = actualEndDate ?? new Date().toISOString().split("T")[0];
      updates.progress = 100;
    }

    await pool.query(
      `UPDATE tasks SET statusId = ?, actualEndDate = ?, progress = CASE WHEN ? = 1 THEN 100 ELSE progress END WHERE id = ?`,
      [statusId, updates.actualEndDate ?? null, isFinal ? 1 : 0, id]
    );

    // Write to audit log (SRS §5.1)
    const logAction = `Status changed from "${current[0].oldLabel}" to "${newStatus[0].label}"${
      isFinal && updates.actualEndDate ? ` — Actual End Date: ${updates.actualEndDate}` : ""
    }`;
    await pool.query(
      "INSERT INTO activity_logs (taskId, action) VALUES (?, ?)",
      [id, logAction]
    );

    const task = await getTaskById(id);
    res.json(task);
  } catch (err) {
    console.error("PATCH /tasks/:id/status error:", err);
    res.status(500).json({ message: "Failed to update task status" });
  }
});

// ─── PATCH /api/tasks/:id/subtasks ───────────────────────────────────────────
// Replaces all subtasks for a task and recalculates progress.
router.patch("/:id/subtasks", async (req, res) => {
  const { id } = req.params;
  const { subtasks } = req.body;

  if (!Array.isArray(subtasks))
    return res.status(400).json({ message: "subtasks must be an array" });

  try {
    // Delete existing subtasks
    await pool.query("DELETE FROM subtasks WHERE taskId = ?", [id]);

    // Insert updated subtasks
    for (const s of subtasks) {
      await pool.query(
        "INSERT INTO subtasks (taskId, title, isDone) VALUES (?, ?, ?)",
        [id, s.title, s.isDone ? 1 : 0]
      );
    }

    // Recalculate progress (SRS §3.4)
    const total = subtasks.length;
    const done  = subtasks.filter((s) => s.isDone).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    await pool.query("UPDATE tasks SET progress = ? WHERE id = ?", [progress, id]);

    const task = await getTaskById(id);
    res.json(task);
  } catch (err) {
    console.error("PATCH /tasks/:id/subtasks error:", err);
    res.status(500).json({ message: "Failed to update subtasks" });
  }
});

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
// Full update of task fields (edit form).
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, phaseId, severityId, assigneeId, targetDate } = req.body;

  try {
    await pool.query(
      `UPDATE tasks SET title = ?, description = ?, phaseId = ?, severityId = ?, assigneeId = ?, targetDate = ? WHERE id = ?`,
      [title, description ?? null, phaseId ?? null, severityId ?? null, assigneeId ?? null, targetDate ?? null, id]
    );

    await pool.query(
      "INSERT INTO activity_logs (taskId, action) VALUES (?, ?)",
      [id, "Task details updated"]
    );

    const task = await getTaskById(id);
    res.json(task);
  } catch (err) {
    console.error("PUT /tasks/:id error:", err);
    res.status(500).json({ message: "Failed to update task" });
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("DELETE /tasks/:id error:", err);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;
