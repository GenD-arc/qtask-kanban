import { useState } from "react";
import { uid } from "../../utils/kanbanUtils";

const EMPTY_FORM = {
  name: "",
  description: "",
  severity: "Medium",
  assignee: "",
  targetDate: "",
};

/**
 * AddTaskModal
 * Form for creating a new task. The created task always lands in the
 * column where isDefault === true (handled by the parent).
 *
 * Props:
 *   onAdd   — fn(task) called with the new task object on submit
 *   onClose — fn() called when the modal should be dismissed
 */
export default function AddTaskModal({ onAdd, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({
      id: uid(),
      progress: 0,
      actualEndDate: null,
      ...form,
    });
  };

  // Function to get today's date in 'YYYY-MM-DD' format
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Splits the ISO string "YYYY-MM-DDTHH:mm:ss.sssZ" and returns the date part
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Add task</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Title *
            </label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Task title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Description
            </label>
            <textarea
              type="text"
              autoComplete="off"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Task Description"
              className="w-full h-25 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Severity */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Severity
              </label>
              <select
                value={form.severity}
                onChange={(e) => setField("severity", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              >
                {["Critical", "High", "Medium", "Low"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Phase */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Phase
              </label>
              <select
                value={form.severity}
                onChange={(e) => setField("severity", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              >
                {["Development", "Testing"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Assignee
            </label>
            <input
              value={form.assignee}
              onChange={(e) => setField("assignee", e.target.value)}
              placeholder="e.g. Carlo"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Target date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Target date
            </label>
            <input
              type="date"
              min={getTodayDateString()}
              value={form.targetDate}
              onChange={(e) => setField("targetDate", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              Add task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
