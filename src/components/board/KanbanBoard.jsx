import { useEffect, useRef } from "react";
import Sortable from "sortablejs";
import KanbanColumn from "./KanbanColumn";

/**
 * KanbanBoard
 * Owns the SortableJS lifecycle and renders all columns.
 * All drag-and-drop logic lives here — child components stay pure.
 *
 * Props:
 *   columns     — array of column objects
 *   tasks       — { [colKey]: task[] }
 *   renderKey   — incrementing int; changing it forces Sortable re-init
 *   onDragEnd   — fn(fromKey, toKey, taskId, newIndex)
 *   onCardClick — fn(task) passed through to TaskCard
 */
export default function KanbanBoard({
  columns,
  tasks,
  renderKey,
  onDragEnd,
  onCardClick,
}) {
  const colRefs = useRef({});
  const sortablesRef = useRef({});

  useEffect(() => {
    columns.forEach(({ key }) => {
      const el = colRefs.current[key];
      if (!el || sortablesRef.current[key]) return;

      sortablesRef.current[key] = Sortable.create(el, {
        group: "kanban",
        animation: 150,
        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen",
        onEnd(evt) {
          const { from, to, oldIndex, newIndex } = evt;
          const fromKey = from.dataset.col;
          const toKey = to.dataset.col;
          const taskId = evt.item.dataset.id;

          // Revert DOM — React state is the source of truth
          if (fromKey === toKey) {
            from.insertBefore(evt.item, from.children[oldIndex] || null);
          } else {
            to.removeChild(evt.item);
            from.insertBefore(evt.item, from.children[oldIndex] || null);
          }

          onDragEnd(fromKey, toKey, taskId, newIndex);
        },
      });
    });

    return () => {
      Object.values(sortablesRef.current).forEach((s) => s.destroy());
      sortablesRef.current = {};
    };
  }, [renderKey, columns, onDragEnd]);

  return (
    <>
      <style>{`
        .sortable-ghost  { opacity: 0.3; }
        .sortable-chosen { box-shadow: 0 0 0 2px #3b82f6, 0 4px 16px rgba(59,130,246,.2); }
      `}</style>

      <div
        key={renderKey}
        className="flex items-start gap-4 overflow-x-auto pb-4"
        // className="grid grid-cols-4 gap-4 items-start bg-red-200 overflow-x-auto pb-4"
      >
        {columns.map((col) => (
          <KanbanColumn
            key={col.key}
            col={col}
            tasks={tasks[col.key] ?? []}
            colRef={(el) => (colRefs.current[col.key] = el)}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </>
  );
}
