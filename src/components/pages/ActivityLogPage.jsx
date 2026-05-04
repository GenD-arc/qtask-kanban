import { useState, useEffect, useCallback } from "react";
import { ActivitySquare, Filter, X } from "lucide-react";
import { fetchActivityLogs } from "../../services/api";

const DATE_LOCALE = "en-PH";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString(DATE_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputClass =
  "border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700";

function SectionCard({ title, children, className = "" }) {
  return (
    <div
      className={`rounded-xl overflow-hidden bg-white ${className}`}
      style={{
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white"
        style={{ background: "linear-gradient(90deg, #0f172a, #1e3a5f)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export default function ActivityLogPage({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);

  // 🔥 Pagination state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10,
  });

  // Filters
  const [filters, setFilters] = useState({
    taskId: "",
    from: "",
    to: "",
  });
  const [applied, setApplied] = useState({});

  const isDevOrQA =
    currentUser.role === "Developer" || currentUser.role === "QA";

  // 🔥 Load function (supports pagination + filters)
  const load = useCallback(
    async (activeFilters = {}, pageNum = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = isDevOrQA
          ? {
              ...activeFilters,
              userId: currentUser.id,
              page: pageNum,
              limit: 10,
            }
          : {
              ...activeFilters,
              page: pageNum,
              limit: 10,
            };

        const clean = Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== "" && v != null),
        );

        const result = await fetchActivityLogs(clean);

        setLogs(result.data);
        setPagination(result);
        setPage(result.page);

        setTimeout(() => setFadeIn(true), 50);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, isDevOrQA],
  );

  useEffect(() => {
    load({}, 1);
  }, [load]);

  // Apply filters
  const handleApply = () => {
    setApplied(filters);
    load(filters, 1); // reset to page 1
  };

  // Clear filters
  const handleClear = () => {
    setFilters({ taskId: "", from: "", to: "" });
    setApplied({});
    load({}, 1);
  };

  const hasFilters = Object.values(applied).some((v) => v !== "");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">
            Loading logs
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 pb-10"
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
          Audit Trail
        </p>
        <h1 className="text-2xl font-black text-slate-800 leading-none">
          Activity Log
        </h1>
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4 bg-white flex flex-wrap gap-3 items-end border border-slate-200">
        <input
          type="number"
          placeholder="Task ID"
          value={filters.taskId}
          onChange={(e) =>
            setFilters((p) => ({ ...p, taskId: e.target.value }))
          }
          className={inputClass}
        />

        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
          className={inputClass}
        />

        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
          className={inputClass}
        />

        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"
        >
          <Filter size={14} /> Apply
        </button>

        {hasFilters && (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm flex items-center gap-1"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <SectionCard title="Activity Logs">
        {error ? (
          <div className="py-10 text-center text-red-400">{error}</div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            No activity found
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-5 py-3 text-left text-xs">Task</th>
                  <th className="px-5 py-3 text-left text-xs">Action</th>
                  {!isDevOrQA && (
                    <th className="px-5 py-3 text-left text-xs">User</th>
                  )}
                  <th className="px-5 py-3 text-left text-xs">Date</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="px-5 py-3">{log.taskTitle}</td>
                    <td className="px-5 py-3">{log.action}</td>
                    {!isDevOrQA && (
                      <td className="px-5 py-3">{log.userName}</td>
                    )}
                    <td className="px-5 py-3">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 🔥 Pagination UI */}
            <div className="flex justify-between items-center px-5 py-3 text-xs text-slate-500">
              <span>
                Page {page} of {pagination.totalPages} • {pagination.total} logs
              </span>

              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => load(applied, page - 1)}
                  className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
                >
                  Prev
                </button>

                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => load(applied, page + 1)}
                  className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}

// import { useState, useEffect, useCallback } from "react";
// import { ActivitySquare, Filter, X } from "lucide-react";
// import { fetchActivityLogs } from "../../services/api";

// const DATE_LOCALE = "en-PH";

// function formatDate(dateStr) {
//   if (!dateStr) return "—";
//   return new Date(dateStr).toLocaleString(DATE_LOCALE, {
//     year:   "numeric",
//     month:  "short",
//     day:    "numeric",
//     hour:   "2-digit",
//     minute: "2-digit",
//   });
// }

// // ── Shared design tokens ──────────────────────────────────────

// const inputClass =
//   "border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700";

// function SectionCard({ title, children, className = "" }) {
//   return (
//     <div
//       className={`rounded-xl overflow-hidden bg-white ${className}`}
//       style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
//     >
//       <div
//         className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white"
//         style={{ background: "linear-gradient(90deg, #0f172a, #1e3a5f)" }}
//       >
//         {title}
//       </div>
//       {children}
//     </div>
//   );
// }

// // ── Main ──────────────────────────────────────────────────────

// export default function ActivityLogPage({ currentUser }) {
//   const [logs,    setLogs]    = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error,   setError]   = useState(null);
//   const [fadeIn,  setFadeIn]  = useState(false);

//   // ── Filters ───────────────────────────────────────────────
//   const [filters, setFilters] = useState({ taskId: "", from: "", to: "" });
//   const [applied, setApplied] = useState({});

//   const isDevOrQA = currentUser.role === "Developer" || currentUser.role === "QA";

//   // ── Fetch ─────────────────────────────────────────────────
//   const load = useCallback(async (activeFilters = {}) => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Dev/QA: always scope to their own userId
//       const params = isDevOrQA
//         ? { ...activeFilters, userId: currentUser.id }
//         : activeFilters;

//       // Strip empty values
//       const clean = Object.fromEntries(
//         Object.entries(params).filter(([, v]) => v !== "" && v != null)
//       );

//       const data = await fetchActivityLogs(clean);
//       setLogs(data);
//       setTimeout(() => setFadeIn(true), 50);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [currentUser, isDevOrQA]);

//   useEffect(() => { load(); }, [load]);

//   // ── Filter handlers ───────────────────────────────────────
//   const handleApply = () => {
//     setApplied(filters);
//     load(filters);
//   };

//   const handleClear = () => {
//     setFilters({ taskId: "", from: "", to: "" });
//     setApplied({});
//     load({});
//   };

//   const hasFilters = Object.values(applied).some((v) => v !== "");

//   // ── Render ────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
//           <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Loading logs</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       className="space-y-6 pb-10"
//       style={{
//         fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
//         opacity: fadeIn ? 1 : 0,
//         transform: fadeIn ? "translateY(0)" : "translateY(8px)",
//         transition: "opacity 0.35s ease, transform 0.35s ease",
//       }}
//     >
//       {/* ── Page header ── */}
//       <div>
//         <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Audit Trail</p>
//         <h1 className="text-2xl font-black text-slate-800 leading-none">Activity Log</h1>
//       </div>

//       {/* ── Filters ── */}
//       <div
//         className="rounded-xl p-4 bg-white flex flex-wrap gap-3 items-end"
//         style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
//       >
//         <div className="space-y-1.5">
//           <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Task ID</label>
//           <input
//             type="number"
//             placeholder="e.g. 3"
//             value={filters.taskId}
//             onChange={(e) => setFilters((p) => ({ ...p, taskId: e.target.value }))}
//             className={inputClass}
//             style={{ width: "7rem" }}
//           />
//         </div>

//         <div className="space-y-1.5">
//           <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">From</label>
//           <input
//             type="date"
//             value={filters.from}
//             onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
//             className={inputClass}
//           />
//         </div>

//         <div className="space-y-1.5">
//           <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">To</label>
//           <input
//             type="date"
//             value={filters.to}
//             onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
//             className={inputClass}
//           />
//         </div>

//         <div className="flex gap-2">
//           <button
//             onClick={handleApply}
//             className="flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
//             style={{ background: "linear-gradient(135deg, #1e3a5f, #1e40af)", border: "1px solid #1e40af40" }}
//           >
//             <Filter size={13} />
//             Apply
//           </button>
//           {hasFilters && (
//             <button
//               onClick={handleClear}
//               className="flex items-center gap-1.5 bg-slate-100 text-slate-600
//                          px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
//             >
//               <X size={13} />
//               Clear
//             </button>
//           )}
//         </div>

//         {hasFilters && (
//           <div className="ml-auto text-[10px] font-bold uppercase tracking-widest text-slate-400 self-center">
//             {logs.length} result{logs.length !== 1 ? "s" : ""}
//           </div>
//         )}
//       </div>

//       {/* ── Table ── */}
//       <SectionCard title={isDevOrQA ? "Your Task Activity" : "Full Project Activity History"}>
//         {error ? (
//           <div className="flex items-center justify-center py-16">
//             <p className="text-sm text-red-400">{error}</p>
//           </div>
//         ) : logs.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-16 gap-3">
//             <ActivitySquare size={32} style={{ color: "#cbd5e1" }} />
//             <p className="text-sm text-slate-400">No activity found</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
//                   <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
//                     Task
//                   </th>
//                   <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
//                     Action
//                   </th>
//                   {!isDevOrQA && (
//                     <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
//                       User
//                     </th>
//                   )}
//                   <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
//                     Date & Time
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {logs.map((log, i) => (
//                   <tr
//                     key={log.id}
//                     className="transition-colors hover:bg-slate-50"
//                     style={{ borderBottom: i < logs.length - 1 ? "1px solid #f8fafc" : "none" }}
//                   >
//                     {/* Task */}
//                     <td className="px-5 py-3.5 whitespace-nowrap">
//                       <span className="font-semibold text-slate-700">
//                         {log.taskTitle ?? `Task #${log.taskId}`}
//                       </span>
//                       <span
//                         className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
//                         style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #3b82f630" }}
//                       >
//                         #{log.taskId}
//                       </span>
//                     </td>

//                     {/* Action */}
//                     <td className="px-5 py-3.5 text-slate-500 max-w-sm text-xs leading-relaxed">
//                       {log.action}
//                     </td>

//                     {/* User */}
//                     {!isDevOrQA && (
//                       <td className="px-5 py-3.5 whitespace-nowrap">
//                         {log.userName ? (
//                           <div className="flex items-center gap-2">
//                             <div
//                               className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
//                               style={{ background: "linear-gradient(135deg, #1e3a5f, #1e40af)" }}
//                             >
//                               {log.userName.charAt(0).toUpperCase()}
//                             </div>
//                             <span className="text-slate-600 text-xs">{log.userName}</span>
//                           </div>
//                         ) : (
//                           <span className="text-slate-300 italic text-xs">System</span>
//                         )}
//                       </td>
//                     )}

//                     {/* Date */}
//                     <td className="px-5 py-3.5 whitespace-nowrap">
//                       <span
//                         className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"
//                         style={{ background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }}
//                       >
//                         {formatDate(log.createdAt)}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </SectionCard>
//     </div>
//   );
// }
