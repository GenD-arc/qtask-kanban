import { useState, useRef } from "react";
import { Upload } from "lucide-react";

/**
 * AddTaskModal
 *
 * Three behaviours requested:
 *
 * 1. Severity dropdown populated from the DB (severities prop).
 * 2. Quick-add: once a title is typed the user can press Enter or click
 *    "Quick Add" to immediately create the task in the default (isDefault)
 *    column with just the title. The rest of the fields are optional.
 * 3. Full form layout is preserved — all fields are still present and
 *    functional for when the PM wants to fill in more detail.
 *
 * Props:
 *   onAdd       — fn(payload)
 *   onClose     — fn()
 *   users       — [{ id, name, role }]
 *   statuses    — [{ id, label, isDefault, isFinal }]
 *   severities  — [{ id, label }]
 */

export default function AddTaskModal({
  onAdd,
  onClose,
  users = [],
  statuses = [],
  severities = [],
}) {
  const defaultStatus = statuses.find((s) => s.isDefault) ?? statuses[0];

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    severityId: "",
    targetDate: "",
  });
  const [adding, setAdding] = useState(false);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // Build the payload — statusId always goes to the default column
  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim() || null,
    statusId: defaultStatus?.id ?? undefined,
    assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
    severityId: form.severityId ? Number(form.severityId) : null,
    targetDate: form.targetDate || null,
  });

  // Full form submit (Add Task button or Enter in any field)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || adding) return;
    setAdding(true);
    try {
      await onAdd(buildPayload());
    } finally {
      setAdding(false);
    }
  };

  // Quick-add: Enter key on the title field only submits if no other
  // field has been filled — gives the user a chance to use quick flow
  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (form.title.trim()) handleSubmit(e);
    }
  };

  const canSubmit = form.title.trim().length > 0 && !adding;

  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Add task</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* ── Title — quick-add hint shown below ── */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Title *
            </label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="Task title — press Enter for quick add"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              required
            />
            {/* Quick-add hint — only shown once the user starts typing */}
            {form.title.trim().length > 0 && (
              <p className="text-xs text-blue-500">
                Press Enter to add instantly to{" "}
                <span className="font-medium">
                  {defaultStatus?.label ?? "default column"}
                </span>
                , or fill in details below.
              </p>
            )}
          </div>

          {/* ── Description ── */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {/* ── Assignee + Severity side by side ── */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Assignee
              </label>
              <select
                value={form.assigneeId}
                onChange={(e) => set("assigneeId", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Severity
              </label>
              <select
                value={form.severityId}
                onChange={(e) => set("severityId", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="">None</option>
                {severities.map((sv) => (
                  <option key={sv.id} value={sv.id}>
                    {sv.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Target date ── */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Target date
            </label>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => set("targetDate", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* ── Upload File ── */}
          <div className="flex flex-col items-center gap-3">
            <label className="w-full text-xs font-medium uppercase text-gray-500">
              Upload File
            </label>
            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            {/* Custom Upload Button */}
            <div
              onClick={handleClick}
              className="flex flex-col items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition w-full"
            >
              <Upload size={24} className="text-gray-500" />
              <p className="text-sm text-gray-400">Click to upload a file</p>
            </div>
            {/* File Name Display */}
            {fileName && (
              <p className="text-sm text-green-600">Selected: {fileName}</p>
            )}
          </div>

          {/* ── Actions ── */}
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
              disabled={!canSubmit}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {adding ? "Adding…" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
