import { useState, useEffect, useCallback, useMemo } from "react";
import { UserPlus, Pencil, Trash2, KeyRound, PowerOff, Power, Users, ShieldCheck, Code2, TestTube2 } from "lucide-react";
import { clsx } from "clsx";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from "../../services/api";
import { UserFormModal, ResetPasswordModal, DeleteUserModal } from "../modals/UserModal";

const ROLES = ["Admin", "ProjectManager", "Developer", "QA"];

const ROLE_COLORS = {
  Admin:          { bg: "#fef2f2", color: "#ef4444", border: "#ef444430" },
  ProjectManager: { bg: "#f5f3ff", color: "#8b5cf6", border: "#8b5cf630" },
  Developer:      { bg: "#eff6ff", color: "#3b82f6", border: "#3b82f630" },
  QA:             { bg: "#f0fdf4", color: "#10b981", border: "#10b98130" },
};

const ACTION_COLORS = {
  blue:   "text-blue-400 hover:text-blue-600 hover:bg-blue-50",
  yellow: "text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50",
  orange: "text-orange-400 hover:text-orange-600 hover:bg-orange-50",
  green:  "text-green-400 hover:text-green-600 hover:bg-green-50",
  red:    "text-red-400 hover:text-red-600 hover:bg-red-50",
};

function KpiCard({ label, value, accent, sub, icon: Icon }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 60%, #1e3a5f)",
        border: `1px solid ${accent}40`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />
      {Icon && (
        <div className="absolute top-3 right-4 opacity-10">
          <Icon size={32} color={accent} />
        </div>
      )}
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-3xl font-black text-white leading-none">{value}</span>
      {sub && <span className="text-[10px] text-slate-500 mt-0.5">{sub}</span>}
    </div>
  );
}

function SectionCard({ title, toolbar, children }) {
  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div
        className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white"
        style={{ background: "linear-gradient(90deg, #0f172a, #1e3a5f)" }}
      >
        {title}
      </div>
      {toolbar && (
        <div
          className="px-5 py-3 flex flex-wrap items-center gap-3"
          style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}
        >
          {toolbar}
        </div>
      )}
      {children}
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: "linear-gradient(135deg, #1e3a5f, #3b82f6)" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function RoleBadge({ role }) {
  const cfg = ROLE_COLORS[role] ?? { bg: "#f1f5f9", color: "#64748b", border: "#64748b30" };
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {role}
    </span>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
      style={
        isActive
          ? { background: "#f0fdf4", color: "#10b981", border: "1px solid #10b98130" }
          : { background: "#f8fafc", color: "#94a3b8", border: "1px solid #94a3b830" }
      }
    >
      {isActive ? "Active" : "Inactive"}
    </span>
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

const filterSelectClass =
  "border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer";

export default function UserManagementPage({ currentUser }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [fadeIn,  setFadeIn]  = useState(false);

  const [addModal,     setAddModal]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [resetTarget,  setResetTarget]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [roleFilter,   setRoleFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllUsers();
      setUsers(data);
      setTimeout(() => setFadeIn(true), 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleUsers = useMemo(() => {
    let result = users;
    if (roleFilter)   result = result.filter((u) => u.role === roleFilter);
    if (statusFilter) result = result.filter((u) =>
      statusFilter === "active" ? u.isActive : !u.isActive
    );
    return result;
  }, [users, roleFilter, statusFilter]);

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

  const activeCount = users.filter((u) => u.isActive).length;
  const devCount    = users.filter((u) => u.role === "Developer").length;
  const qaCount     = users.filter((u) => u.role === "QA").length;
  const pmCount     = users.filter((u) => u.role === "ProjectManager" || u.role === "Admin").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Loading users</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Animated content ── */}
      <div
        className="space-y-6 pb-10"
        style={{
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Administration</p>
            <h1 className="text-2xl font-black text-slate-800 leading-none">User Management</h1>
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1e3a5f, #1e40af)", border: "1px solid #1e40af40" }}
          >
            <UserPlus size={15} />
            Add User
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Active Users" value={activeCount} accent="#10b981" sub={`of ${users.length} total`} icon={Users}       />
          <KpiCard label="Managers"     value={pmCount}     accent="#8b5cf6" sub="admins & project managers"  icon={ShieldCheck} />
          <KpiCard label="Developers"   value={devCount}    accent="#3b82f6" sub="in dev team"                icon={Code2}       />
          <KpiCard label="QA Engineers" value={qaCount}     accent="#f59e0b" sub="in QA team"                 icon={TestTube2}   />
        </div>

        {/* Table with inline filters */}
        <SectionCard
          title="All Users"
          toolbar={
            <>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={filterSelectClass}
              >
                <option value="">All roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={filterSelectClass}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {(roleFilter || statusFilter) && (
                <button
                  onClick={() => { setRoleFilter(""); setStatusFilter(""); }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
                >
                  Clear
                </button>
              )}
            </>
          }
        >
          {error ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-slate-400">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {["Name", "Username", "Role", "Status", "Actions"].map((col) => (
                      <th
                        key={col}
                        className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user, i) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-slate-50"
                      style={{
                        borderBottom: i < visibleUsers.length - 1 ? "1px solid #f8fafc" : "none",
                        opacity: user.isActive ? 1 : 0.45,
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} />
                          <div>
                            <p className="font-semibold text-slate-800">{user.name}</p>
                            {user.id === currentUser.id && (
                              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">You</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        @{user.username}
                      </td>

                      <td className="px-5 py-3.5">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge isActive={user.isActive} />
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <ActionButton icon={<Pencil size={14} />}  label="Edit"           onClick={() => setEditTarget(user)}   color="blue"   />
                          <ActionButton icon={<KeyRound size={14} />} label="Reset Password" onClick={() => setResetTarget(user)}  color="yellow" />
                          <ActionButton
                            icon={user.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                            label={user.isActive ? "Deactivate" : "Reactivate"}
                            onClick={() => handleToggleStatus(user)}
                            color={user.isActive ? "orange" : "green"}
                          />
                          {user.id !== currentUser.id && (
                            <ActionButton icon={<Trash2 size={14} />} label="Delete" onClick={() => setDeleteTarget(user)} color="red" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Modals outside the transformed div ── */}
      {addModal && (
        <UserFormModal user={null} onSave={handleAdd} onClose={() => setAddModal(false)} />
      )}
      {editTarget && (
        <UserFormModal user={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />
      )}
      {resetTarget && (
        <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteUserModal user={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}