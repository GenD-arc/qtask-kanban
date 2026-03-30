/**
 * api.js — centralised API service
 * All fetch calls to the Express backend go through here.
 * The BASE_URL points to the Express server on port 5000.
 */

const BASE_URL = "http://localhost:5000/api";

// ── Generic request helper ────────────────────────────────────────────────────
async function request(method, path, body) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    // Surface the backend error message to the caller
    throw new Error(data.message ?? `Request failed: ${res.status}`);
  }

  return data;
}

// ── Statuses ─────────────────────────────────────────────────────────────────

/** Fetch all statuses ordered by sortOrder. Used to build Kanban columns. */
export const fetchStatuses = () => request("GET", "/statuses");

/** Create a new status (Admin only). */
export const createStatus = (payload) => request("POST", "/statuses", payload);

/** Delete a status — backend will reject if tasks are using it. */
export const deleteStatus = (id) => request("DELETE", `/statuses/${id}`);

// ── Users ─────────────────────────────────────────────────────────────────────

/** Fetch all active users for the assignee dropdown. */
export const fetchUsers = () => request("GET", "/users");

// ── Tasks ─────────────────────────────────────────────────────────────────────

/** Fetch all tasks with joined status, phase, severity, assignee, subtasks. */
export const fetchTasks = () => request("GET", "/tasks");

/** Create a new task. */
export const createTask = (payload) => request("POST", "/tasks", payload);

/**
 * Move a task to a new status column.
 * This is called every time a card is dragged to a different column.
 * If the new status is final (isFinal=true), pass actualEndDate as well.
 *
 * @param {number} taskId
 * @param {number} statusId       - The id of the target status
 * @param {string} [actualEndDate] - ISO date string, required when isFinal
 */
export const moveTask = (taskId, statusId, actualEndDate) =>
  request("PATCH", `/tasks/${taskId}/status`, {
    statusId,
    ...(actualEndDate ? { actualEndDate } : {}),
  });

/**
 * Save the full subtask list for a task.
 * Backend recalculates progress automatically.
 *
 * @param {number} taskId
 * @param {Array}  subtasks  - [{ title, isDone }]
 */
export const updateSubtasks = (taskId, subtasks) =>
  request("PATCH", `/tasks/${taskId}/subtasks`, { subtasks });

/** Full update of task fields (edit form). */
export const updateTask = (taskId, payload) =>
  request("PUT", `/tasks/${taskId}`, payload);

/** Delete a task. */
export const deleteTask = (taskId) => request("DELETE", `/tasks/${taskId}`);
