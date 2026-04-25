import { useState } from "react";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";

/**
 * KanbanHeader
 *
 * Props:
 *   title           — page title
 *   subtitle        — page subtitle
 *   isPM            — whether the current user is PM/Admin
 *   activeProject   — the currently selected project object
 *   onBack          — called when back button is clicked
 *   onAddTask       — called when + Add task is clicked
 *
 *   // Filter props
 *   users           — array of { id, name } for assignee filter
 *   severities      — array of { id, label } for severity filter
 *   statuses        — array of { id, label } for status filter
 *   filters         — { userId, severityId, statusId }
 *   onFilterChange  — (key, value) => void
 *   onClearFilters  — () => void
 */
export default function KanbanHeader({
  title,
  subtitle,
  isPM,
  activeProject,
  onBack,
  onAddTask,
  users = [],
  severities = [],
  statuses = [],
  filters = {},
  onFilterChange,
  onClearFilters,
}) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    filters.userId || filters.severityId || filters.statusId;

  return (
    <div className="mb-6 space-y-3">
      {/* ── Row 1: title + action buttons ── */}
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          {isPM && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
              style={{
                background: "#f1f5f9",
                color: "#64748b",
                border: "1px solid #e2e8f0",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#e2e8f0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#f1f5f9")
              }
            >
              <ArrowLeft size={12} />
              Back
            </button>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              {subtitle}
            </p>
            <h1 className="text-2xl font-black text-slate-800 leading-none">
              {title}
            </h1>
            {isPM && activeProject && (
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {activeProject.clientName || ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPM && (
            <>
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
                style={{
                  background:
                    showFilters || hasActiveFilters ? "#eff6ff" : "#f1f5f9",
                  color:
                    showFilters || hasActiveFilters ? "#1d4ed8" : "#64748b",
                  border: `1px solid ${showFilters || hasActiveFilters ? "#bfdbfe" : "#e2e8f0"}`,
                }}
              >
                <SlidersHorizontal size={12} />
                Filters
                {hasActiveFilters && (
                  <span
                    className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: "#1d4ed8", color: "#fff" }}
                  >
                    {
                      [
                        filters.userId,
                        filters.severityId,
                        filters.statusId,
                      ].filter(Boolean).length
                    }
                  </span>
                )}
              </button>

              <button
                onClick={onAddTask}
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                style={{
                  background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                  color: "#fff",
                }}
              >
                + Add task
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Row 2: filter bar (collapsible) ── */}
      {showFilters && (
        <div
          className="flex flex-wrap gap-3 items-end px-4 py-3 rounded-xl"
          style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
        >
          {/* Assignee / User */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              User
            </label>
            <select
              value={filters.userId ?? ""}
              onChange={(e) =>
                onFilterChange(
                  "userId",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Severity
            </label>
            <select
              value={filters.severityId ?? ""}
              onChange={(e) =>
                onFilterChange(
                  "severityId",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">All severities</option>
              {severities.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Status
            </label>
            <select
              value={filters.statusId ?? ""}
              onChange={(e) =>
                onFilterChange(
                  "statusId",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fecaca",
              }}
            >
              <X size={11} />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
