import { useState, useCallback, useEffect } from "react";

import KanbanBoard from "./components/board/KanbanBoard";
import DoneModal from "./components/modals/DoneModal";
import AddTaskModal from "./components/modals/AddTaskModal";
import AddColumnModal from "./components/modals/AddColumnModal";
import TaskDetailModal from "./components/modals/TaskDetailModal";
import LoginPage from "./components/auth/LoginPage";
import Sidebar from "./components/layout/Sidebar";
import ActivityLogPage from "./components/pages/ActivityLogPage";
import AllTasksPage from "./components/pages/AllTasksPage";
import UserManagementPage from "./components/pages/UserManagementPage";
import ProjectsPage from "./components/pages/ProjectsPage";
import PhasesPage from "./components/pages/PhasesPage";

import { useAuth } from "./context/useAuth";
import { getDefaultPage } from "./config/navigation";

import {
  fetchPhases,
  fetchStatuses,
  fetchSeverities,
  fetchTasks,
  fetchUsers,
  fetchProjects,
  createPhase,
  moveTask,
  createTask,
  updateTask,
  deleteTask,
  updateSubtasks,
} from "./services/api";

// ── Role → phase grouping (null = all phases) ─────────────────
function getGrouping(role) {
  if (role === "Developer") return "dev";
  if (role === "QA") return "qa";
  return null;
}

// ── Role → is PM-level (sees both boards) ─────────────────────
function isPMRole(role) {
  return role === "ProjectManager" || role === "Admin";
}

// ─────────────────────────────────────────────────────────────
export default function App() {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return <LoginPage />;
  return <Board currentUser={currentUser} logout={logout} />;
}

