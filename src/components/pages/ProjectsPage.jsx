import { useState, useEffect, useCallback, useMemo } from "react";
import { FolderPlus, Pencil, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/api";

// ── Shared styles ─────────────────────────────────────────────
const inputClass   = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const primaryBtn   = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50";
const secondaryBtn = "px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition";

const ACTION_COLORS = {
  blue: "text-blue-400 hover:text-blue-600 hover:bg-blue-50",
  red:  "text-red-400 hover:text-red-600 hover:bg-red-50",
};

// ── Sub-components ────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function ActionButton({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx("p-1.5 rounded-lg transition-colors", ACTION_COLORS[color])}
    >
      {icon}
    </button>
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

// ── Project Form Modal ────────────────────────────────────────
function ProjectFormModal({ project, users, onSave, onClose }) {
  const isEdit = !!project;

  const [form, setForm] = useState({
    title:       project?.title       ?? "",
    description: project?.description ?? "",
    pmId:        project?.pmId        ?? "",
  });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  // Only show PM and Admin users in the PM dropdown
  const pmUsers = useMemo(() =>
    users.filter((u) => u.role === "ProjectManager" || u.role === "Admin"),
  [users]);

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
        title:       form.title.trim(),
        description: form.description.trim() || null,
        pmId:        form.pmId ? Number(form.pmId) : null,
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

        <Field label="Project Title">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. QTask Development"
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

        <Field label="Project Manager (optional)">
          <select
            name="pmId"
            value={form.pmId}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Unassigned</option>
            {pmUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
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

// ── Delete Confirm Modal ──────────────────────────────────────
function DeleteConfirmModal({ project, onConfirm, onClose }) {
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

// ── Main component ────────────────────────────────────────────
export default function ProjectsPage({ users }) {
  const [projects,      setProjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [addModal,      setAddModal]      = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  // ── Fetch ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ──────────────────────────────────────────────
  const handleAdd = useCallback(async (payload) => {
    const created = await createProject(payload);
    setProjects((prev) => [created, ...prev]);
  }, []);

  const handleEdit = useCallback(async (payload) => {
    const updated = await updateProject(editTarget.id, payload);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, [editTarget]);

  const handleDelete = useCallback(async () => {
    await deleteProject(deleteTarget.id);
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
  }, [deleteTarget]);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className={clsx(primaryBtn, "flex items-center gap-2")}
        >
          <FolderPlus size={15} />
          Add Project
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Loading projects…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">No projects yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Title", "Description", "Project Manager", "Tasks", "Created", "Actions"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">

                    {/* Title */}
                    <td className="px-5 py-3.5 max-w-[180px]">
                      <p className="font-medium text-gray-800 truncate">{project.title}</p>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-3.5 max-w-[220px]">
                      <p className="text-gray-500 truncate">
                        {project.description ?? <span className="text-gray-300 italic">No description</span>}
                      </p>
                    </td>

                    {/* PM */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {project.pmName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600
                                          flex items-center justify-center text-xs font-bold uppercase shrink-0">
                            {project.pmName.charAt(0)}
                          </div>
                          <span className="text-gray-600">{project.pmName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Task count */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                        {project.taskCount} task{project.taskCount !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-400 text-xs">
                      {new Date(project.createdAt).toLocaleDateString("en-PH", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <ActionButton
                          icon={<Pencil size={14} />}
                          label="Edit"
                          onClick={() => setEditTarget(project)}
                          color="blue"
                        />
                        <ActionButton
                          icon={<Trash2 size={14} />}
                          label="Delete"
                          onClick={() => setDeleteTarget(project)}
                          color="red"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {addModal && (
        <ProjectFormModal
          project={null}
          users={users}
          onSave={handleAdd}
          onClose={() => setAddModal(false)}
        />
      )}
      {editTarget && (
        <ProjectFormModal
          project={editTarget}
          users={users}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}