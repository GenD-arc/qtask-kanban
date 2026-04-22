import { useState, useEffect, useCallback, useMemo } from "react";
import { UserPlus, Pencil, Trash2, KeyRound, PowerOff, Power } from "lucide-react";
import { clsx } from "clsx";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserStatus,
  deleteUser,
} from "../../services/api";

// ── Constants ─────────────────────────────────────────────────
const ROLES = ["Admin", "ProjectManager", "Developer", "QA"];

const ROLE_COLORS = {
  Admin:          "bg-red-100 text-red-600",
  ProjectManager: "bg-purple-100 text-purple-600",
  Developer:      "bg-blue-100 text-blue-600",
  QA:             "bg-green-100 text-green-600",
};

// ── Sub-components ────────────────────────────────────────────

function Avatar({ name }) {
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600
                    flex items-center justify-center text-xs font-bold uppercase shrink-0">
      {name.charAt(0)}
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span className={clsx(
      "text-xs font-medium px-2 py-1 rounded-full",
      ROLE_COLORS[role] ?? "bg-gray-100 text-gray-500"
    )}>
      {role}
    </span>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span className={clsx(
      "text-xs font-medium px-2 py-1 rounded-full",
      isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
    )}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ── User Form Modal ───────────────────────────────────────────
function UserFormModal({ user, onSave, onClose }) {
  const isEdit = !!user;
  const [form,    setForm]    = useState({
    name:     user?.name     ?? "",
    username: user?.username ?? "",
    role:     user?.role     ?? "Developer",
    password: "",
  });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim())     return setError("Name is required.");
    if (!form.username.trim()) return setError("Username is required.");
    if (!isEdit && !form.password.trim()) return setError("Password is required.");
    if (!isEdit && form.password.length < 6) return setError("Password must be at least 6 characters.");

    try {
      setLoading(true);
      const payload = isEdit
        ? { name: form.name, username: form.username, role: form.role }
        : { name: form.name, username: form.username, role: form.role, password: form.password };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={isEdit ? "Edit User" : "Add User"} onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <Field label="Full Name">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Juan Dela Cruz"
            className={inputClass}
          />
        </Field>

        <Field label="Username">
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="e.g. juan"
            className={inputClass}
          />
        </Field>

        <Field label="Role">
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className={inputClass}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>

        {!isEdit && (
          <Field label="Password">
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className={inputClass}
            />
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={primaryBtn}>
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Add User"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Reset Password Modal ──────────────────────────────────────
function ResetPasswordModal({ user, onClose }) {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!password.trim())       return setError("Password is required.");
    if (password.length < 6)    return setError("Password must be at least 6 characters.");
    if (password !== confirm)   return setError("Passwords do not match.");

    try {
      setLoading(true);
      await resetUserPassword(user.id, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={`Reset Password — ${user.name}`} onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg px-4 py-3">
              Password reset successfully.
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className={primaryBtn}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <Field label="New Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={inputClass}
              />
            </Field>
            <Field label="Confirm Password">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className={inputClass}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className={secondaryBtn}>Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className={primaryBtn}>
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────
function DeleteConfirmModal({ user, onConfirm, onClose }) {
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
    <ModalShell title="Delete User" onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-600">
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold text-gray-800">{user.name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm
                       font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Shared modal shell ────────────────────────────────────────
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Shared form helpers ───────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const inputClass    = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const primaryBtn    = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50";
const secondaryBtn  = "px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition";

// ── Main component ────────────────────────────────────────────
export default function UserManagementPage({ currentUser }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Modal state ───────────────────────────────────────────
  const [addModal,      setAddModal]      = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [resetTarget,   setResetTarget]   = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  // ── Filter state ──────────────────────────────────────────
  const [roleFilter,   setRoleFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Fetch ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered users ────────────────────────────────────────
  const visibleUsers = useMemo(() => {
    let result = users;
    if (roleFilter)   result = result.filter((u) => u.role === roleFilter);
    if (statusFilter) result = result.filter((u) =>
      statusFilter === "active" ? u.isActive : !u.isActive
    );
    return result;
  }, [users, roleFilter, statusFilter]);

  // ── Handlers ──────────────────────────────────────────────
  const handleAdd = useCallback(async (payload) => {
    const newUser = await createUser(payload);
    setUsers((prev) => [...prev, newUser]);
  }, []);

  const handleEdit = useCallback(async (payload) => {
    const updated = await updateUser(editTarget.id, payload);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }, [editTarget]);

  const handleToggleStatus = useCallback(async (user) => {
    const updated = await toggleUserStatus(user.id, !user.isActive);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }, []);

  const handleDelete = useCallback(async () => {
    await deleteUser(deleteTarget.id);
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
  }, [deleteTarget]);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {users.filter((u) => u.isActive).length} active · {users.length} total
          </p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className={clsx(primaryBtn, "flex items-center gap-2")}
        >
          <UserPlus size={15} />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={clsx(inputClass, "w-44")}
            >
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={clsx(inputClass, "w-36")}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {(roleFilter || statusFilter) && (
            <button
              onClick={() => { setRoleFilter(""); setStatusFilter(""); }}
              className={secondaryBtn}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Loading users…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Name", "Username", "Role", "Status", "Actions"].map((col) => (
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
                {visibleUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={clsx(
                      "transition-colors",
                      !user.isActive && "opacity-50"
                    )}
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} />
                        <div>
                          <p className="font-medium text-gray-800">{user.name}</p>
                          {user.id === currentUser.id && (
                            <p className="text-xs text-blue-400">You</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-5 py-3.5 text-gray-500">
                      @{user.username}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge isActive={user.isActive} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">

                        {/* Edit */}
                        <ActionButton
                          icon={<Pencil size={14} />}
                          label="Edit"
                          onClick={() => setEditTarget(user)}
                          color="blue"
                        />

                        {/* Reset password */}
                        <ActionButton
                          icon={<KeyRound size={14} />}
                          label="Reset Password"
                          onClick={() => setResetTarget(user)}
                          color="yellow"
                        />

                        {/* Toggle status */}
                        <ActionButton
                          icon={user.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                          label={user.isActive ? "Deactivate" : "Reactivate"}
                          onClick={() => handleToggleStatus(user)}
                          color={user.isActive ? "orange" : "green"}
                        />

                        {/* Delete — blocked for self */}
                        {user.id !== currentUser.id && (
                          <ActionButton
                            icon={<Trash2 size={14} />}
                            label="Delete"
                            onClick={() => setDeleteTarget(user)}
                            color="red"
                          />
                        )}
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
        <UserFormModal
          user={null}
          onSave={handleAdd}
          onClose={() => setAddModal(false)}
        />
      )}
      {editTarget && (
        <UserFormModal
          user={editTarget}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── Action button helper ──────────────────────────────────────
const ACTION_COLORS = {
  blue:   "text-blue-400 hover:text-blue-600 hover:bg-blue-50",
  yellow: "text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50",
  orange: "text-orange-400 hover:text-orange-600 hover:bg-orange-50",
  green:  "text-green-400 hover:text-green-600 hover:bg-green-50",
  red:    "text-red-400 hover:text-red-600 hover:bg-red-50",
};

function ActionButton({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={clsx(
        "p-1.5 rounded-lg transition-colors",
        ACTION_COLORS[color]
      )}
    >
      {icon}
    </button>
  );
}