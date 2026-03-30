import { useState } from "react";
import {
  uid,
  SEVERITY_COLORS,
  calcProgressFromSubtasks,
  formatShortDate,
} from "../../utils/kanbanUtils";

function normaliseSubtasks(subtasks) {
  return (subtasks ?? []).map((s) => ({
    ...s,
    isDone: Boolean(s.isDone ?? s.done ?? false),
  }));
}

/**
 * TaskDetailModal
 *
 * Props:
 *   task     — task object from the DB
 *   onUpdate — fn(taskId, { subtasks })  — persist subtask changes
 *   onDelete — fn(taskId)                — delete the task entirely
 *   onClose  — fn()
 */
export default function TaskDetailModal({ task, onUpdate, onDelete, onClose }) {
  const [localSubtasks,    setLocalSubtasks]    = useState(() => normaliseSubtasks(task.subtasks));
  const [newSubtaskTitle,  setNewSubtaskTitle]  = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting,         setDeleting]         = useState(false);

  const doneCount = localSubtasks.filter((s) => s.isDone).length;
  const progress  = calcProgressFromSubtasks(localSubtasks) ?? task.progress ?? 0;
  const sc =
    SEVERITY_COLORS[task.severity] ??
    SEVERITY_COLORS[task.severityLabel] ??
    SEVERITY_COLORS.Low;

  // ── Subtask toggle ─────────────────────────────────────────
  const handleToggleSubtask = (subtaskId) => {
    setLocalSubtasks((prev) => {
      const updated = prev.map((s) =>
        s.id === subtaskId ? { ...s, isDone: !s.isDone } : s
      );
      onUpdate(task.id, { subtasks: updated });
      return updated;
    });
  };

  // ── Add subtask ────────────────────────────────────────────
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setLocalSubtasks((prev) => {
      const updated = [
        ...prev,
        { id: uid(), title: newSubtaskTitle.trim(), isDone: false },
      ];
      onUpdate(task.id, { subtasks: updated });
      return updated;
    });
    setNewSubtaskTitle("");
  };

  // ── Delete subtask ─────────────────────────────────────────
  const handleDeleteSubtask = (subtaskId) => {
    setLocalSubtasks((prev) => {
      const updated = prev.filter((s) => s.id !== subtaskId);
      onUpdate(task.id, { subtasks: updated });
      return updated;
    });
  };

  // ── Delete task ────────────────────────────────────────────
  const handleDeleteTask = async () => {
    setDeleting(true);
    try {
      await onDelete(task.id);
      // onDelete closes the modal from App
    } catch {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mb-16">

        {/* ── Header ── */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            {(task.severity || task.severityLabel) && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: sc.text, background: sc.bg }}
              >
                {task.severity ?? task.severityLabel}
              </span>
            )}
            <h2 className="text-lg font-semibold text-gray-800 leading-snug">
              {task.title ?? task.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4 shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Task details ── */}
        <div className="p-6 space-y-4 border-b border-gray-100">
          {task.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Assignee</p>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-[10px]">
                  {(task.assigneeName ?? task.assignee)?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
                <span className="text-sm text-gray-700">
                  {task.assigneeName ?? task.assignee ?? "Unassigned"}
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Severity</p>
              <p className="text-sm text-gray-700">{task.severityLabel ?? task.severity ?? "—"}</p>
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Target date</p>
              <p className="text-sm text-gray-700">{formatShortDate(task.targetDate) ?? "—"}</p>
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</p>
              <span className="inline-block text-sm font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {task.statusLabel ?? "—"}
              </span>
            </div>

            {task.actualEndDate && (
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Actual end date</p>
                <p className="text-sm text-gray-700">{formatShortDate(task.actualEndDate)}</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Progress</p>
              <span className="text-xs font-semibold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: progress === 100 ? "#10b981" : "#3b82f6",
                }}
              />
            </div>
            {localSubtasks.length > 0 && (
              <p className="text-xs text-gray-400">
                {doneCount} of {localSubtasks.length} subtask{localSubtasks.length !== 1 ? "s" : ""} completed
              </p>
            )}
          </div>
        </div>

        {/* ── Subtasks ── */}
        <div className="p-6 space-y-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Subtasks</h3>

          {localSubtasks.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No subtasks yet. Add one below to start tracking progress.
            </p>
          ) : (
            <ul className="space-y-2">
              {localSubtasks.map((subtask) => (
                <li key={subtask.id} className="flex items-center gap-3 group">
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      subtask.isDone
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-300 hover:border-blue-400"
                    }`}
                    aria-label={subtask.isDone ? "Mark incomplete" : "Mark complete"}
                  >
                    {subtask.isDone && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  <span className={`flex-1 text-sm transition-colors ${subtask.isDone ? "line-through text-gray-400" : "text-gray-700"}`}>
                    {subtask.title}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm leading-none shrink-0 cursor-pointer"
                    aria-label="Delete subtask"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
            <input
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a subtask…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Add
            </button>
          </form>
        </div>

        {/* ── Footer: delete task ── */}
        <div className="px-6 py-4">
          {!confirmingDelete ? (
            /* Initial delete button — subtle, tucked at the bottom */
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              {/* Trash icon */}
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h12M6 4V2h4v2M5 4l.5 9h5l.5-9"/>
              </svg>
              Delete this task
            </button>
          ) : (
            /* Inline confirmation — no extra modal needed */
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 3.5v3m0 2h.01"/>
              </svg>
              <span className="flex-1 text-sm text-red-700">
                Delete <strong>{task.title}</strong>? This cannot be undone.
              </span>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="text-sm text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={deleting}
                className="px-3 py-1.5 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 shrink-0"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
