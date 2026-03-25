import {
  SEVERITY_COLORS,
  formatShortDate,
  calcProgressFromSubtasks,
} from "../../utils/kanbanUtils";

/**
 * TaskCard
 * A single draggable card rendered inside a KanbanColumn.
 *
 * Two interaction modes are carefully separated here:
 *   - Dragging   → handled by SortableJS via data-id on the root div
 *   - Clicking   → calls onCardClick(task) to open TaskDetailModal
 *
 * The click handler uses a mousedown/mouseup delta to distinguish
 * a click from a drag so the modal does not open mid-drag.
 *
 * Props:
 *   task        — full task object including subtasks array
 *   onCardClick — fn(task) called when the card is clicked (not dragged)
 */
export default function TaskCard({ task, onCardClick }) {
  const sc = SEVERITY_COLORS[task.severity] ?? SEVERITY_COLORS.Low;
  const shortDate = formatShortDate(task.targetDate);

  const subtasks = task.subtasks ?? [];
  const subtaskTotal = subtasks.length;
  const subtaskDone = subtasks.filter((s) => s.done).length;
  const progress = calcProgressFromSubtasks(subtasks) ?? task.progress ?? 0;

  /* ── Click vs drag detection ── */
  let mouseDownTime = 0;
  const handleMouseDown = () => {
    mouseDownTime = Date.now();
  };
  const handleMouseUp = () => {
    const elapsed = Date.now() - mouseDownTime;
    if (elapsed < 200) onCardClick(task); // short press = click, not drag
  };

  return (
    <div
      data-id={task.id}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="bg-white p-3 rounded-xl shadow text-sm text-gray-700 cursor-grab active:cursor-grabbing hover:shadow-md transition select-none space-y-2 border border-gray-100 hover:border-blue-200"
    >
      {/* Top row: severity badge */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ color: sc.text, background: sc.bg }}
        >
          {task.severity}
        </span>
        {/* Subtask count badge — only shown when subtasks exist */}
        {subtaskTotal > 0 && (
          <span className="text-xs text-gray-400">
            {subtaskDone}/{subtaskTotal}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="font-medium text-gray-800 leading-snug">{task.name}</p>

      {/* Progress bar — shown when progress > 0 */}
      {progress > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: progress === 100 ? "#10b981" : "#3b82f6",
            }}
          />
        </div>
      )}

      {/* Subtask mini progress strip — only shown when subtasks exist */}
      {subtaskTotal > 0 && (
        <div className="flex gap-0.5">
          {subtasks.map((s) => (
            <div
              key={s.id}
              className="flex-1 h-1 rounded-full transition-colors duration-200"
              style={{ background: s.done ? "#10b981" : "#e5e7eb" }}
            />
          ))}
        </div>
      )}

      {/* Footer: assignee avatar + target date */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-[10px]">
            {task.assignee?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
          {task.assignee ?? "Unassigned"}
        </span>
        {shortDate && <span>{shortDate}</span>}
      </div>
    </div>
  );
}
