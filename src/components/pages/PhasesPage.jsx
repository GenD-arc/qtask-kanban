import { useState, useEffect } from "react";

const FIXED_GROUPS = [
  { key: "dev", label: "Development" },
  { key: "qa", label: "Quality Assurance" },
  { key: "pm", label: "Project Management" },
];

export default function PhasesPage() {
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState(null); // which group is being added to
  const [newPhaseLabel, setNewPhaseLabel] = useState("");
  const [errMessage, setErrMessage] = useState("");
  const [popUpError, setPopUpError] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [popUpEdit, setPopUpEdit] = useState(false);

  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchPhases = async () => {
    try {
      setPopUpError(false);
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/phases");
      if (!response.ok) throw new Error("Failed to fetch phases");
      const data = await response.json();
      setPhases(data);
    } catch (error) {
      console.error("Error fetching phases:", error);
    } finally {
      setLoading(false);
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

  const handleEditPhase = async (id, updates) => {
    try {
      const response = await fetch(`http://localhost:5000/api/phases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update phase");
      const updated = await response.json();
      setPhases((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (error) {
      console.error("Error updating phase:", error);
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
      setErrMessage(
        "Failed to delete phase. It may be in use by existing tasks.",
      );
      setPopUpError(true);
    }
  };

  const groupedPhases = FIXED_GROUPS.reduce((acc, group) => {
    acc[group.key] = phases.filter((p) => p.grouping === group.key);
    return acc;
  }, {});

  const PopUpError = ({ errMessage, popUp }) => (
    <>
      {popUp && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-lg font-semibold text-red-600 mb-4 uppercase">
              Error
            </h2>
            <p className="text-sm text-gray-600 mb-6">{errMessage}</p>
            <button
              onClick={() => setPopUpError(false)}
              className="w-full text-xs bg-red-600 text-white rounded-md py-2 hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );

  const PopUpEdit = ({ editMessage, id, popUpEdit, name }) => (
    <>
      {popUpEdit && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-lg font-semibold text-red-600 mb-4 uppercase">
              Edit Phase
            </h2>
            {/* <p className="text-sm text-gray-600 mb-6">{errMessage}</p> */}
            <button
              //   onClick={() => setPopUpError(false)}
              className="w-full text-xs bg-red-600 text-white rounded-md py-2 hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Phases</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage your workflow phases by group
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Loading phases...</div>
      ) : (
        <main className="space-y-6">
          {FIXED_GROUPS.map(({ key, label }) => (
            <div
              key={key}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              {/* Group Header */}
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {label}
                </h2>
                <button
                  className="text-xs px-3 py-1 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setAddingTo(key);
                    setNewPhaseLabel("");
                  }}
                >
                  + Add Phase
                </button>
              </div>

              <div className="border-t border-gray-200 mb-4" />

              {/* Phase Cards */}
              <div className="flex flex-wrap gap-4">
                {groupedPhases[key].map((phase) => (
                  <div
                    key={phase.id}
                    className="relative px-3 py-2 h-60 w-44 bg-white rounded-2xl text-sm font-medium border-t-4 border-gray-400 text-gray-600 shadow-md flex flex-col"
                  >
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeletePhase(phase.id)}
                      className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 text-gray-400 text-xs transition-colors"
                      title="Delete phase"
                    >
                      ✕
                    </button>

                    <span className="mt-1 pr-5">{phase.label}</span>

                    {/* Badges */}
                    <div className="mt-auto flex flex-wrap gap-1">
                      {phase.isDefault === 1 && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                      {phase.isFinal === 1 && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          Final
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {groupedPhases[key].length === 0 && addingTo !== key && (
                  <div className="flex items-center justify-center h-24 w-full rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                    No phases yet — add one to get started
                  </div>
                )}

                {/* Inline Add Form */}
                {addingTo === key && (
                  <div className="px-3 py-2 h-60 w-44 bg-white rounded-2xl border-t-4 border-dashed border-gray-300 shadow-md flex flex-col gap-2">
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
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleAddPhase(key)}
                        className="flex-1 text-xs bg-gray-800 text-white rounded-md py-1 hover:bg-gray-700 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingTo(null)}
                        className="flex-1 text-xs bg-gray-100 text-gray-600 rounded-md py-1 hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </main>
      )}

      <PopUpError errMessage={errMessage} popUp={popUpError} />
    </div>
  );
}
