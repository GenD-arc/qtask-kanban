// src/components/modals/ProjectModals.jsx

import { useState, useMemo } from "react";
import { clsx } from "clsx";

const inputClass   = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const primaryBtn   = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50";
const secondaryBtn = "px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition";

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.3)" }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProjectFormModal({ project, users, onSave, onClose }) {
  const isEdit = !!project;

  // Format the date if it exists to strictly match YYYY-MM-DD
  const formattedDate = project?.targetEndDate 
    ? project.targetEndDate.split('T')[0] 
    : "";

  const [form, setForm] = useState({
    title:         project?.title         ?? "",
    description:   project?.description   ?? "",
    pmId:          project?.pmId          ?? "",
    clientName:    project?.clientName    ?? "",
    targetEndDate: formattedDate,
    status:        project?.status        ?? "ongoing", // <-- Added Status
  });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const pmUsers = useMemo(
    () => users.filter((u) => u.role === "ProjectManager" || u.role === "Admin"),
    [users]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim()) return setError("Title is required.");
    try {
      setLoading(true);
      await onSave({
        title:         form.title.trim(),
        description:   form.description.trim() || null,
        pmId:          form.pmId ? Number(form.pmId) : null,
        clientName:    form.clientName.trim() || null,
        targetEndDate: form.targetEndDate || null,
        status:        form.status, // <-- Pass Status to API
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={isEdit ? "Edit Project" : "Add Project"} onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <Field label="Project Title *">
          <input
            autoFocus
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. QTask Development"
            className={inputClass}
          />
        </Field>

        <Field label="Client Name (optional)">
          <input
            name="clientName"
            value={form.clientName}
            onChange={handleChange}
            placeholder="e.g. Hefty Power System Corporation"
            className={inputClass}
          />
        </Field>

        <Field label="Description (optional)">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief project description…"
            rows={3}
            className={clsx(inputClass, "resize-none")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Project Manager (optional)">
            <select name="pmId" value={form.pmId} onChange={handleChange} className={inputClass}>
              <option value="">Unassigned</option>
              {pmUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>

          {/* New Status Field */}
          <Field label="Project Status">
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
        </div>

        <Field label="Target End Date (optional)">
          <input
            name="targetEndDate"
            type="date"
            value={form.targetEndDate}
            onChange={handleChange}
            className={inputClass}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={primaryBtn}>
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Project"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function DeleteConfirmModal({ project, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Delete Project" onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-800">{project.title}</span>?
          Tasks under this project will not be deleted but will become unlinked.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}