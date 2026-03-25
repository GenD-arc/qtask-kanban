import { useState } from "react";
import {
  uid,
  SEVERITY_COLORS,
  calcProgressFromSubtasks,
  formatShortDate,
} from "../../utils/kanbanUtils";

/**
 * TaskDetailModal
 * Opens when a TaskCard is clicked.
 * Shows full task details (top section) and the subtask manager (bottom section).
 * Subtask completion drives the parent task's progress automatically (SRS §3.4).
 *
 * Props:
 *   task       — full task object including subtasks array
 *   onUpdate   — fn(taskId, updatedFields) — called whenever task data changes
 *   onClose    — fn() — dismisses the modal
 */
export default function TaskDetailModal({ task, onUpdate, onClose }) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const sc = SEVERITY_COLORS[task.severity] ?? SEVERITY_COLORS.Low;

  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const progress = calcProgressFromSubtasks(subtasks) ?? task.progress ?? 0;

  /* ── Toggle a subtask's done state ── */
  const handleToggleSubtask = (subtaskId) => {
    const updated = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, done: !s.done } : s,
    );
    const newProgress = calcProgressFromSubtasks(updated) ?? 0;
    onUpdate(task.id, { subtasks: updated, progress: newProgress });
  };

  /* ── Add a new subtask ── */
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const updated = [
      ...subtasks,
      { id: uid(), title: newSubtaskTitle.trim(), done: false },
    ];
    const newProgress = calcProgressFromSubtasks(updated) ?? 0;
    onUpdate(task.id, { subtasks: updated, progress: newProgress });
    setNewSubtaskTitle("");
  };

  /* ── Delete a subtask ── */
  const handleDeleteSubtask = (subtaskId) => {
    const updated = subtasks.filter((s) => s.id !== subtaskId);
    const newProgress = calcProgressFromSubtasks(updated) ?? task.progress ?? 0;
    onUpdate(task.id, { subtasks: updated, progress: newProgress });
  };

  /* ── Click on backdrop closes modal ── */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mb-16">
        {/* ── Header bar ── */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ color: sc.text, background: sc.bg }}
            >
              {task.severity}
            </span>
            <h2 className="text-lg font-semibold text-gray-800 leading-snug">
              {task.name}
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
          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Meta grid */}

          {/* Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Assignee
              </p>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-[10px]">
                  {task.assignee?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
                <span className="text-sm text-gray-700">
                  {task.assignee ?? "Unassigned"}
                </span>
              </div>
            </div>

            {/* Severity */}
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Severity
              </p>
              <p className="text-sm text-gray-700">{task.severity}</p>
            </div>

            {/* Target Date */}
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Target date
              </p>
              <p className="text-sm text-gray-700">
                {formatShortDate(task.targetDate) ?? "—"}
              </p>
            </div>

            {/* Status */}
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Status
              </p>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-green-100 text-green-700 flex items-center justify-center font-medium text-sm px-2">
                  Active
                </span>
              </div>
            </div>

            {task.actualEndDate && (
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Actual end date
                </p>
                <p className="text-sm text-gray-700">
                  {formatShortDate(task.actualEndDate)}
                </p>
              </div>
            )}
          </div>

          {/* Overall progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Progress
              </p>
              <span className="text-xs font-semibold text-blue-600">
                {progress}%
              </span>
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
            {subtasks.length > 0 && (
              <p className="text-xs text-gray-400">
                {doneCount} of {subtasks.length} subtask
                {subtasks.length !== 1 ? "s" : ""} completed
              </p>
            )}
          </div>
        </div>

        {/* ── Subtasks section ── */}
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Subtasks</h3>

          {/* Subtask list */}
          {subtasks.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No subtasks yet. Add one below to start tracking progress.
            </p>
          ) : (
            <ul className="space-y-2">
              {subtasks.map((subtask) => (
                <li key={subtask.id} className="flex items-center gap-3 group">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleSubtask(subtask.id)}
                    // id={`subtask-${subtask.id}`}
                    className={`shrink-0 size-5 rounded border-2 flex items-center justify-center transition-colors hover:cursor-pointer ${
                      subtask.done
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-300 hover:border-blue-400"
                    }`}
                    aria-label={
                      subtask.done ? "Mark incomplete" : "Mark complete"
                    }
                  >
                    {subtask.done && (
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Title */}
                  <span
                    // htmlFor={`subtask-${subtask.id}`}
                    className={`flex-1 text-sm transition-colors ${
                      subtask.done
                        ? "line-through text-gray-400"
                        : "text-gray-700"
                    }`}
                  >
                    {subtask.title}
                  </span>

                  {/* Delete button — visible on hover */}
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="text-gray-400 hover:text-red-400 hover:cursor-pointer transition-colors opacity-0 group-hover:opacity-100 text-sm leading-none shrink-0"
                    aria-label="Delete subtask"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add subtask form */}
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
      </div>
    </div>
  );
}
