import TaskCard from "./TaskCard";
import { colAccentClass } from "../../utils/kanbanUtils";

/**
 * KanbanColumn
 * Renders one column of the board. The card list div is exposed via
 * colRef so the parent (KanbanBoard) can attach a SortableJS instance to it.
 *
 * Props:
 *   col         — { key, title, isFinal, isDefault }
 *   tasks       — array of task objects belonging to this column
 *   colRef      — callback ref: el => void  (passed down from KanbanBoard)
 *   onCardClick — fn(task) passed through to each TaskCard
 */
export default function KanbanColumn({ col, tasks, colRef, onCardClick }) {
  const accentClass = colAccentClass(col);

  return (
    <div
      className={`shrink-0 w-64 bg-white rounded-2xl shadow-sm border-t-4 ${accentClass}`}
      // className={`shrink-0 w-full bg-white rounded-2xl shadow-sm border-t-4 ${accentClass}`}
    >
      {/* Column header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{col.title}</span>
        <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Droppable card list — SortableJS attaches here via colRef */}
      <div
        ref={colRef}
        data-col={col.key}
        className="px-3 pb-4 space-y-2 min-h-32"
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}
