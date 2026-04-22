import { useState, useEffect, useCallback } from "react";
import { ActivitySquare, Filter, X } from "lucide-react";
import { fetchActivityLogs } from "../../services/api";

const DATE_LOCALE = "en-PH";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString(DATE_LOCALE, {
    year:   "numeric",
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityLogPage({ currentUser }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Filters ───────────────────────────────────────────────
  const [filters, setFilters] = useState({ taskId: "", from: "", to: "" });
  const [applied, setApplied] = useState({});

  const isDevOrQA = currentUser.role === "Developer" || currentUser.role === "QA";

  // ── Fetch ─────────────────────────────────────────────────
  const load = useCallback(async (activeFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Dev/QA: always scope to their own userId
      const params = isDevOrQA
        ? { ...activeFilters, userId: currentUser.id }
        : activeFilters;

      // Strip empty values
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== "" && v != null)
      );

      const data = await fetchActivityLogs(clean);
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isDevOrQA]);

  useEffect(() => { load(); }, [load]);

  // ── Filter handlers ───────────────────────────────────────
  const handleApply = () => {
    setApplied(filters);
    load(filters);
  };

  const handleClear = () => {
    setFilters({ taskId: "", from: "", to: "" });
    setApplied({});
    load({});
  };

  const hasFilters = Object.values(applied).some((v) => v !== "");

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Activity Log</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isDevOrQA ? "Your task activity" : "Full project activity history"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Task ID</label>
            <input
              type="number"
              placeholder="e.g. 3"
              value={filters.taskId}
              onChange={(e) => setFilters((p) => ({ ...p, taskId: e.target.value }))}
              className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 bg-blue-600 text-white
                         px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              <Filter size={14} />
              Apply
            </button>
            {hasFilters && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-600
                           px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200 transition"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Loading logs…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <ActivitySquare size={32} className="text-gray-300" />
            <p className="text-sm text-gray-400">No activity found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  {!isDevOrQA && (
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                  )}
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-700">
                        {log.taskTitle ?? `Task #${log.taskId}`}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">#{log.taskId}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-sm">
                      {log.action}
                    </td>
                    {!isDevOrQA && (
                      <td className="px-5 py-3.5">
                        {log.userName ? (
                          <span className="text-gray-600">{log.userName}</span>
                        ) : (
                          <span className="text-gray-300 italic">System</span>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                      {formatDate(log.createdAt)}
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