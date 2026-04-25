import { ArrowLeft } from "lucide-react";

/**
 * KanbanHeader
 *
 * Props:
 *   title          — page title
 *   subtitle       — page subtitle
 *   isPM           — whether the current user is PM/Admin
 *   activeProject  — the currently selected project object
 *   onBack         — called when back button is clicked
 *   onAddPhase     — called when + Add phase is clicked
 *   onAddTask      — called when + Add task is clicked
 */
export default function KanbanHeader({
  title,
  subtitle,
  isPM,
  activeProject,
  onBack,
  onAddPhase,
  onAddTask,
}) {
  return (
    <div className="flex justify-between items-end mb-6">
      <div className="flex items-center gap-4">
        {isPM && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg transition-all"
            style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
          >
            <ArrowLeft size={12} />
            Back
          </button>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            {subtitle}
          </p>
          <h1 className="text-2xl font-black text-slate-800 leading-none">{title}</h1>
          {isPM && activeProject && (
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {activeProject.clientName || ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isPM && (
          <button
            onClick={onAddPhase}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", color: "#fff" }}
          >
            + Add phase
          </button>
        )}
        <button
          onClick={onAddTask}
          className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)", color: "#fff" }}
        >
          + Add task
        </button>
      </div>
    </div>
  );
}