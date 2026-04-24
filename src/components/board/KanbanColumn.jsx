import TaskCard from "./TaskCard";

export default function KanbanColumn({ col, tasks, colRef, onCardClick }) {
  return (
    <div
      className="shrink-0 w-60 rounded-xl overflow-hidden bg-white"
      style={{
        border: "1px solid #e2e8f0",
        borderTop: `3px solid ${col.color || "#1e40af"}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 truncate pr-2">
          {col.label}
        </span>
        <span className="shrink-0 text-xs bg-slate-100 text-slate-400 rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={colRef}
        data-col={col.id}
        className="px-2 pb-3 pt-2 space-y-2 min-h-32"
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}