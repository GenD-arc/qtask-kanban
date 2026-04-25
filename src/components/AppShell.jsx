import { useState, useCallback, useEffect } from "react";

import KanbanBoard           from "./board/KanbanBoard";
import KanbanHeader          from "./board/KanbanHeader";
import KanbanProjectListView from "./board/KanbanProjectListView";
import DoneModal             from "./modals/DoneModal";
import AddTaskModal          from "./modals/AddTaskModal";
import AddColumnModal        from "./modals/AddColumnModal";
import TaskDetailModal       from "./modals/TaskDetailModal";
import Sidebar               from "./layout/Sidebar";
import ActivityLogPage       from "./pages/ActivityLogPage";
import AllTasksPage          from "./pages/AllTasksPage";
import UserManagementPage    from "./pages/UserManagementPage";
import ProjectsPage          from "./pages/ProjectsPage";
import AnalyticsPage         from "./pages/AnalyticsPage";
import DashboardPage         from "./pages/DashboardPage";
import SettingsPage          from "./pages/SettingsPage";

import { getDefaultPage }    from "../config/navigation";

import {
  fetchPhases, fetchStatuses, fetchSeverities, fetchTasks,
  fetchUsers, fetchProjects, createPhase, moveTask, createTask,
  updateTask, deleteTask, updateSubtasks,
} from "../services/api";

// ── Helpers ───────────────────────────────────────────────────
function getGrouping(role) {
  if (role === "Developer") return "dev";
  if (role === "QA")        return "qa";
  return null;
}

function isPMRole(role) {
  return role === "ProjectManager" || role === "Admin";
}

const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 mb-3">
    <span className="text-xs font-black uppercase tracking-widest text-slate-400" style={{ letterSpacing: "0.12em" }}>
      {children}
    </span>
    <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
  </div>
);

