import { useState, useEffect, useCallback } from "react";
import {
  TriangleAlert,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  GripVertical,
} from "lucide-react";
import {
  fetchSeverities,
  createSeverity,
  updateSeverity,
  deleteSeverity,
} from "../../services/api";

// ── Preset colors for the severity dot ───────────────────────
const PRESET_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#6b7280", label: "Gray" },
];

const DEFAULT_COLOR = "#6b7280";

// ── Add / Edit modal ─────────────────────────────────────────
function SeverityModal({ mode, initial, onConfirm, onClose }) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setErr("Label is required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await onConfirm({ label: trimmed, color, sortOrder: Number(sortOrder) });
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[340px] p-6 space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            {mode === "add" ? "Add Severity" : "Edit Severity"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Label */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Label
          </label>
          <input
            autoFocus
            type="text"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. 1 - Critical"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                title={c.label}
                onClick={() => setColor(c.value)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                style={{
                  backgroundColor: c.value,
                  borderColor: color === c.value ? "#1d4ed8" : "transparent",
                }}
              >
                {color === c.value && (
                  <Check size={12} color="white" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Order */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Sort Order
          </label>
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Error */}
        {err && <p className="text-xs text-red-500">{err}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : mode === "add" ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm delete modal ──────────────────────────────────────
function DeleteModal({ severity, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setErr("");
    try {
      await onConfirm(severity.id);
    } catch (e) {
      setErr(e.message);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[320px] p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={16} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Delete Severity
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700">
                "{severity.label}"
              </span>
              ? This cannot be undone.
            </p>
          </div>
        </div>
        {err && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
            {err}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export default function SeverityPage() {
  const [severities, setSeverities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  // Modal state
  const [addModal, setAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // severity object
  const [deleteTarget, setDeleteTarget] = useState(null); // severity object

  // ── Fetch ────────────────────────────────────────────────
  const loadSeverities = useCallback(async () => {
    try {
      setLoading(true);
      setLoadErr("");
      const data = await fetchSeverities();
      setSeverities(data);
    } catch (e) {
      setLoadErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeverities();
  }, [loadSeverities]);

  // ── Add ──────────────────────────────────────────────────
  const handleAdd = async (payload) => {
    const created = await createSeverity(payload);
    setSeverities((prev) => [...prev, created]);
    setAddModal(false);
  };

  // ── Edit ─────────────────────────────────────────────────
  const handleEdit = async (payload) => {
    const updated = await updateSeverity(editTarget.id, payload);
    setSeverities((prev) =>
      prev.map((s) => (s.id === editTarget.id ? updated : s)),
    );
    setEditTarget(null);
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    await deleteSeverity(id);
    setSeverities((prev) => prev.filter((s) => s.id !== id));
    setDeleteTarget(null);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Severities</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage the severity levels used when creating tasks
          </p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Add Severity
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────── */}
      {loading ? (
        <div className="text-sm text-gray-400 animate-pulse">
          Loading severities…
        </div>
      ) : loadErr ? (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <TriangleAlert size={15} />
          {loadErr}
          <button
            onClick={loadSeverities}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      ) : severities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 gap-2">
          <TriangleAlert size={28} strokeWidth={1.5} />
          <p className="text-sm">No severities yet — add one to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-2.5 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-6" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Label
            </span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Order
            </span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Actions
            </span>
          </div>

          {/* Rows */}
          <ul className="divide-y divide-gray-50">
            {severities.map((sev) => (
              <li
                key={sev.id}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors group"
              >
                {/* Color dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: sev.color ?? DEFAULT_COLOR }}
                  title={sev.color ?? "Default color"}
                />

                {/* Label */}
                <span className="text-sm font-medium text-gray-700 truncate">
                  {sev.label}
                </span>

                {/* Sort order */}
                <span className="text-xs text-gray-400 tabular-nums w-10 text-center">
                  {sev.sortOrder}
                </span>

                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditTarget(sev)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(sev)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Footer count */}
          <div className="px-5 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              {severities.length} severit{severities.length === 1 ? "y" : "ies"}
            </p>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────── */}
      {addModal && (
        <SeverityModal
          mode="add"
          onConfirm={handleAdd}
          onClose={() => setAddModal(false)}
        />
      )}

      {editTarget && (
        <SeverityModal
          mode="edit"
          initial={editTarget}
          onConfirm={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          severity={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
