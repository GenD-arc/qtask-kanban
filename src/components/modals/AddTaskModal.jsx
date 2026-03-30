import { useState } from "react";

/**
 * AddTaskModal
 * Creates a new task via the API.
 * Receives `users` and `statuses` from App so dropdowns are dynamic.
 *
 * Props:
 *   onAdd    — fn(payload) where payload is sent directly to POST /api/tasks
 *   onClose  — fn()
 *   users    — user objects from the DB [{ id, name, username, role }]
 *   statuses — status objects from the DB [{ id, label, isDefault }]
 */
export default function AddTaskModal({ onAdd, onClose, users = [], statuses = [] }) {
  const defaultStatus = statuses.find((s) => s.isDefault) ?? statuses[0];

  const [form, setForm] = useState({
    title:      "",
    description:"",
    statusId:   defaultStatus?.id ?? "",
    assigneeId: "",
    targetDate: "",
  });

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      title:       form.title.trim(),
      description: form.description.trim() || null,
      statusId:    form.statusId   ? Number(form.statusId)   : undefined,
      assigneeId:  form.assigneeId ? Number(form.assigneeId) : null,
      targetDate:  form.targetDate || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Add task</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title *</label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Task title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assignee</label>
            <select
              value={form.assigneeId}
              onChange={(e) => set("assigneeId", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Target date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target date</label>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => set("targetDate", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