// ─────────────────────────────────────────────────────────────
export default function AppShell({ currentUser, logout }) {
  const [activePage,         setActivePage]         = useState(() => getDefaultPage(currentUser.role));
  const [projects,           setProjects]           = useState([]);
  const [activeProjectId,    setActiveProjectId]    = useState(null);
  const [devPhases,          setDevPhases]          = useState([]);
  const [qaPhases,           setQaPhases]           = useState([]);
  const [statuses,           setStatuses]           = useState([]);
  const [severities,         setSeverities]         = useState([]);
  const [tasks,              setTasks]              = useState([]);
  const [users,              setUsers]              = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [renderKey,          setRenderKey]          = useState(0);
  const [doneModal,          setDoneModal]          = useState(null);
  const [showAddTask,        setShowAddTask]        = useState(false);
  const [showAddColumn,      setShowAddColumn]      = useState(false);
  const [detailTask,         setDetailTask]         = useState(null);
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

  // ── Real-time update listeners ────────────────────────────
  useEffect(() => {
    const handleProjectUpdate = () => {
      if (!isPM) return;
      fetchProjects().then((updatedProjects) => {
        setProjects(updatedProjects);
        if (activeProjectId && !updatedProjects.find((p) => p.id === activeProjectId)) {
          handleProjectBack();
        }
      });
    };

    const handlePhaseUpdate = () => {
      if (isPM) {
        Promise.all([fetchPhases("dev"), fetchPhases("qa")]).then(([dev, qa]) => {
          setDevPhases(dev);
          setQaPhases(qa);
        });
      } else {
        fetchPhases(grouping).then(setDevPhases);
      }
      setRenderKey((k) => k + 1);
    };

    const handleSeverityUpdate = () => {
      fetchSeverities().then(setSeverities);
      if (activeProjectId) {
        const isQA  = currentUser.role === "QA";
        const isDev = currentUser.role === "Developer";
        fetchTasks(
          isPM ? activeProjectId : null,
          (isQA || isDev) ? currentUser.id : null,
          isQA ? "qa" : isDev ? "dev" : null,
        ).then(setTasks);
      }
      setRenderKey((k) => k + 1);
    };

    const handleStatusUpdate = () => {
      fetchStatuses().then(setStatuses);
      setRenderKey((k) => k + 1);
    };

    window.addEventListener("projects-updated",   handleProjectUpdate);
    window.addEventListener("phases-updated",     handlePhaseUpdate);
    window.addEventListener("severities-updated", handleSeverityUpdate);
    window.addEventListener("statuses-updated",   handleStatusUpdate);

    return () => {
      window.removeEventListener("projects-updated",   handleProjectUpdate);
      window.removeEventListener("phases-updated",     handlePhaseUpdate);
      window.removeEventListener("severities-updated", handleSeverityUpdate);
      window.removeEventListener("statuses-updated",   handleStatusUpdate);
    };
  }, [isPM, grouping, activeProjectId, currentUser]);

  // ── Derived ───────────────────────────────────────────────
  const tasksByPhase = allPhases.reduce((acc, p) => {
    acc[p.id] = tasks.filter((t) => t.phaseId === p.id);
    return acc;
  }, {});

  const findTask      = useCallback((taskId) => tasks.find((t) => t.id === taskId), [tasks]);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const totalTasks    = tasks.length;
  const doneTask      = doneModal ? findTask(doneModal.taskId) : null;

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
    window.dispatchEvent(new Event("phases-updated"));
  }, [allPhases]);

  // ── Edit task — optimistically patches statusLabel + statusColor ──────────
  // The modal passes statusLabel and statusColor in the payload (resolved from
  // the statuses list) so cards update immediately without waiting for a DB
  // refetch. The DB response (updated) is still applied afterwards to stay
  // consistent, but we preserve the resolved display fields if the DB row
  // doesn't return them.
  const handleEditTask = useCallback(async (taskId, payload) => {
    // Pull out the display fields before sending to the API — they are
    // client-side only and the server doesn't need them.
    const { statusLabel, statusColor, ...apiPayload } = payload;

    // Optimistically apply the resolved display fields immediately so that
    // TaskCard's useEffect picks them up before the API call resolves.
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              ...apiPayload,
              ...(statusLabel !== undefined && { statusLabel }),
              ...(statusColor !== undefined && { statusColor }),
            }
          : t
      )
    );
    setDetailTask((prev) =>
      prev?.id === taskId
        ? {
            ...prev,
            ...apiPayload,
            ...(statusLabel !== undefined && { statusLabel }),
            ...(statusColor !== undefined && { statusColor }),
          }
        : prev
    );

    try {
      const updated = await updateTask(taskId, apiPayload);

      // Merge the DB response but keep the resolved display fields in case
      // the API row doesn't join them back (e.g. statusLabel / statusColor).
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...updated,
                statusLabel: updated.statusLabel ?? statusLabel ?? t.statusLabel,
                statusColor: updated.statusColor ?? statusColor ?? t.statusColor,
              }
            : t
        )
      );
      setDetailTask((prev) =>
        prev?.id === taskId
          ? {
              ...updated,
              statusLabel: updated.statusLabel ?? statusLabel ?? prev.statusLabel,
              statusColor: updated.statusColor ?? statusColor ?? prev.statusColor,
            }
          : prev
      );
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

  const handleCardClick      = useCallback((task) => setDetailTask(task), []);

  const handleUpdateSubtasks = useCallback(async (taskId, newSubtasks) => {
    try {
      const updated = await updateSubtasks(taskId, newSubtasks);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error("Subtask update failed:", err.message);
    }
  }, []);

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

  // ── PM project list gate ───────────────────────────────────
  const isKanbanPage = ["overview", "kanban", "my-tasks", "qa-board"].includes(activePage);
  if (isPM && isKanbanPage && !activeProjectId) {
    const pageMeta = {
      overview:   { title: "Overview",     subtitle: "Select a project" },
      kanban:     { title: "Kanban Board", subtitle: "Select a project" },
      "my-tasks": { title: "My Tasks",     subtitle: "Select a project" },
      "qa-board": { title: "QA Board",     subtitle: "Select a project" },
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
      case "dashboard":
        return (
          <DashboardPage
            onNavigate={(page, id) => {
              if (page === "analytics" && id) {
                setAnalyticsProjectId(id);
                setActivePage("analytics");
              } else if (page === "analytics") {
                setAnalyticsProjectId(null);
                setActivePage("analytics");
              } else if (page === "projects") {
                setActivePage("projects");
              } else if (page === "users") {
                setActivePage("users");
              }
            }}
          />
        );

      case "overview":
      case "kanban":
        return (
          <>
            <KanbanHeader
              title={activePage === "kanban" ? "Kanban Board" : activeProject?.title ?? "Overview"}
              subtitle={`${totalTasks} task${totalTasks !== 1 ? "s" : ""} across ${allPhases.length} phases`}
              isPM={isPM}
              activeProject={activeProject}
              onBack={handleProjectBack}
              onAddPhase={() => setShowAddColumn(true)}
              onAddTask={() => setShowAddTask(true)}
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
            <KanbanHeader
              title="My Tasks"
              subtitle="Tasks assigned to you"
              isPM={isPM}
              activeProject={activeProject}
              onBack={handleProjectBack}
              onAddPhase={() => setShowAddColumn(true)}
              onAddTask={() => setShowAddTask(true)}
            />
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
              isPM={isPM}
              activeProject={activeProject}
              onBack={handleProjectBack}
              onAddPhase={() => setShowAddColumn(true)}
              onAddTask={() => setShowAddTask(true)}
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

      case "analytics":
        return (
          <AnalyticsPage
            selectedId={analyticsProjectId}
            onSelect={setAnalyticsProjectId}
            onBack={() => setAnalyticsProjectId(null)}
            onManageSeverities={() => setActivePage("settings")}
          />
        );

      case "settings":
        return <SettingsPage />;

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

      {/* Modals — outside renderPage so they persist across navigation */}
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