import { useState, useEffect } from "react";

const FIXED_GROUPS = [
  { key: "dev", label: "Development", icon: "⚙️" },
  { key: "qa", label: "Quality Assurance", icon: "🧪" },
  { key: "pm", label: "Project Management", icon: "📋" },
];

export default function PhasesPage() {
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState(null);
  const [newPhaseLabel, setNewPhaseLabel] = useState("");
  const [errMessage, setErrMessage] = useState("");
  const [popUpError, setPopUpError] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchPhases = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/phases");
      if (!response.ok) throw new Error("Failed to fetch phases");
      const data = await response.json();
      setPhases(data);
    } catch (error) {
      console.error("Error fetching phases:", error);
    } finally {
      setLoading(false);
      setTimeout(() => setFadeIn(true), 50);
    }
  };

  const handleAddPhase = async (group) => {
    const label = newPhaseLabel.trim();
    if (!label) return;
    try {
      const response = await fetch("http://localhost:5000/api/phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, grouping: group, sortOrder: 0 }),
      });
      if (!response.ok) throw new Error("Failed to add phase");
      const created = await response.json();
      setPhases((prev) => [...prev, created]);
      setNewPhaseLabel("");
      setAddingTo(null);
    } catch (error) {
      console.error("Error adding phase:", error);
    }
  };

  const handleDeletePhase = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/phases/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete phase");
      setPhases((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting phase:", error);
      setErrMessage("Failed to delete phase. It may be in use by existing tasks.");
      setPopUpError(true);
    }
  };

  const groupedPhases = FIXED_GROUPS.reduce((acc, group) => {
    acc[group.key] = phases.filter((p) => p.grouping === group.key);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Loading phases</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 pb-10"
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Page Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
          Workflow Configuration
        </p>
        <h1 className="text-2xl font-black text-slate-800 leading-none">Phases</h1>
      </div>

      {/* Groups */}
      {FIXED_GROUPS.map(({ key, label, icon }) => (
        <div
          key={key}
          className="rounded-xl overflow-hidden bg-white"
          style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          {/* Section Header — matches Analytics SectionCard */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ background: "linear-gradient(90deg, #0f172a, #1e3a5f)" }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-white">
                {label}
              </span>
              <span
                className="text-[10px] font-bold rounded-full px-2 py-0.5 ml-1"
                style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.55)" }}
              >
                {groupedPhases[key].length}
              </span>
            </div>
            <button
              onClick={() => { setAddingTo(key); setNewPhaseLabel(""); }}
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >
              + Add Phase
            </button>
          </div>

          {/* Cards area */}
          <div className="p-5">
            {groupedPhases[key].length === 0 && addingTo !== key ? (
              <div
                className="flex items-center justify-center h-24 w-full rounded-xl text-slate-400 text-sm"
                style={{ border: "2px dashed #e2e8f0" }}
              >
                No phases yet — add one to get started
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {groupedPhases[key].map((phase, i) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    onDelete={handleDeletePhase}
                    index={i}
                  />
                ))}

                {/* Inline Add Card */}
                {addingTo === key && (
                  <div
                    className="w-44 rounded-xl p-4 flex flex-col gap-3"
                    style={{
                      minHeight: 120,
                      border: "2px dashed #cbd5e1",
                      background: "#f8fafc",
                    }}
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder="Phase name..."
                      value={newPhaseLabel}
                      onChange={(e) => setNewPhaseLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddPhase(key);
                        if (e.key === "Escape") setAddingTo(null);
                      }}
                      className="w-full text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      style={{ border: "1px solid #e2e8f0", background: "#fff", color: "#1e293b" }}
                    />
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleAddPhase(key)}
                        className="flex-1 text-[10px] font-bold uppercase tracking-widest rounded-lg py-1.5 transition-all"
                        style={{ background: "linear-gradient(90deg,#1e40af,#3b82f6)", color: "#fff" }}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingTo(null)}
                        className="flex-1 text-[10px] font-bold uppercase tracking-widest rounded-lg py-1.5 transition-all"
                        style={{ background: "#f1f5f9", color: "#64748b" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Error Modal */}
      {popUpError && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 w-80"
            style={{
              background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
              border: "1px solid #ef444430",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Error</p>
            <p className="text-white font-semibold text-sm mb-4">{errMessage}</p>
            <button
              onClick={() => setPopUpError(false)}
              className="w-full text-[10px] font-bold uppercase tracking-widest rounded-lg py-2 transition-all"
              style={{ background: "linear-gradient(90deg,#b91c1c,#ef4444)", color: "#fff" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseCard({ phase, onDelete }) {
  return (
    <div
      className="relative w-44 rounded-xl p-4 flex flex-col bg-white"
      style={{
        minHeight: 120,
        border: "1px solid #e2e8f0",
        borderTop: "3px solid #1e40af",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Delete button */}
      <button
        onClick={() => onDelete(phase.id)}
        className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full transition-all text-[10px]"
        style={{ background: "#f1f5f9", color: "#94a3b8" }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "#fee2e2";
          e.currentTarget.style.color = "#ef4444";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "#f1f5f9";
          e.currentTarget.style.color = "#94a3b8";
        }}
        title="Delete phase"
      >
        ✕
      </button>

      {/* Label */}
      <span className="text-sm font-semibold text-slate-700 leading-snug pr-5 mt-1">
        {phase.label}
      </span>

      {/* Badges */}
      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        {phase.isDefault === 1 && (
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: "#eff6ff", color: "#1d4ed8" }}
          >
            Default
          </span>
        )}
        {phase.isFinal === 1 && (
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: "#ecfdf5", color: "#059669" }}
          >
            Final
          </span>
        )}
      </div>
    </div>
  );
}