import {
  SEVERITY_COLORS,
  formatShortDate,
  calcProgressFromSubtasks,
} from "../../utils/kanbanUtils";

/**
 * TaskCard
 * Works with task objects returned directly from the Express API.
 * DB field names: title, severityLabel, assigneeName, targetDate, progress, subtasks
 */
export default function TaskCard({ task, onCardClick }) {
  const severityKey =
    task.severityLabel?.split(" - ")[0] ?? task.severityLabel ?? "";
  const sc =
    SEVERITY_COLORS[severityKey] ??
    SEVERITY_COLORS[task.severityLabel] ??
    SEVERITY_COLORS.Low;

  const shortDate = formatShortDate(task.targetDate);
  const subtasks = task.subtasks ?? [];
  const subtaskTotal = subtasks.length;
  const subtaskDone = subtasks.filter((s) => s.isDone || s.done).length;
  const progress = calcProgressFromSubtasks(subtasks) ?? task.progress ?? 0;

  // Click vs drag: only fire click on a short press (< 200ms)
  let mouseDownTime = 0;
  const handleMouseDown = () => {
    mouseDownTime = Date.now();
  };
  const handleMouseUp = () => {
    if (Date.now() - mouseDownTime < 200) onCardClick(task);
  };

  return (
    <div
      data-id={task.id}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="bg-white p-3 rounded-xl shadow text-sm text-gray-700 cursor-grab active:cursor-grabbing hover:shadow-md transition select-none space-y-2 border border-gray-100 hover:border-blue-200"
    >
      {/* Top row: severity badge + subtask count */}
      <div className="flex items-center justify-between">
        {task.severityLabel ? (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: sc.text, background: sc.bg }}
          >
            {task.severityLabel}
          </span>
        ) : (
          <span />
        )}
        {subtaskTotal > 0 && (
          <span className="text-xs text-gray-400">
            {subtaskDone}/{subtaskTotal}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="font-medium text-gray-800 leading-snug">{task.title}</p>

      {/* Progress bar */}
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

      {/* Subtask strip */}
      {subtaskTotal > 0 && (
        <div className="flex gap-0.5">
          {subtasks.map((s) => (
            <div
              key={s.id}
              className="flex-1 h-1 rounded-full transition-colors duration-200"
              style={{ background: s.isDone || s.done ? "#10b981" : "#e5e7eb" }}
            />
          ))}
        </div>
      )}

      {/* Footer: assignee + target date */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-[10px]">
            {task.assigneeName?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
          {task.assigneeName ?? "Unassigned"}
        </span>
        {shortDate && <span>{shortDate}</span>}
      </div>
    </div>
  );
}
