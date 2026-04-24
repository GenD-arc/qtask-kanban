const BASE_URL = "http://localhost:5000/api";

async function request(method, path, body) {
  const stored = localStorage.getItem("qtask_user");
  const user   = stored ? JSON.parse(stored) : null;

  const options = {
    method,
    headers: {
    "Content-Type": "application/json",
    ...(user?.id   ? { "x-user-id":   String(user.id)   } : {}),
    ...(user?.role ? { "x-user-role": user.role          } : {}),
  },
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res  = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message ?? `Request failed: ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const loginUser = (username, password) =>
  request("POST", "/login", { username, password });

// ── Phases (Kanban columns) ───────────────────────────────────
// Phases drive the board columns. Each task's phaseId determines
// which column it lives in.
export const fetchPhases  = (grouping) =>
  request("GET", grouping ? `/phases?grouping=${grouping}` : "/phases");
export const createPhase  = (payload) => request("POST",   "/phases", payload);
export const updatePhase  = (id, payload) => request("PUT", `/phases/${id}`, payload);
export const deletePhase  = (id)      => request("DELETE", `/phases/${id}`);

// ── Statuses (task workflow attribute — NOT the Kanban column) ─
// Status is a secondary attribute on a task (e.g. Open, For Verification).
// It is shown in the task detail view but does not control the column.
export const fetchStatuses = () => request("GET", "/statuses");

// ── Severities ────────────────────────────────────────────────
export const fetchSeverities = () => request("GET", "/severities");

// ── Users ─────────────────────────────────────────────────────
export const fetchUsers = () => request("GET", "/users");

// ── Projects ──────────────────────────────────────────────────
// Admin/PM: all or own projects
export const fetchProjects         = ()            => request("GET",    "/projects");
// Developer/QA: only projects they are assigned to via tasks
export const fetchAssignedProjects = ()            => request("GET",    "/projects/assigned");
export const createProject  = (payload)       => request("POST",   "/projects", payload);
export const updateProject  = (id, payload)   => request("PUT",    `/projects/${id}`, payload);
export const deleteProject  = (id)            => request("DELETE", `/projects/${id}`);

// ── Tasks — updated fetchTasks to accept projectId ─────────────
export const fetchTasks = (projectId) =>
  request("GET", projectId ? `/tasks?projectId=${projectId}` : "/tasks");

// ── Tasks ─────────────────────────────────────────────────────
//export const fetchTasks = () => request("GET", "/tasks");

export const createTask = (payload) => request("POST", "/tasks", payload);

// ── Activity Logs ─────────────────────────────────────────────
export const fetchActivityLogs = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return request("GET", `/activity-logs${params ? `?${params}` : ""}`);
};

/**
 * Move a task to a different phase column (Kanban drag-and-drop).
 * Calls PATCH /api/tasks/:id/phase
 *
 * @param {number} taskId
 * @param {number} phaseId        — the target phase's DB id
 * @param {string} [actualEndDate] — ISO date string, required when isFinal
 */
export const moveTask = (taskId, phaseId, actualEndDate) =>
  request("PATCH", `/tasks/${taskId}/phase`, {
    phaseId,
    ...(actualEndDate ? { actualEndDate } : {}),
  });

export const updateSubtasks = (taskId, subtasks) =>
  request("PATCH", `/tasks/${taskId}/subtasks`, { subtasks });

/** Update task detail fields (assignee, severity, dates, etc.) */
export const updateTask = (taskId, payload) =>
  request("PUT", `/tasks/${taskId}`, payload);

export const deleteTask = (taskId) => request("DELETE", `/tasks/${taskId}`);

// ── Attachments ───────────────────────────────────────────────
export const fetchAttachments = (taskId) =>
  request("GET", `/attachments/${taskId}`);

export async function uploadAttachment(taskId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/attachments/${taskId}`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Upload failed");
  return data;
}

export const deleteAttachment = (taskId, attachmentId) =>
  request("DELETE", `/attachments/${taskId}/${attachmentId}`);

export const attachmentDownloadUrl = (taskId, attachmentId) =>
  `${BASE_URL}/attachments/${taskId}/${attachmentId}/download`;

// ── User Management (Admin only) ──────────────────────────────
export const fetchAllUsers      = ()              => request("GET",    "/users?all=true");
export const createUser         = (payload)       => request("POST",   "/users", payload);
export const updateUser         = (id, payload)   => request("PUT",    `/users/${id}`, payload);
export const resetUserPassword  = (id, password)  => request("PATCH",  `/users/${id}/password`, { newPassword: password });
export const toggleUserStatus   = (id, isActive)  => request("PATCH",  `/users/${id}/status`, { isActive });
export const deleteUser         = (id)            => request("DELETE", `/users/${id}`);
