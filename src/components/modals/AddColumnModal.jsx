import { useState } from "react";

/**
 * AddColumnModal
 * Form for creating a new Kanban column.
 * The isFinal checkbox tells the board whether dropping a card
 * here should trigger the Done confirmation modal (SRS §3.3).
 *
 * Props:
 *   onAdd   — fn(col) called with the new column object on submit
 *   onClose — fn() called when the modal should be dismissed
 */
export default function AddColumnModal({ onAdd, onClose }) {
  const [title,   setTitle]   = useState("");
  const [isFinal, setIsFinal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Generate a stable unique key from the title + timestamp
    const key =
      title.trim().toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();

    onAdd({ key, title: title.trim(), isFinal, isDefault: false });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Add column</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Column name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Column name *
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. On Hold"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          {/* isFinal toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isFinal}
              onChange={(e) => setIsFinal(e.target.checked)}
              className="rounded"
            />
            This is a completion column (triggers Done modal)
          </label>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
            >
              Add column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
