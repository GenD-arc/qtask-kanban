/** Generate a unique id string */
export const uid = () => String(Date.now() + Math.random());

/** Severity badge color config */
export const SEVERITY_COLORS = {
  Critical: { text: "#991b1b", bg: "#fee2e2" },
  High: { text: "#92400e", bg: "#fef3c7" },
  Medium: { text: "#1e40af", bg: "#dbeafe" },
  Low: { text: "#374151", bg: "#f3f4f6" },
};

/**
 * Returns the Tailwind top-border accent class for a column.
 * Falls back gracefully for custom user-added columns.
 */
export const colAccentClass = (col) => {
  if (col.isFinal) return "border-t-emerald-400";
  if (col.key === "inProgress") return "border-t-amber-400";
  if (col.key === "forReview") return "border-t-purple-400";
  return "border-t-gray-300";
};

/**
 * Format a date string to "Apr 10" style using en-PH locale.
 */
export const formatShortDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Calculate task progress from subtasks.
 * SRS §3.4: (Completed Subtasks / Total Subtasks) * 100
 * Returns null if there are no subtasks (manual progress is used instead).
 */
export const calcProgressFromSubtasks = (subtasks) => {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter((s) => s.done).length;
  return Math.round((done / subtasks.length) * 100);
};
