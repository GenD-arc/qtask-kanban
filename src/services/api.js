const BASE_URL = "http://localhost:5000/api";

async function request(method, path, body) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res  = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message ?? `Request failed: ${res.status}`);
  return data;
}

// ── Statuses ──────────────────────────────────────────────────
export const fetchStatuses = ()        => request("GET",    "/statuses");
export const createStatus  = (payload) => request("POST",   "/statuses", payload);
export const deleteStatus  = (id)      => request("DELETE", `/statuses/${id}`);

// ── Severities ────────────────────────────────────────────────
export const fetchSeverities = () => request("GET", "/severities");

// ── Users ─────────────────────────────────────────────────────
export const fetchUsers = () => request("GET", "/users");

// ── Tasks ─────────────────────────────────────────────────────
export const fetchTasks = () => request("GET", "/tasks");

export const createTask = (payload) => request("POST", "/tasks", payload);

export const moveTask = (taskId, statusId, actualEndDate) =>
  request("PATCH", `/tasks/${taskId}/status`, {
    statusId,
    ...(actualEndDate ? { actualEndDate } : {}),
  });

export const updateSubtasks = (taskId, subtasks) =>
  request("PATCH", `/tasks/${taskId}/subtasks`, { subtasks });

/** Full field update — assignee, severity, targetDate, etc. */
export const updateTask = (taskId, payload) =>
  request("PUT", `/tasks/${taskId}`, payload);

export const deleteTask = (taskId) => request("DELETE", `/tasks/${taskId}`);
