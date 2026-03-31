import { useState, useCallback, useEffect } from "react";

import KanbanBoard     from "./components/board/KanbanBoard";
import DoneModal       from "./components/modals/DoneModal";
import AddTaskModal    from "./components/modals/AddTaskModal";
import AddColumnModal  from "./components/modals/AddColumnModal";
import TaskDetailModal from "./components/modals/TaskDetailModal";

import {
  fetchStatuses,
  fetchSeverities,
  fetchTasks,
  fetchUsers,
  moveTask,
  createTask,
  updateTask,
  deleteTask,
  updateSubtasks,
} from "./services/api";

export default function App() {
  const [statuses,      setStatuses]      = useState([]);
  const [severities,    setSeverities]    = useState([]);
  const [tasks,         setTasks]         = useState([]);
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [renderKey,     setRenderKey]     = useState(0);
  const [doneModal,     setDoneModal]     = useState(null);
  const [showAddTask,   setShowAddTask]   = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [detailTask,    setDetailTask]    = useState(null);

  // ── Load on mount ─────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [statusData, severityData, taskData, userData] = await Promise.all([
          fetchStatuses(),
          fetchSeverities(),
          fetchTasks(),
          fetchUsers(),
        ]);
        setStatuses(statusData);
        setSeverities(severityData);
        setTasks(taskData);
        setUsers(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Derived: group tasks by statusId ─────────────────────
  const tasksByStatus = statuses.reduce((acc, s) => {
    acc[s.id] = tasks.filter((t) => t.statusId === s.id);
    return acc;
  }, {});

  const findTask = useCallback(
    (taskId) => tasks.find((t) => t.id === taskId),
    [tasks]
  );

  // ── Drag end ──────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (fromStatusId, toStatusId, taskId) => {
      if (fromStatusId === toStatusId) return;
      const targetStatus = statuses.find((s) => s.id === toStatusId);

      if (targetStatus?.isFinal) {
        setDoneModal({ taskId, targetStatusId: toStatusId });
      } else {
        try {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, statusId: toStatusId, statusLabel: targetStatus?.label }
                : t
            )
          );
          setRenderKey((k) => k + 1);
          await moveTask(taskId, toStatusId);
        } catch (err) {
          console.error("Move failed:", err.message);
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, statusId: fromStatusId } : t))
          );
          setRenderKey((k) => k + 1);
          alert(`Move failed: ${err.message}`);
        }
      }
    },
    [statuses]
  );

  // ── Done modal confirm ────────────────────────────────────
  const handleDoneConfirm = useCallback(
    async (actualEndDate) => {
      if (!doneModal) return;
      const { taskId, targetStatusId } = doneModal;
      const targetStatus = statuses.find((s) => s.id === targetStatusId);
      try {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, statusId: targetStatusId, statusLabel: targetStatus?.label, actualEndDate, progress: 100 }
              : t
          )
        );
        setRenderKey((k) => k + 1);
        const updated = await moveTask(taskId, targetStatusId, actualEndDate);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      } catch (err) {
        console.error("Done confirm failed:", err.message);
        alert(`Failed to mark done: ${err.message}`);
      } finally {
        setDoneModal(null);
      }
    },
    [doneModal, statuses]
  );

  // ── Add task ──────────────────────────────────────────────
  const handleAddTask = useCallback(async (formData) => {
    try {
      const newTask = await createTask(formData);
      setTasks((prev) => [newTask, ...prev]);
      setShowAddTask(false);
      setRenderKey((k) => k + 1);
    } catch (err) {
      console.error("Create task failed:", err.message);
      alert(`Failed to create task: ${err.message}`);
    }
  }, []);

  // ── Edit task fields ──────────────────────────────────────
  // Called from TaskDetailModal when the user saves assignee/severity/date.
  // Updates the flat tasks array so the card on the board reflects the change.
  // Does NOT touch detailTask so the modal's local subtask state is preserved.
  const handleEditTask = useCallback(async (taskId, payload) => {
    try {
      const updated = await updateTask(taskId, payload);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      // Also update detailTask so the view-mode reflects the saved values
      setDetailTask((prev) => (prev?.id === taskId ? updated : prev));
    } catch (err) {
      console.error("Edit task failed:", err.message);
      throw err; // let the modal show its saving state
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

  // ── Add column ────────────────────────────────────────────
  const handleAddColumn = useCallback((col) => {
    setStatuses((prev) => [...prev, col]);
    setShowAddColumn(false);
  }, []);

  const totalTasks = tasks.length;
  const doneTask   = doneModal ? findTask(doneModal.taskId) : null;

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
          <p className="text-red-500 font-semibold">Could not connect to the server</p>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalTasks} task{totalTasks !== 1 ? "s" : ""} across {statuses.length} columns
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddColumn(true)}
            className="bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition text-sm shadow"
          >
            + Add column
          </button>
          <button
            onClick={() => setShowAddTask(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm shadow"
          >
            + Add task
          </button>
        </div>
      </div>

      {/* Board */}
      <KanbanBoard
        columns={statuses}
        tasks={tasksByStatus}
        renderKey={renderKey}
        onDragEnd={handleDragEnd}
        onCardClick={handleCardClick}
      />

      {/* Task detail / edit modal */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          users={users}
          severities={severities}
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

      {/* Done modal */}
      {doneModal && doneTask && (
        <DoneModal
          taskName={doneTask.title}
          onConfirm={handleDoneConfirm}
          onCancel={() => setDoneModal(null)}
        />
      )}

      {/* Add task modal */}
      {showAddTask && (
        <AddTaskModal
          onAdd={handleAddTask}
          onClose={() => setShowAddTask(false)}
          users={users}
          statuses={statuses}
          severities={severities}
        />
      )}

      {/* Add column modal */}
      {showAddColumn && (
        <AddColumnModal
          onAdd={handleAddColumn}
          onClose={() => setShowAddColumn(false)}
        />
      )}
    </div>
  );
}
