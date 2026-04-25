export default function KanbanProjectCard({ project, onClick }) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl bg-white cursor-pointer transition-all duration-200"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(30,64,175,0.1)"; e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-800 leading-snug truncate">{project.title}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{project.clientName || "—"}</p>
        </div>
        {project.status === "cancelled" ? (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "#fef2f2", color: "#ef4444" }}>Cancelled</span>
        ) : project.actualEndDate || project.status === "completed" ? (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "#ecfdf5", color: "#059669" }}>Completed</span>
        ) : (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "#eff6ff", color: "#1d4ed8" }}>Ongoing</span>
        )}
      </div>
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">PM</p>
          <p className="text-[11px] font-semibold text-slate-600 mt-0.5">{project.pmName || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Target</p>
          <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
            {project.targetEndDate
              ? new Date(project.targetEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}