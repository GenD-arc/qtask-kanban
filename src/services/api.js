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

export const updateTask = (taskId, payload) =>
  request("PUT", `/tasks/${taskId}`, payload);

export const deleteTask = (taskId) => request("DELETE", `/tasks/${taskId}`);

// ── Attachments ───────────────────────────────────────────────
// Note: file upload uses FormData — does NOT use the JSON request() helper.

/** Fetch all attachments for a task. */
export const fetchAttachments = (taskId) =>
  request("GET", `/attachments/${taskId}`);

/**
 * Upload a file to a task.
 * @param {number} taskId
 * @param {File}   file  — browser File object from an <input type="file">
 * @returns {Promise<object>} — the saved attachment metadata row
 */
export async function uploadAttachment(taskId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/attachments/${taskId}`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — the browser sets it automatically
    // with the correct multipart boundary when using FormData.
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Upload failed");
  return data;
}

/**
 * Delete an attachment.
 * @param {number} taskId
 * @param {number} attachmentId
 */
export const deleteAttachment = (taskId, attachmentId) =>
  request("DELETE", `/attachments/${taskId}/${attachmentId}`);

/**
 * Returns the URL to download/preview an attachment.
 * Use as an <a href> or window.open() target.
 */
export const attachmentDownloadUrl = (taskId, attachmentId) =>
  `${BASE_URL}/attachments/${taskId}/${attachmentId}/download`;
