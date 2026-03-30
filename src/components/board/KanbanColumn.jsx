import TaskCard from "./TaskCard";

function colAccent(col) {
  if (col.isFinal) return "border-t-emerald-400";
  const l = col.label.toLowerCase();
  if (l.includes("active") || l.includes("progress")) return "border-t-amber-400";
  if (l.includes("review") || l.includes("verification")) return "border-t-purple-400";
  if (l.includes("blocked") || l.includes("failed")) return "border-t-red-400";
  return "border-t-gray-300";
}

/**
 * KanbanColumn
 * Width is w-60 (240px) — slightly narrower than before to show more columns
 * on screen before the user needs to scroll.
 */
export default function KanbanColumn({ col, tasks, colRef, onCardClick }) {
  return (
    <div
      className={`shrink-0 w-60 bg-white rounded-2xl shadow-sm border-t-4 ${colAccent(col)}`}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 truncate pr-2">
          {col.label}
        </span>
        <span className="shrink-0 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={colRef}
        data-col={col.id}
        className="px-2 pb-3 space-y-2 min-h-32"
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}
