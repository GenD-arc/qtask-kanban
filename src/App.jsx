import { useState, useCallback, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import KanbanBoard     from "./components/board/KanbanBoard";
import DoneModal       from "./components/modals/DoneModal";
import AddTaskModal    from "./components/modals/AddTaskModal";
import AddColumnModal  from "./components/modals/AddColumnModal";
import TaskDetailModal from "./components/modals/TaskDetailModal";
import LoginPage       from "./components/auth/LoginPage";
import Sidebar         from "./components/layout/Sidebar";
import ActivityLogPage from "./components/pages/ActivityLogPage";
import AllTasksPage    from "./components/pages/AllTasksPage";
import UserManagementPage from "./components/pages/UserManagementPage";
import ProjectsPage    from "./components/pages/ProjectsPage";
import PhasesPage      from "./components/pages/PhasesPage";
import AnalyticsPage   from "./components/pages/AnalyticsPage";

import { useAuth }        from "./context/useAuth";
import { getDefaultPage } from "./config/navigation";

import {
  fetchPhases, fetchStatuses, fetchSeverities, fetchTasks,
  fetchUsers, fetchProjects, createPhase, moveTask, createTask,
  updateTask, deleteTask, updateSubtasks,
} from "./services/api";

// ── Helpers ───────────────────────────────────────────────────
function getGrouping(role) {
  if (role === "Developer") return "dev";
  if (role === "QA")        return "qa";
  return null;
}

function isPMRole(role) {
  return role === "ProjectManager" || role === "Admin";
}

// ── Project card ──────────────────────────────────────────────
function KanbanProjectCard({ project, onClick }) {
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
        {project.actualEndDate || project.status === "completed" ? (
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

// ── Project list view ─────────────────────────────────────────
function KanbanProjectListView({ projects, onSelect, pageTitle, pageSubtitle }) {
  const ongoing   = projects.filter((p) => !p.actualEndDate && p.status !== "completed");
  const completed = projects.filter((p) => !!p.actualEndDate || p.status === "completed");

  return (
    <div className="space-y-8 pb-10" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{pageSubtitle}</p>
        <h1 className="text-2xl font-black text-slate-800 leading-none">{pageTitle}</h1>
      </div>

      {ongoing.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ongoing</span>
            <span className="text-[9px] font-bold rounded-full px-2 py-0.5" style={{ background: "#eff6ff", color: "#1d4ed8" }}>{ongoing.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ongoing.map((p) => <KanbanProjectCard key={p.id} project={p} onClick={() => onSelect(p.id)} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed</span>
            <span className="text-[9px] font-bold rounded-full px-2 py-0.5" style={{ background: "#ecfdf5", color: "#059669" }}>{completed.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completed.map((p) => <KanbanProjectCard key={p.id} project={p} onClick={() => onSelect(p.id)} />)}
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

// ── App gate ──────────────────────────────────────────────────
export default function App() {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return <LoginPage />;
  return <Board currentUser={currentUser} logout={logout} />;
}

// ── Board ─────────────────────────────────────────────────────
function Board({ currentUser, logout }) {
  const [activePage,      setActivePage]      = useState(() => getDefaultPage(currentUser.role));
  const [projects,        setProjects]        = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [devPhases,       setDevPhases]       = useState([]);
  const [qaPhases,        setQaPhases]        = useState([]);
  const [statuses,        setStatuses]        = useState([]);
  const [severities,      setSeverities]      = useState([]);
  const [tasks,           setTasks]           = useState([]);
  const [users,           setUsers]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [renderKey,       setRenderKey]       = useState(0);
  const [doneModal,       setDoneModal]       = useState(null);
  const [showAddTask,     setShowAddTask]     = useState(false);
  const [showAddColumn,   setShowAddColumn]   = useState(false);
  const [detailTask,      setDetailTask]      = useState(null);
  const [analyticsProjectId, setAnalyticsProjectId] = useState(null);

  const isPM      = isPMRole(currentUser.role);
  const grouping  = getGrouping(currentUser.role);
  const allPhases = [...devPhases, ...qaPhases];

  // ── Load static data on mount ─────────────────────────────
  useEffect(() => {
    async function loadStatic() {
      try {
        setLoading(true);
        const [
          projectData, devPhaseData, qaPhaseData,
          statusData, severityData, userData,
        ] = await Promise.all([
          isPM ? fetchProjects() : Promise.resolve([]),
          isPM ? fetchPhases("dev") : fetchPhases(grouping),
          isPM ? fetchPhases("qa")  : Promise.resolve([]),
          fetchStatuses(),
          fetchSeverities(),
          fetchUsers(),
        ]);
        setProjects(projectData);
        setDevPhases(devPhaseData);
        setQaPhases(qaPhaseData);
        setStatuses(statusData);
        setSeverities(severityData);
        setUsers(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStatic();
  }, [isPM, grouping]);

  // ── Load tasks when activeProjectId changes ───────────────
  // Only reloads when a valid projectId is set — does NOT clear
  // tasks on navigation so detailTask modal stays open
  useEffect(() => {
    if (!activeProjectId && isPM) return;
    async function loadTasks() {
      try {
        const isQA  = currentUser.role === "QA";
        const isDev = currentUser.role === "Developer";
        const data  = await fetchTasks(
          isPM  ? activeProjectId : null,
          (isQA || isDev) ? currentUser.id : null,
          isQA  ? "qa" : isDev ? "dev" : null,
        );
        setTasks(data);
      } catch (err) {
        console.error("Failed to load tasks:", err.message);
      }
    }
    loadTasks();
  }, [activeProjectId, isPM, currentUser]);

  // ── Derived ───────────────────────────────────────────────
  const tasksByPhase = allPhases.reduce((acc, p) => {
    acc[p.id] = tasks.filter((t) => t.phaseId === p.id);
    return acc;
  }, {});

  const findTask      = useCallback((taskId) => tasks.find((t) => t.id === taskId), [tasks]);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  // ── Handlers ──────────────────────────────────────────────
  const handleProjectSelect = useCallback((projectId) => {
    setActiveProjectId(projectId);
    setRenderKey((k) => k + 1);
  }, []);

  const handleProjectBack = useCallback(() => {
    setActiveProjectId(null);
    setTasks([]);
  }, []);

  const handleDragEnd = useCallback(async (fromPhaseId, toPhaseId, taskId) => {
    if (fromPhaseId === toPhaseId) return;
    const targetPhase = allPhases.find((p) => p.id === toPhaseId);
    if (targetPhase?.isFinal) {
      setDoneModal({ taskId, targetPhaseId: toPhaseId });
    } else {
      try {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, phaseId: toPhaseId, phaseLabel: targetPhase?.label, phaseGrouping: targetPhase?.grouping }
              : t
          )
        );
        setRenderKey((k) => k + 1);
        const updated = await moveTask(taskId, toPhaseId);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      } catch (err) {
        console.error("Move failed:", err.message);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, phaseId: fromPhaseId } : t))
        );
        setRenderKey((k) => k + 1);
        alert(`Move failed: ${err.message}`);
      }
    }
  }, [allPhases]);

  const handleDoneConfirm = useCallback(async (actualEndDate) => {
    if (!doneModal) return;
    const { taskId, targetPhaseId } = doneModal;
    const targetPhase = allPhases.find((p) => p.id === targetPhaseId);
    try {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, phaseId: targetPhaseId, phaseLabel: targetPhase?.label, actualEndDate, progress: 100 }
            : t
        )
      );
      setRenderKey((k) => k + 1);
      const updated = await moveTask(taskId, targetPhaseId, actualEndDate);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error("Done confirm failed:", err.message);
      alert(`Failed to mark done: ${err.message}`);
    } finally {
      setDoneModal(null);
    }
  }, [doneModal, allPhases]);

  const handleAddTask = useCallback(async (formData) => {
    try {
      const newTask = await createTask({ ...formData, projectId: activeProjectId });
      setTasks((prev) => [newTask, ...prev]);
      setShowAddTask(false);
      setRenderKey((k) => k + 1);
    } catch (err) {
      console.error("Create task failed:", err.message);
      alert(`Failed to create task: ${err.message}`);
    }
  }, [activeProjectId]);

  const handleAddColumn = useCallback(async ({ label, isFinal, isDefault }) => {
    const maxOrder = allPhases.reduce((max, p) => Math.max(max, p.sortOrder ?? 0), 0);
    const saved    = await createPhase({
      label, isFinal: isFinal ? 1 : 0,
      isDefault: isDefault ? 1 : 0, sortOrder: maxOrder + 1,
    });
    if (saved.grouping === "dev") setDevPhases((prev) => [...prev, saved]);
    else                          setQaPhases((prev)  => [...prev, saved]);
    setShowAddColumn(false);
    setRenderKey((k) => k + 1);
  }, [allPhases]);

  const handleEditTask = useCallback(async (taskId, payload) => {
    try {
      const updated = await updateTask(taskId, payload);
      setTasks((prev)      => prev.map((t) => (t.id === taskId ? updated : t)));
      setDetailTask((prev) => (prev?.id === taskId ? updated : prev));
    } catch (err) {
      console.error("Edit task failed:", err.message);
      throw err;
    }
  }, []);

  const handleDeleteTask = useCallback(async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setDetailTask(null);
      setRenderKey((k) => k + 1);
    } catch (err) {
      console.error("Delete task failed:", err.message);
      throw err;
    }
  }, []);

  const handleCardClick = useCallback((task) => setDetailTask(task), []);

  const handleUpdateSubtasks = useCallback(async (taskId, newSubtasks) => {
    try {
      const updated = await updateSubtasks(taskId, newSubtasks);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error("Subtask update failed:", err.message);
    }
  }, []);

  const totalTasks = tasks.length;
  const doneTask   = doneModal ? findTask(doneModal.taskId) : null;

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#3b82f6", borderTopColor: "transparent" }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Loading board…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f8fafc", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
        <div className="rounded-2xl p-6 max-w-sm w-full text-center space-y-3" style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", border: "1px solid #1e40af30" }}>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#f87171" }}>Connection Failed</p>
          <p className="text-sm font-medium" style={{ color: "#cbd5e1" }}>{error}</p>
          <p className="text-xs" style={{ color: "#64748b" }}>
            Make sure the Express backend is running on{" "}
            <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#ffffff10", color: "#93c5fd" }}>localhost:5000</code>
          </p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 text-sm font-semibold rounded-xl" style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)", color: "#fff" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Inline helpers ─────────────────────────────────────────
  const KanbanHeader = ({ title, subtitle }) => (
    <div className="flex justify-between items-end mb-6">
      <div className="flex items-center gap-4">
        {isPM && (
          <button
            onClick={handleProjectBack}
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{subtitle}</p>
          <h1 className="text-2xl font-black text-slate-800 leading-none">{title}</h1>
          {isPM && activeProject && (
            <p className="text-[11px] text-slate-400 font-medium mt-1">{activeProject.clientName || ""}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPM && (
          <button
            onClick={() => setShowAddColumn(true)}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", color: "#fff" }}
          >
            + Add phase
          </button>
        )}
        <button
          onClick={() => setShowAddTask(true)}
          className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)", color: "#fff" }}
        >
          + Add task
        </button>
      </div>
    </div>
  );

  const SectionLabel = ({ children }) => (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-black uppercase tracking-widest text-slate-400" style={{ letterSpacing: "0.12em" }}>
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
    </div>
  );

  // ── PM project list gate ───────────────────────────────────
  const isKanbanPage = ["overview", "kanban", "my-tasks", "qa-board"].includes(activePage);
  if (isPM && isKanbanPage && !activeProjectId) {
    const pageMeta = {
      overview:    { title: "Overview",    subtitle: "Select a project" },
      kanban:      { title: "Kanban Board", subtitle: "Select a project" },
      "my-tasks":  { title: "My Tasks",    subtitle: "Select a project" },
      "qa-board":  { title: "QA Board",    subtitle: "Select a project" },
    };
    const meta = pageMeta[activePage];
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
        <Sidebar currentUser={currentUser} activePage={activePage} onNavigate={setActivePage} onLogout={logout} />
        <main className="flex-1 overflow-y-auto p-6">
          <KanbanProjectListView
            projects={projects}
            onSelect={handleProjectSelect}
            pageTitle={meta.title}
            pageSubtitle={meta.subtitle}
          />
        </main>
      </div>
    );
  }

  // ── Page content ──────────────────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case "overview":
      case "kanban":
        return (
          <>
            <KanbanHeader
              title={activePage === "kanban" ? "Kanban Board" : activeProject?.title ?? "Overview"}
              subtitle={`${totalTasks} task${totalTasks !== 1 ? "s" : ""} across ${allPhases.length} phases`}
            />
            {isPM ? (
              <>
                <div className="mb-8">
                  <SectionLabel>Development</SectionLabel>
                  <KanbanBoard columns={devPhases} tasks={tasksByPhase} renderKey={renderKey} onDragEnd={handleDragEnd} onCardClick={handleCardClick} />
                </div>
                <div>
                  <SectionLabel>QA</SectionLabel>
                  <KanbanBoard columns={qaPhases} tasks={tasksByPhase} renderKey={renderKey} onDragEnd={handleDragEnd} onCardClick={handleCardClick} />
                </div>
              </>
            ) : (
              <KanbanBoard columns={devPhases} tasks={tasksByPhase} renderKey={renderKey} onDragEnd={handleDragEnd} onCardClick={handleCardClick} />
            )}
          </>
        );

      case "my-tasks":
        return (
          <>
            <KanbanHeader title="My Tasks" subtitle="Tasks assigned to you" />
            <KanbanBoard
              columns={devPhases}
              tasks={Object.fromEntries(
                Object.entries(tasksByPhase).map(([phaseId, phaseTasks]) => [
                  phaseId,
                  phaseTasks.filter((t) => t.assigneeId === currentUser.id),
                ])
              )}
              renderKey={renderKey}
              onDragEnd={handleDragEnd}
              onCardClick={handleCardClick}
            />
          </>
        );

      case "qa-board":
        return (
          <>
            <KanbanHeader
              title="QA Board"
              subtitle={`${totalTasks} task${totalTasks !== 1 ? "s" : ""} in QA pipeline`}
            />
            <KanbanBoard
              columns={devPhases}
              tasks={tasksByPhase}
              renderKey={renderKey}
              onDragEnd={handleDragEnd}
              onCardClick={handleCardClick}
            />
          </>
        );

      case "tasks":
      case "all-tasks":
        return (
          <AllTasksPage
            tasks={tasks}
            allPhases={allPhases}
            currentUser={currentUser}
            onCardClick={handleCardClick}
          />
        );

      case "logs":
        return <ActivityLogPage currentUser={currentUser} />;

      case "users":
        return <UserManagementPage currentUser={currentUser} />;

      case "projects":
        return <ProjectsPage users={users} />;

      case "phases":
        return <PhasesPage />;

      case "analytics":
        return (
          <AnalyticsPage
            selectedId={analyticsProjectId}
            onSelect={setAnalyticsProjectId}
            onBack={() => setAnalyticsProjectId(null)}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#94a3b8" }}>Under Development</p>
              <p className="text-sm" style={{ color: "#cbd5e1" }}>Check back later</p>
            </div>
          </div>
        );
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar
        currentUser={currentUser}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={logout}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {renderPage()}
      </main>

      {/* Modals — rendered outside renderPage so they persist across navigation */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          users={users}
          severities={severities}
          statuses={statuses}
          onUpdate={(taskId, fields) => {
            if (fields.subtasks !== undefined) handleUpdateSubtasks(taskId, fields.subtasks);
          }}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onClose={() => setDetailTask(null)}
        />
      )}

      {doneModal && doneTask && (
        <DoneModal
          taskName={doneTask.title}
          onConfirm={handleDoneConfirm}
          onCancel={() => setDoneModal(null)}
        />
      )}

      {showAddTask && (
        <AddTaskModal
          onAdd={handleAddTask}
          onClose={() => setShowAddTask(false)}
          users={users}
          phases={allPhases}
          severities={severities}
        />
      )}

      {showAddColumn && (
        <AddColumnModal
          onAdd={handleAddColumn}
          onClose={() => setShowAddColumn(false)}
        />
      )}
    </div>
  );
}