// ─────────────────────────────────────────────────────────────
function Board({ currentUser, logout }) {
  const [activePage, setActivePage] = useState(() =>
    getDefaultPage(currentUser.role),
  );
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [devPhases, setDevPhases] = useState([]);
  const [qaPhases, setQaPhases] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const [doneModal, setDoneModal] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [detailTask, setDetailTask] = useState(null);

  const isPM = isPMRole(currentUser.role);
  const grouping = getGrouping(currentUser.role);
  const allPhases = [...devPhases, ...qaPhases];

  // ── Load projects + static data on mount ──────────────────
  useEffect(() => {
    async function loadStatic() {
      try {
        setLoading(true);
        const [
          projectData,
          devPhaseData,
          qaPhaseData,
          statusData,
          severityData,
          userData,
        ] = await Promise.all([
          isPM ? fetchProjects() : Promise.resolve([]),
          isPM ? fetchPhases("dev") : fetchPhases(grouping),
          isPM ? fetchPhases("qa") : Promise.resolve([]),
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

        // Set first project as active by default
        if (projectData.length > 0) {
          setActiveProjectId(projectData[0].id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStatic();
  }, [isPM, grouping]);

  // ── Load tasks whenever activeProjectId changes ────────────
  useEffect(() => {
    async function loadTasks() {
      try {
        const isQA = currentUser.role === "QA";
        const isDev = currentUser.role === "Developer";

        const data = await fetchTasks(
          isPM ? activeProjectId : null,
          // QA sees only tasks assigned to them as QA assignee
          // Dev sees only tasks assigned to them as dev assignee
          isQA || isDev ? currentUser.id : null,
          isQA ? "qa" : isDev ? "dev" : null,
        );
        setTasks(data);
      } catch (err) {
        console.error("Failed to load tasks:", err.message);
      }
    }
    loadTasks();
  }, [activeProjectId, isPM, currentUser]);

  // ── Project switch ─────────────────────────────────────────
  const handleProjectChange = useCallback((projectId) => {
    setActiveProjectId(projectId);
    setRenderKey((k) => k + 1);
  }, []);

  // ── Derived: group tasks by phaseId ───────────────────────
  const tasksByPhase = allPhases.reduce((acc, p) => {
    acc[p.id] = tasks.filter((t) => t.phaseId === p.id);
    return acc;
  }, {});

  const findTask = useCallback(
    (taskId) => tasks.find((t) => t.id === taskId),
    [tasks],
  );

  // ── Drag end ──────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (fromPhaseId, toPhaseId, taskId) => {
      if (fromPhaseId === toPhaseId) return;
      const targetPhase = allPhases.find((p) => p.id === toPhaseId);
      if (targetPhase?.isFinal) {
        setDoneModal({ taskId, targetPhaseId: toPhaseId });
      } else {
        try {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    phaseId: toPhaseId,
                    phaseLabel: targetPhase?.label,
                    phaseGrouping: targetPhase?.grouping,
                  }
                : t,
            ),
          );
          setRenderKey((k) => k + 1);
          await moveTask(taskId, toPhaseId);
        } catch (err) {
          console.error("Move failed:", err.message);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, phaseId: fromPhaseId } : t,
            ),
          );
          setRenderKey((k) => k + 1);
          alert(`Move failed: ${err.message}`);
        }
      }
    },
    [allPhases],
  );

  // ── Done modal confirm ────────────────────────────────────
  const handleDoneConfirm = useCallback(
    async (actualEndDate) => {
      if (!doneModal) return;
      const { taskId, targetPhaseId } = doneModal;
      const targetPhase = allPhases.find((p) => p.id === targetPhaseId);
      try {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  phaseId: targetPhaseId,
                  phaseLabel: targetPhase?.label,
                  actualEndDate,
                  progress: 100,
                }
              : t,
          ),
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
    },
    [doneModal, allPhases],
  );

  // ── Add task ──────────────────────────────────────────────
  const handleAddTask = useCallback(
    async (formData) => {
      try {
        const newTask = await createTask({
          ...formData,
          projectId: activeProjectId,
        });
        setTasks((prev) => [newTask, ...prev]);
        setShowAddTask(false);
        setRenderKey((k) => k + 1);
      } catch (err) {
        console.error("Create task failed:", err.message);
        alert(`Failed to create task: ${err.message}`);
      }
    },
    [activeProjectId],
  );

  // ── Add column ────────────────────────────────────────────
  const handleAddColumn = useCallback(
    async ({ label, isFinal, isDefault }) => {
      const maxOrder = allPhases.reduce(
        (max, p) => Math.max(max, p.sortOrder ?? 0),
        0,
      );
      const saved = await createPhase({
        label,
        isFinal: isFinal ? 1 : 0,
        isDefault: isDefault ? 1 : 0,
        sortOrder: maxOrder + 1,
      });
      if (saved.grouping === "dev") setDevPhases((prev) => [...prev, saved]);
      else setQaPhases((prev) => [...prev, saved]);
      setShowAddColumn(false);
      setRenderKey((k) => k + 1);
    },
    [allPhases],
  );

  // ── Edit task ─────────────────────────────────────────────
  const handleEditTask = useCallback(async (taskId, payload) => {
    try {
      const updated = await updateTask(taskId, payload);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setDetailTask((prev) => (prev?.id === taskId ? updated : prev));
    } catch (err) {
      console.error("Edit task failed:", err.message);
      throw err;
    }
  }, []);

  // ── Delete task ───────────────────────────────────────────
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

  // ── Card click ────────────────────────────────────────────
  const handleCardClick = useCallback((task) => {
    setDetailTask(task);
  }, []);

  // ── Subtask update ────────────────────────────────────────
  const handleUpdateSubtasks = useCallback(async (taskId, newSubtasks) => {
    try {
      const updated = await updateSubtasks(taskId, newSubtasks);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error("Subtask update failed:", err.message);
    }
  }, []);

  const totalTasks = tasks.length;
  const doneTask = doneModal ? findTask(doneModal.taskId) : null;

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading board…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-6 max-w-sm text-center space-y-3">
          <p className="text-red-500 font-semibold">
            Could not connect to the server
          </p>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-xs text-gray-400">
            Make sure the Express backend is running on{" "}
            <code className="bg-gray-100 px-1 rounded">localhost:5000</code>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Kanban board JSX (reused in multiple pages) ────────────
  const KanbanHeader = ({ title, subtitle }) => (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {isPM && (
          <button
            onClick={() => setShowAddColumn(true)}
            className="bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition text-sm shadow"
          >
            + Add phase
          </button>
        )}
        <button
          onClick={() => setShowAddTask(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm shadow"
        >
          + Add task
        </button>
      </div>
    </div>
  );

  // ── Page content ──────────────────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case "overview":
      case "kanban":
        return (
          <>
            <KanbanHeader
              title={activePage === "kanban" ? "Kanban Board" : "Overview"}
              subtitle={`${totalTasks} task${totalTasks !== 1 ? "s" : ""} across ${allPhases.length} phases`}
            />
            {isPM ? (
              <>
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Development
                  </h2>
                  <KanbanBoard
                    columns={devPhases}
                    tasks={tasksByPhase}
                    renderKey={renderKey}
                    onDragEnd={handleDragEnd}
                    onCardClick={handleCardClick}
                  />
                </div>
                <div className="border-t border-gray-200 my-6" />
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    QA
                  </h2>
                  <KanbanBoard
                    columns={qaPhases}
                    tasks={tasksByPhase}
                    renderKey={renderKey}
                    onDragEnd={handleDragEnd}
                    onCardClick={handleCardClick}
                  />
                </div>
              </>
            ) : (
              <KanbanBoard
                columns={devPhases}
                tasks={tasksByPhase}
                renderKey={renderKey}
                onDragEnd={handleDragEnd}
                onCardClick={handleCardClick}
              />
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
                ]),
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

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-gray-400 font-medium">
                This page is under development
              </p>
              <p className="text-sm text-gray-300">Check back later</p>
            </div>
          </div>
        );
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentUser={currentUser}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={logout}
        projects={projects}
        activeProjectId={activeProjectId}
        onProjectChange={handleProjectChange}
      />

      <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          users={users}
          severities={severities}
          statuses={statuses}
          onUpdate={(taskId, fields) => {
            if (fields.subtasks !== undefined) {
              handleUpdateSubtasks(taskId, fields.subtasks);
            }
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
