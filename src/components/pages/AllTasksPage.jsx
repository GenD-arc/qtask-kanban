import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronUp, ChevronDown, ChevronsUpDown, X } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────
const SEVERITY_COLORS = {
  "1 - Critical": "bg-red-100 text-red-600",
  "2 - High":                   "bg-orange-100 text-orange-600",
  "3 - Medium":                 "bg-yellow-100 text-yellow-600",
  "4 - Low":                    "bg-green-100 text-green-600",
};

const PHASE_COLORS = {
  dev: "bg-indigo-50 text-indigo-600",
  qa:  "bg-purple-50 text-purple-600",
};

// Lower index = higher severity (for sorting)
const SEVERITY_ORDER = [
  "1 - Critical",
  "2 - High",
  "3 - Medium",
  "4 - Low",
  "5 - Cosmetic Fix",
  "Nice to Have",
];

const COLUMNS = [
  { key: "title",        label: "Title",       sortable: true  },
  { key: "phaseLabel",   label: "Phase",       sortable: true  },
  { key: "statusLabel",  label: "Status",      sortable: false },
  { key: "severityLabel",label: "Severity",    sortable: true  },
  { key: "assigneeName", label: "Assignee",    sortable: false },
  { key: "targetDate",   label: "Target Date", sortable: true  },
  { key: "progress",     label: "Progress",    sortable: true  },
];

// ── Helpers ───────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function compareValues(a, b, key, direction) {
  let valA = a[key];
  let valB = b[key];

  // Nulls always go last regardless of direction
  if (valA == null && valB == null) return 0;
  if (valA == null) return 1;
  if (valB == null) return -1;

  // Severity uses explicit order instead of alphabetical
  if (key === "severityLabel") {
    valA = SEVERITY_ORDER.indexOf(valA);
    valB = SEVERITY_ORDER.indexOf(valB);
  }

  // Date comparison
  if (key === "targetDate") {
    valA = new Date(valA).getTime();
    valB = new Date(valB).getTime();
  }

  if (valA < valB) return direction === "asc" ? -1 : 1;
  if (valA > valB) return direction === "asc" ? 1  : -1;
  return 0;
}

// ── Sub-components ────────────────────────────────────────────
function SortIcon({ column, sortConfig }) {
  if (!column.sortable) return null;
  if (sortConfig.key !== column.key) return <ChevronsUpDown size={13} className="text-gray-300 ml-1 shrink-0" />;
  return sortConfig.direction === "asc"
    ? <ChevronUp   size={13} className="text-blue-500 ml-1 shrink-0" />
    : <ChevronDown size={13} className="text-blue-500 ml-1 shrink-0" />;
}

