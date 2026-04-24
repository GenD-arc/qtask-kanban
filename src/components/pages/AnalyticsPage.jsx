import { useState, useEffect, useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { ArrowLeft } from "lucide-react";
import {
  fetchProjects, fetchTasks, fetchPhases, fetchSeverities, fetchStatuses,
} from "../../services/api";

// ── Helpers ───────────────────────────────────────────────────

function computeRiskLevel(tasks) {
  if (!tasks.length) return "Low Risk";
  const total = tasks.length;
  const high = tasks.filter((t) => t.statusLabel === "Blocked" || t.statusLabel === "Failed").length;
  const med  = tasks.filter((t) => t.statusLabel === "Clarification Needed" || t.statusLabel === "Bug Fixing").length;
  if (high / total > 0.3) return "High Risk";
  if (med  / total > 0.3) return "Medium Risk";
  return "Low Risk";
}

function computeScheduleHealth(tasks, phases) {
  const finalPhase = phases.find((p) => p.isFinal);
  if (!finalPhase) return "On Track";
  const total  = tasks.length || 1;
  const overdue = tasks.filter(
    (t) => t.targetDate && new Date(t.targetDate) < new Date() && t.phaseId !== finalPhase.id
  ).length;
  return overdue / total > 0.3 ? "At Risk" : "On Track";
}

function computeQuality(tasks, phases) {
  const finalPhase = phases.find((p) => p.isFinal);
  if (!tasks.length || !finalPhase) return 0;
  const passed = tasks.filter((t) => t.phaseId === finalPhase.id || t.statusLabel === "Passed").length;
  return Math.round((passed / tasks.length) * 100);
}

function computeProgress(tasks) {
  if (!tasks.length) return 0;
  return Math.round(tasks.reduce((acc, t) => acc + (t.progress ?? 0), 0) / tasks.length);
}

function computeVelocity(tasks) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return tasks.filter(
    (t) => t.phaseLabel?.includes("In Progress") && new Date(t.updatedAt) >= cutoff
  ).length;
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtShort(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Design tokens ─────────────────────────────────────────────

const PHASE_ICONS = { dev: "⚙️", qa: "🧪" };

const RISK = {
  "Low Risk":    { color: "#10b981", bg: "#ecfdf5" },
  "Medium Risk": { color: "#f59e0b", bg: "#fffbeb" },
  "High Risk":   { color: "#ef4444", bg: "#fef2f2" },
};

const SCHEDULE = {
  "On Track": { color: "#10b981", bg: "#ecfdf5" },
  "At Risk":  { color: "#ef4444", bg: "#fef2f2" },
};

const QUALITY = (q) =>
  q === 0   ? { color: "#ef4444", bg: "#fef2f2", label: "Poor" }
  : q < 50  ? { color: "#f59e0b", bg: "#fffbeb", label: "Fair" }
  :           { color: "#10b981", bg: "#ecfdf5", label: "Good" };

const CHART_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

// ── Shared sub-components ─────────────────────────────────────

function HealthRow({ label, color, bg, children }) {
  return (
    <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${color}30` }}>
      <div
        className="w-32 shrink-0 px-3 py-2.5 text-white text-[10px] font-bold uppercase tracking-widest"
        style={{ background: "linear-gradient(135deg, #1e3a5f, #1e40af)" }}
      >
        {label}
      </div>
      <div className="flex-1 px-3 py-2.5 flex items-center gap-2 text-xs font-semibold" style={{ background: bg, color }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
        {children}
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent, sub }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 60%, #1e3a5f)", border: `1px solid ${accent}40` }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-2xl" style={{ background: accent }} />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-3xl font-black text-white leading-none">{value}</span>
      {sub && <span className="text-[10px] text-slate-500 mt-0.5">{sub}</span>}
    </div>
  );
}

function SectionCard({ title, children, className = "" }) {
  return (
    <div className={`rounded-xl overflow-hidden bg-white ${className}`} style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white" style={{ background: "linear-gradient(90deg, #0f172a, #1e3a5f)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Project List View ─────────────────────────────────────────

function ProjectCard({ project, allPhases, onClick, index }) {
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
          {isCompleted ? (
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

function ProjectListView({ projects, allPhases, onSelect, fadeIn }) {
  const ongoing   = projects.filter((p) => !p.actualEndDate && p.status !== "completed");
  const completed = projects.filter((p) => !!p.actualEndDate || p.status === "completed");

  return (
    <div
      className="space-y-8 pb-10"
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Page header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Project Intelligence</p>
        <h1 className="text-2xl font-black text-slate-800 leading-none">Analytics</h1>
      </div>

      {/* Ongoing */}
      {ongoing.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ongoing</span>
            <span
              className="text-[9px] font-bold rounded-full px-2 py-0.5"
              style={{ background: "#eff6ff", color: "#1d4ed8" }}
            >
              {ongoing.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ongoing.map((p, i) => (
              <ProjectCard key={p.id} project={p} allPhases={allPhases} onClick={() => onSelect(p.id)} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed</span>
            <span
              className="text-[9px] font-bold rounded-full px-2 py-0.5"
              style={{ background: "#ecfdf5", color: "#059669" }}
            >
              {completed.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completed.map((p, i) => (
              <ProjectCard key={p.id} project={p} allPhases={allPhases} onClick={() => onSelect(p.id)} index={i} />
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="flex items-center justify-center h-48 rounded-xl text-slate-400 text-sm" style={{ border: "2px dashed #e2e8f0" }}>
          No projects found.
        </div>
      )}
    </div>
  );
}

// ── Analytics Detail View ─────────────────────────────────────

function AnalyticsDetailView({ project, tasks, allPhases, severities, statuses, onBack, fadeIn }) {
  const analytics = useMemo(() => {
    if (!allPhases.length) return null;

    const risk     = computeRiskLevel(tasks);
    const schedule = computeScheduleHealth(tasks, allPhases);
    const quality  = computeQuality(tasks, allPhases);
    const progress = computeProgress(tasks);
    const velocity = computeVelocity(tasks);
    const blockers = tasks.filter((t) => t.statusLabel === "Blocked").length;
    const clarQ    = tasks.filter((t) => t.statusLabel === "Clarification Needed").length;

    const phaseProgress = allPhases
      .map((ph) => {
        const count = tasks.filter((t) => t.phaseId === ph.id).length;
        return { id: ph.id, label: ph.label, pct: tasks.length ? Math.round((count / tasks.length) * 100) : 0, count, icon: PHASE_ICONS[ph.grouping] ?? "📋", isFinal: ph.isFinal };
      })
      .filter((ph) => ph.count > 0)
      .sort((a, b) => b.pct - a.pct);

    const currentPhase = phaseProgress.find((p) => !p.isFinal) ?? phaseProgress[0];

    const sevBreakdown = severities
      .map((s) => ({ name: s.label.replace(/^\d+ - /, ""), full: s.label, value: tasks.filter((t) => t.severityId === s.id).length }))
      .filter((s) => s.value > 0);

    const statusBreakdown = statuses
      .map((s) => ({ name: s.label, value: tasks.filter((t) => t.statusId === s.id).length }))
      .filter((s) => s.value > 0);

    return { risk, schedule, quality, progress, velocity, blockers, clarQ, phaseProgress, currentPhase, sevBreakdown, statusBreakdown, total: tasks.length };
  }, [tasks, allPhases, severities, statuses]);

  const barOptions = useMemo(() => ({
    chart: { type: "bar", toolbar: { show: false }, background: "transparent", fontFamily: "inherit" },
    plotOptions: { bar: { borderRadius: 5, columnWidth: "52%", distributed: true } },
    dataLabels: { enabled: true, style: { fontSize: "10px", fontWeight: 700, colors: ["#fff"] } },
    xaxis: { categories: analytics?.sevBreakdown.map((s) => s.name) ?? [], labels: { style: { fontSize: "9px", colors: "#94a3b8" }, rotate: -30 }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { fontSize: "9px", colors: "#94a3b8" } }, tickAmount: 3, min: 0 },
    colors: CHART_COLORS,
    tooltip: { theme: "dark", y: { title: { formatter: (_, o) => analytics?.sevBreakdown[o?.dataPointIndex]?.full ?? "" } } },
    grid: { borderColor: "#f1f5f9", strokeDashArray: 3, padding: { left: 0, right: 0 } },
    legend: { show: false },
  }), [analytics]);

  const barSeries    = useMemo(() => [{ name: "Tasks", data: analytics?.sevBreakdown.map((s) => s.value) ?? [] }], [analytics]);
  const donutOptions = useMemo(() => ({
    chart: { type: "donut", background: "transparent", fontFamily: "inherit" },
    labels: analytics?.statusBreakdown.map((s) => s.name) ?? [],
    colors: CHART_COLORS,
    legend: { position: "bottom", fontSize: "10px", labels: { colors: "#64748b" }, itemMargin: { horizontal: 6 } },
    dataLabels: { enabled: true, style: { fontSize: "10px", fontWeight: 700 }, dropShadow: { enabled: false } },
    plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: "Total", fontSize: "11px", color: "#64748b", fontWeight: 600, formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) } } } } },
    tooltip: { theme: "dark" },
    stroke: { width: 2, colors: ["#fff"] },
  }), [analytics]);
  const donutSeries = useMemo(() => analytics?.statusBreakdown.map((s) => s.value) ?? [], [analytics]);

  const qualityCfg  = QUALITY(analytics?.quality ?? 0);
  const riskCfg     = RISK[analytics?.risk ?? "Low Risk"];
  const scheduleCfg = SCHEDULE[analytics?.schedule ?? "On Track"];

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
      {/* Page header */}
      <div className="flex items-center gap-4">
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
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Project Intelligence</p>
          <h1 className="text-2xl font-black text-slate-800 leading-none">{project?.title}</h1>
        </div>
      </div>

      {/* Project info + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", border: "1px solid #1e40af30" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-4">Project Details</p>
          <div className="space-y-0 divide-y divide-white/5">
            {[
              { label: "Client",          value: project?.clientName },
              { label: "Date Started",    value: fmt(project?.createdAt) },
              { label: "Target End Date", value: fmt(project?.targetEndDate) },
              { label: "Project Manager", value: project?.pmName },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 py-2">
                <span className="w-28 shrink-0 text-[9px] font-bold uppercase tracking-widest text-blue-300/60 pt-0.5">{label}</span>
                <span className="text-sm text-white/80 font-medium leading-snug">{value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 rounded-xl p-5 bg-white" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Project Health Snapshot</p>
          {analytics ? (
            <div className="grid grid-cols-1 gap-2">
              <HealthRow label="Schedule"      color={scheduleCfg.color} bg={scheduleCfg.bg}>{analytics.schedule}</HealthRow>
              <HealthRow label="Risk Level"    color={riskCfg.color}     bg={riskCfg.bg}    >{analytics.risk}</HealthRow>
              <HealthRow label="Quality"       color={qualityCfg.color}  bg={qualityCfg.bg} >{qualityCfg.label} ({analytics.quality}%)</HealthRow>
              <HealthRow label="Current Phase" color="#3b82f6"            bg="#eff6ff"       >{analytics.currentPhase?.label ?? "—"}</HealthRow>
              <div className="mt-2 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Overall Progress</span>
                  <span className="text-sm font-black text-slate-700">{analytics.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${analytics.progress}%`, background: "linear-gradient(90deg, #1e40af, #3b82f6)" }} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">No tasks found for this project.</p>
          )}
        </div>
      </div>

      {/* KPI row */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard label="Total Tasks"         value={analytics.total}             accent="#3b82f6" sub="across all phases" />
          <KpiCard label="Velocity"            value={analytics.velocity}          accent="#10b981" sub="active dev (7d)" />
          <KpiCard label="Critical Blockers"   value={analytics.blockers}          accent="#ef4444" sub="blocked tasks" />
          <KpiCard label="Clarification Queue" value={analytics.clarQ}             accent="#f59e0b" sub="awaiting input" />
          <KpiCard label="Completion"          value={`${analytics.progress}%`}   accent="#8b5cf6" sub={`${analytics.phaseProgress.filter((p) => p.isFinal).reduce((a, p) => a + p.count, 0)} tasks done`} />
        </div>
      )}

      {/* Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Phase Distribution">
            <div className="p-5 space-y-4">
              {analytics.phaseProgress.length ? analytics.phaseProgress.map((ph, i) => (
                <div key={ph.id} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                      <span>{ph.icon}</span>
                      <span className="truncate max-w-[160px]">{ph.label}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-400">{ph.count} tasks</span>
                      <span className="text-xs font-black text-slate-700 w-8 text-right">{ph.pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ph.pct}%`, background: ph.isFinal ? "linear-gradient(90deg, #059669, #10b981)" : "linear-gradient(90deg, #1e40af, #3b82f6)" }} />
                  </div>
                </div>
              )) : <p className="text-sm text-slate-400 py-4 text-center">No phase data yet.</p>}
            </div>
          </SectionCard>

          <SectionCard title="Tasks by Severity">
            <div className="p-4">
              {analytics.sevBreakdown.length
                ? <ReactApexChart type="bar" height={230} options={barOptions} series={barSeries} />
                : <p className="text-sm text-slate-400 text-center py-10">No data</p>}
            </div>
          </SectionCard>

          <SectionCard title="Status Distribution">
            <div className="p-4">
              {analytics.statusBreakdown.length
                ? <ReactApexChart type="donut" height={230} options={donutOptions} series={donutSeries} />
                : <p className="text-sm text-slate-400 text-center py-10">No data</p>}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

export default function AnalyticsPage({ selectedId, onSelect, onBack }) {
  const [projects,   setProjects]   = useState([]);
  const [allPhases,  setAllPhases]  = useState([]);
  const [severities, setSeverities] = useState([]);
  const [statuses,   setStatuses]   = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [fadeIn,     setFadeIn]     = useState(false);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchPhases(), fetchSeverities(), fetchStatuses()])
      .then(([proj, phases, sevs, stats]) => {
        setProjects(proj);
        setAllPhases(phases);
        setSeverities(sevs);
        setStatuses(stats);
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => setFadeIn(true), 50);
      });
  }, []);

  // ── Fetch tasks when selectedId changes ───────────────────
  useEffect(() => {
    if (!selectedId) return;
    setFadeIn(false);
    fetchTasks(selectedId, null, null).then((data) => {
      setTasks(data);
      setTimeout(() => setFadeIn(true), 50);
    });
  }, [selectedId]);

  const handleSelect = (id) => {
    setFadeIn(false);
    onSelect(id);
  };

  const handleBack = () => {
    setFadeIn(false);
    setTasks([]);
    onBack();
    setTimeout(() => setFadeIn(true), 50);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Loading analytics</p>
        </div>
      </div>
    );
  }

  if (!selectedId) {
    return (
      <ProjectListView
        projects={projects}
        allPhases={allPhases}
        onSelect={handleSelect}
        fadeIn={fadeIn}
      />
    );
  }

  const project = projects.find((p) => p.id === selectedId);

  return (
    <AnalyticsDetailView
      project={project}
      tasks={tasks}
      allPhases={allPhases}
      severities={severities}
      statuses={statuses}
      onBack={handleBack}
      fadeIn={fadeIn}
    />
  );
}