import { useState, useEffect } from "react";
import { fetchTasks } from "../../../services/api";
import { computeProgress, computeRiskLevel, computeScheduleHealth, fmtShort } from "./helpers";
import { RISK, SCHEDULE } from "./constants";

export default function ProjectCard({ project, allPhases, onClick, index }) {
  const [tasks, setTasks]   = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchTasks(project.id, null, null).then((data) => {
      setTasks(data);
      setLoaded(true);
    });
  }, [project.id]);

  const progress = computeProgress(tasks);
  const risk     = computeRiskLevel(tasks);
  const schedule = computeScheduleHealth(tasks, allPhases);
  const riskCfg  = RISK[risk];
  const schCfg   = SCHEDULE[schedule];

  const isCompleted = !!project.actualEndDate || project.status === "completed";

  return (
    <div
      onClick={onClick}
      className="rounded-xl bg-white cursor-pointer transition-all duration-200"
      style={{
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        opacity: loaded ? 1 : 0.6,
        animationDelay: `${index * 50}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(30,64,175,0.1)";
        e.currentTarget.style.borderColor = "#bfdbfe";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Card header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 leading-snug truncate">{project.title}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{project.clientName || "—"}</p>
          </div>
          {project.status === "cancelled" ? (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "#fef2f2", color: "#ef4444" }}>
              Cancelled
            </span>
          ) : project.status === "completed" ? (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "#ecfdf5", color: "#059669" }}>
              Completed
            </span>
          ) : (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
              Ongoing
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-3">
        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</span>
            <span className="text-xs font-black text-slate-700">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: isCompleted
                  ? "linear-gradient(90deg, #059669, #10b981)"
                  : "linear-gradient(90deg, #1e40af, #3b82f6)",
              }}
            />
          </div>
        </div>

        {/* Health badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1"
            style={{ background: riskCfg.bg, color: riskCfg.color }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: riskCfg.color, display: "inline-block" }} />
            {risk}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1"
            style={{ background: schCfg.bg, color: schCfg.color }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: schCfg.color, display: "inline-block" }} />
            {schedule}
          </span>
          <span className="text-[9px] font-bold text-slate-400 ml-auto">
            {tasks.length} tasks
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">PM</p>
            <p className="text-[11px] font-semibold text-slate-600 mt-0.5">{project.pmName || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Target</p>
            <p className="text-[11px] font-semibold text-slate-600 mt-0.5">{fmtShort(project.targetEndDate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}