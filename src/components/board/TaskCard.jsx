import { useState, useEffect } from "react";
import {
  formatShortDate,
  calcProgressFromSubtasks,
} from "../../utils/kanbanUtils";
import { AlertTriangle } from "lucide-react";

// Default severity colors (fallback if no color from DB)
const DEFAULT_SEVERITY_COLORS = {
  "1 - Critical": "#ef4444",
  "2 - High": "#f97316",
  "3 - Medium": "#f59e0b",
  "4 - Low": "#10b981",
  "5 - Cosmetic": "#6b7280",
};

function getSeverityColor(severityColor, severityLabel) {
  if (severityColor) return severityColor;
  if (severityLabel && DEFAULT_SEVERITY_COLORS[severityLabel])
    return DEFAULT_SEVERITY_COLORS[severityLabel];
  if (severityLabel) {
    const label = severityLabel.toLowerCase();
    if (label.includes("critical")) return "#ef4444";
    if (label.includes("high")) return "#f97316";
    if (label.includes("medium")) return "#f59e0b";
    if (label.includes("low")) return "#10b981";
  }
  return "#94a3b8";
}

export default function TaskCard({ task, onCardClick }) {
  const shortDate = formatShortDate(task.targetDate);
  const subtasks = task.subtasks ?? [];
  const subtaskTotal = subtasks.length;
  const subtaskDone = subtasks.filter((s) => s.isDone || s.done).length;
  const progress = calcProgressFromSubtasks(subtasks) ?? task.progress ?? 0;

  const severityColor = getSeverityColor(
    task.severityColor,
    task.severityLabel,
  );

  const displaySeverityLabel =
    task.severityLabel?.replace(/^\d+ - /, "") ?? task.severityLabel;

  const isQAPhase = task.phaseGrouping === "qa";
  const activeAssignee = isQAPhase ? task.qaAssigneeName : task.assigneeName;
  const missingQA = isQAPhase && !task.qaAssigneeId;

  // ── Optimistic local status state ─────────────────────────────────────────
  // Initialised from props; updates immediately when the modal saves,
  // and also stays in sync if the parent ever pushes a fresh task object.
  const [localStatus, setLocalStatus] = useState({
    label: task.statusLabel ?? null,
    color: task.statusColor ?? "#94a3b8",
  });

  // Keep local state in sync whenever the parent provides a new task prop
  // (e.g. after a background refetch or board-level state update).
  useEffect(() => {
    setLocalStatus({
      label: task.statusLabel ?? null,
      color: task.statusColor ?? "#94a3b8",
    });
  }, [task.statusLabel, task.statusColor]);

  const statusColor = localStatus.color;

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
      className="cursor-grab active:cursor-grabbing select-none"
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderLeft: `3px solid ${severityColor}`,
        borderRadius: 12,
        padding: "12px 14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.15s ease, border-color 0.15s ease",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(30,64,175,0.1)";
        e.currentTarget.style.borderColor = "#bfdbfe";
        e.currentTarget.style.borderLeftColor = severityColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.borderLeftColor = severityColor;
      }}
    >
      {/* Top row: severity dot + label + status badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {task.severityLabel ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: severityColor,
                flexShrink: 0,
                boxShadow: `0 0 0 1px ${severityColor}20`,
              }}
            />
            <span style={{ color: severityColor }}>{displaySeverityLabel}</span>
          </div>
        ) : (
          <span />
        )}

        {/* Status badge — updates immediately via localStatus */}
        {localStatus.label && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: statusColor,
              background: `${statusColor}18`,
              border: `1px solid ${statusColor}30`,
              borderRadius: 999,
              padding: "2px 7px",
              whiteSpace: "nowrap",
              transition:
                "color 0.2s ease, background 0.2s ease, border-color 0.2s ease",
            }}
          >
            {localStatus.label}
          </span>
        )}
      </div>

      {/* Subtask count */}
      {subtaskTotal > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>
            {subtaskDone}/{subtaskTotal}
          </span>
        </div>
      )}

      {/* Title */}
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#1e293b",
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        {task.title}
      </p>

      {/* No QA warning */}
      {missingQA && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#fffbeb",
            border: "1px solid #f59e0b30",
            color: "#f59e0b",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.04em",
            borderRadius: 8,
            padding: "4px 8px",
          }}
        >
          <AlertTriangle size={10} style={{ flexShrink: 0 }} />
          No QA assigned
        </div>
      )}

      {/* Progress bar */}
      {progress > 0 && (
        <div
          style={{
            width: "100%",
            background: "#f1f5f9",
            borderRadius: 999,
            height: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 999,
              width: `${progress}%`,
              background:
                progress === 100
                  ? "linear-gradient(90deg, #059669, #10b981)"
                  : "linear-gradient(90deg, #1e40af, #3b82f6)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {/* Subtask strip */}
      {subtaskTotal > 0 && (
        <div style={{ display: "flex", gap: 3 }}>
          {subtasks.map((s) => (
            <div
              key={s.id}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 999,
                background: s.isDone || s.done ? "#10b981" : "#e2e8f0",
                transition: "background 0.2s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* Footer: assignee + date */}
      {/* <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width:          20,
              height:         20,
              borderRadius:   "50%",
              background:     "linear-gradient(135deg, #1e3a5f, #3b82f6)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       9,
              fontWeight:     700,
              color:          "#fff",
              flexShrink:     0,
            }}
          >
            {activeAssignee?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
            {activeAssignee ?? "Unassigned"}
          </span>
        </div>
        {shortDate && (
          <span
            style={{
              fontSize:      10,
              fontWeight:    700,
              color:         "#94a3b8",
              letterSpacing: "0.04em",
            }}
          >
            {shortDate}
          </span>
        )}
      </div> */}

      {/* Footer: assignee + date (+ variance for completed tasks) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1e3a5f, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {activeAssignee?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
            {activeAssignee ?? "Unassigned"}
          </span>
        </div>

        {/* Right side: date stacked above variance */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 3,
          }}
        >
          {shortDate && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.04em",
              }}
            >
              {shortDate}
            </span>
          )}
          {task.variance != null &&
            (() => {
              const v = task.variance;
              const late = v > 0;
              const color = v === 0 ? "#10b981" : late ? "#ef4444" : "#10b981";
              const bg = v === 0 ? "#dcfce7" : late ? "#fee2e2" : "#dcfce7";
              const label = v === 0 ? "On time" : late ? `+${v}d` : `${v}d`;
              return (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color,
                    background: bg,
                    border: `1px solid ${color}40`,
                    borderRadius: 999,
                    padding: "1px 6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              );
            })()}
        </div>
      </div>
    </div>
  );
}