function ProgressBar({ value }) {
  const pct = value ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
        <div
          className={clsx("h-1.5 rounded-full transition-all", pct === 100 ? "bg-green-500" : "bg-blue-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

function Header({ currentUser, count }) {
  const subtitle = {
    Developer:      "Tasks assigned to you",
    QA:             "Tasks in QA pipeline",
    ProjectManager: "All project tasks",
    Admin:          "All project tasks",
  }[currentUser.role] ?? "All tasks";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">All Tasks</h1>
      <p className="text-sm text-gray-400 mt-0.5">
        {count} task{count !== 1 ? "s" : ""} — {subtitle}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function AllTasksPage({ tasks, allPhases, currentUser, onCardClick }) {

  // ── Sort state — default: targetDate ASC (soonest first) ──
  const [sortConfig, setSortConfig] = useState({ key: "targetDate", direction: "asc" });

  // ── Filter state ──────────────────────────────────────────
  const [filters, setFilters] = useState({
    phase:    "",
    severity: "",
    status:   "",
    assignee: "",
  });

  // ── Phase grouping map { phaseId → "dev"|"qa" } ───────────
  const phaseGroupMap = useMemo(() =>
    allPhases.reduce((acc, p) => ({ ...acc, [p.id]: p.grouping }), {}),
  [allPhases]);

  // ── Unique filter options derived from visible tasks ───────
  const filterOptions = useMemo(() => ({
    phases:     [...new Set(tasks.map((t) => t.phaseLabel).filter(Boolean))],
    severities: [...new Set(tasks.map((t) => t.severityLabel).filter(Boolean))],
    statuses:   [...new Set(tasks.map((t) => t.statusLabel).filter(Boolean))],
    assignees:  [...new Set(tasks.map((t) => t.assigneeName).filter(Boolean))],
  }), [tasks]);

  // ── Pipeline: role filter → column filters → sort ─────────
  const visibleTasks = useMemo(() => {
    // Step 1 — role filter
    let result = tasks;
    if (currentUser.role === "Developer") {
      result = result.filter((t) => t.assigneeId === currentUser.id);
    } else if (currentUser.role === "QA") {
      result = result.filter((t) => phaseGroupMap[t.phaseId] === "qa");
    }

    // Step 2 — column filters
    if (filters.phase)    result = result.filter((t) => t.phaseLabel    === filters.phase);
    if (filters.severity) result = result.filter((t) => t.severityLabel === filters.severity);
    if (filters.status)   result = result.filter((t) => t.statusLabel   === filters.status);
    if (filters.assignee) result = result.filter((t) => t.assigneeName  === filters.assignee);

    // Step 3 — sort (spread to avoid mutating state)
    return [...result].sort((a, b) => compareValues(a, b, sortConfig.key, sortConfig.direction));
  }, [tasks, currentUser, phaseGroupMap, filters, sortConfig]);

  // ── Handlers ──────────────────────────────────────────────
  const handleSort = (column) => {
    if (!column.sortable) return;
    setSortConfig((prev) =>
      prev.key === column.key
        ? { ...prev, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key: column.key, direction: "asc" }
    );
  };

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ phase: "", severity: "", status: "", assignee: "" });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const showAssigneeFilter = currentUser.role === "ProjectManager" || currentUser.role === "Admin";

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Header currentUser={currentUser} count={visibleTasks.length} />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Phase filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Phase</label>
            <select
              value={filters.phase}
              onChange={(e) => handleFilter("phase", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All phases</option>
              {filterOptions.phases.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Severity filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilter("severity", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All severities</option>
              {filterOptions.severities.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilter("status", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All statuses</option>
              {filterOptions.statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Assignee filter — PM/Admin only */}
          {showAssigneeFilter && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Assignee</label>
              <select
                value={filters.assignee}
                onChange={(e) => handleFilter("assignee", e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All assignees</option>
                {filterOptions.assignees.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-600
                         px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {visibleTasks.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">No tasks match the current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col)}
                      className={clsx(
                        "text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap",
                        col.sortable && "cursor-pointer hover:text-gray-700 select-none"
                      )}
                    >
                      <div className="flex items-center">
                        {col.label}
                        <SortIcon column={col} sortConfig={sortConfig} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {visibleTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => onCardClick(task)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Title */}
                    <td className="px-5 py-3.5 max-w-[220px]">
                      <p className="font-medium text-gray-800 truncate">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>
                      )}
                    </td>

                    {/* Phase */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={clsx(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        PHASE_COLORS[phaseGroupMap[task.phaseId]] ?? "bg-gray-100 text-gray-500"
                      )}>
                        {task.phaseLabel ?? "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                      {task.statusLabel ?? "—"}
                    </td>

                    {/* Severity */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {task.severityLabel ? (
                        <span className={clsx(
                          "text-xs font-medium px-2 py-1 rounded-full",
                          SEVERITY_COLORS[task.severityLabel] ?? "bg-gray-100 text-gray-500"
                        )}>
                          {task.severityLabel}
                        </span>
                      ) : "—"}
                    </td>

                    {/* Assignee */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {task.assigneeName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600
                                          flex items-center justify-center text-xs font-bold uppercase shrink-0">
                            {task.assigneeName.charAt(0)}
                          </div>
                          <span className="text-gray-600">{task.assigneeName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Target Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500">
                      {formatDate(task.targetDate)}
                    </td>

                    {/* Progress */}
                    <td className="px-5 py-3.5 min-w-[120px]">
                      <ProgressBar value={task.progress} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}