import { useState, useCallback } from "react";

import KanbanBoard from "./components/board/KanbanBoard";
import DoneModal from "./components/modals/DoneModal";
import AddTaskModal from "./components/modals/AddTaskModal";
import AddColumnModal from "./components/modals/AddColumnModal";
import TaskDetailModal from "./components/modals/TaskDetailModal";

import { SEED_COLUMNS, SEED_TASKS } from "./data/seedData";

/**
 * App — root orchestrator
 * Owns all state and passes data + callbacks down to components.
 */
export default function App() {
  const [columns, setColumns] = useState(SEED_COLUMNS);
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [renderKey, setRenderKey] = useState(0);
  const [doneModal, setDoneModal] = useState(null); // { taskId, fromKey, toKey, newIndex }
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [detailTask, setDetailTask] = useState(null); // task object currently open in detail modal

  /* ─────────────────────────────────────────────
   * Find which column key a task currently lives in
   * ───────────────────────────────────────────── */
  const findColKey = useCallback(
    (taskId) =>
      Object.keys(tasks).find((key) => tasks[key].some((t) => t.id === taskId)),
    [tasks],
  );

  /* ─────────────────────────────────────────────
   * Update a task's fields in-place (subtasks, progress, etc.)
   * Called by TaskDetailModal whenever something changes.
   * ───────────────────────────────────────────── */
  const handleUpdateTask = useCallback(
    (taskId, updatedFields) => {
      const colKey = findColKey(taskId);
      if (!colKey) return;

      setTasks((prev) => ({
        ...prev,
        [colKey]: prev[colKey].map((t) =>
          t.id === taskId ? { ...t, ...updatedFields } : t,
        ),
      }));

      // Keep the detail modal in sync with the updated task
      setDetailTask((prev) =>
        prev?.id === taskId ? { ...prev, ...updatedFields } : prev,
      );
    },
    [findColKey],
  );

  /* ─────────────────────────────────────────────
   * Card click → open detail modal
   * ───────────────────────────────────────────── */
  const handleCardClick = useCallback((task) => {
    setDetailTask(task);
  }, []);

  /* ─────────────────────────────────────────────
   * Drag end → normal move or Done modal
   * ───────────────────────────────────────────── */
  const handleDragEnd = useCallback(
    (fromKey, toKey, taskId, newIndex) => {
      if (fromKey === toKey) return;

      const targetCol = columns.find((c) => c.key === toKey);

      if (targetCol?.isFinal) {
        setDoneModal({ taskId, fromKey, toKey, newIndex });
      } else {
        commitMove(fromKey, toKey, taskId, newIndex, {});
      }
    },
    [columns],
  );

  /* ─────────────────────────────────────────────
   * Commit a drag move to state
   * ───────────────────────────────────────────── */
  const commitMove = (fromKey, toKey, taskId, newIndex, extraFields) => {
    setTasks((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        next[k] = [...prev[k]];
      });
      if (!next[toKey]) next[toKey] = [];

      const task = next[fromKey]?.find((t) => t.id === taskId);
      if (!task) return prev;

      next[fromKey] = next[fromKey].filter((t) => t.id !== taskId);
      next[toKey].splice(newIndex, 0, { ...task, ...extraFields });
      return next;
    });
    setRenderKey((k) => k + 1);
  };

  /* ─────────────────────────────────────────────
   * Done modal confirm
   * ───────────────────────────────────────────── */
  const handleDoneConfirm = (actualEndDate) => {
    if (!doneModal) return;
    const { taskId, fromKey, toKey, newIndex } = doneModal;
    commitMove(fromKey, toKey, taskId, newIndex, {
      progress: 100,
      actualEndDate,
    });
    setDoneModal(null);
  };

  /* ─────────────────────────────────────────────
   * Add task — lands in the isDefault column
   * ───────────────────────────────────────────── */
  const handleAddTask = (task) => {
    const defaultKey = columns.find((c) => c.isDefault)?.key ?? columns[0].key;
    setTasks((prev) => ({
      ...prev,
      [defaultKey]: [...(prev[defaultKey] ?? []), task],
    }));
    setShowAddTask(false);
    setRenderKey((k) => k + 1);
  };

  /* ─────────────────────────────────────────────
   * Add column
   * ───────────────────────────────────────────── */
  const handleAddColumn = (col) => {
    setColumns((prev) => [...prev, col]);
    setTasks((prev) => ({ ...prev, [col.key]: [] }));
    setShowAddColumn(false);
  };

  /* ─────────────────────────────────────────────
   * Derived values for header
   * ───────────────────────────────────────────── */
  const totalTasks = Object.values(tasks).flat().length;
  const doneTask = doneModal
    ? tasks[doneModal.fromKey]?.find((t) => t.id === doneModal.taskId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalTasks} task{totalTasks !== 1 ? "s" : ""} across{" "}
            {columns.length} columns
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

      {/* ── Kanban Board ── */}
      <KanbanBoard
        columns={columns}
        tasks={tasks}
        renderKey={renderKey}
        onDragEnd={handleDragEnd}
        onCardClick={handleCardClick}
      />

      {/* ── Task Detail Modal ── */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onUpdate={handleUpdateTask}
          onClose={() => setDetailTask(null)}
        />
      )}

      {/* ── Done Modal — SRS §3.3 ── */}
      {doneModal && doneTask && (
        <DoneModal
          taskName={doneTask.name}
          onConfirm={handleDoneConfirm}
          onCancel={() => setDoneModal(null)}
        />
      )}

      {/* ── Add Task Modal ── */}
      {showAddTask && (
        <AddTaskModal
          onAdd={handleAddTask}
          onClose={() => setShowAddTask(false)}
        />
      )}

      {/* ── Add Column Modal ── */}
      {showAddColumn && (
        <AddColumnModal
          onAdd={handleAddColumn}
          onClose={() => setShowAddColumn(false)}
        />
      )}
    </div>
  );
}
