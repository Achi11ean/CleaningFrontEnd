import React, { useEffect, useMemo, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ConsultationChecklist({ clientId, label }) {
  const { axios: authAxios, role } = useAuthorizedAxios();

  const [session, setSession] = useState(null);
  const [consultationId, setConsultationId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [entries, setEntries] = useState([]);
  const [checklistEntries, setChecklistEntries] = useState([]);
const [consultations, setConsultations] = useState([]);
const [needsConsultationSelection, setNeedsConsultationSelection] = useState(false);

  const [updatingEntryId, setUpdatingEntryId] = useState(null);

  const refreshChecklistEntries = async (sessionId) => {
    const res = await authAxios.get(`/checklist-entries/by-session/${sessionId}`);
    setChecklistEntries(Array.isArray(res.data) ? res.data : []);
  };

  const updateSessionStatus = async (newStatus) => {
    try {
      const res = await authAxios.patch(`/checklist-sessions/${session.id}`, {
        status: newStatus,
      });
      setSession(res.data);
    } catch (err) {
      console.error("❌ Failed to update session status:", err);
    }
  };

  useEffect(() => {
    if (!clientId || !authAxios) return;

const initializeChecklist = async () => {
  setLoading(true);
  setError(null);

  try {
    // 1️⃣ Load ALL consultations
    const consultRes = await authAxios.get(
      `/clients/${clientId}/consultations`
    );

    const allConsultations = Array.isArray(consultRes.data)
      ? consultRes.data
      : [];

    if (!allConsultations.length) {
      setError("❌ No consultations found for this client.");
      return;
    }

    setConsultations(allConsultations);

    // 2️⃣ Look for ANY pending checklist across consultations
    for (const consult of allConsultations) {
      const sessionsRes = await authAxios.get(
        `/checklist-sessions/by-consultation/${consult.id}`
      );

      const pending = (sessionsRes.data || []).find(
        (s) => s.status === "pending"
      );

      if (pending) {
        // ✅ Found existing pending checklist
        setConsultationId(consult.id);
        setSession(pending);

        const entriesRes = await authAxios.get(
          `/consultations/${consult.id}/entries`
        );
        setEntries(Array.isArray(entriesRes.data) ? entriesRes.data : []);

        await refreshChecklistEntries(pending.id);
        return; // 🔴 IMPORTANT: stop here
      }
    }

    // 3️⃣ No pending checklist anywhere → require selection
    setNeedsConsultationSelection(true);
  } catch (err) {
    console.error(err);
    setError("Failed to initialize checklist");
  } finally {
    setLoading(false);
  }
};


    initializeChecklist();
  }, [clientId, label, authAxios]);

  // ✅ Build a fast lookup map: consultation_entry.id -> checklistEntry
  const checklistByConsultEntryId = useMemo(() => {
    const map = new Map();
    for (const ce of checklistEntries || []) {
      const id = ce?.consultation_entry?.id; // <-- backend shape
      if (id != null) map.set(id, ce);
    }
    return map;
  }, [checklistEntries]);
const entriesBySection = useMemo(() => {
  const map = new Map();

  entries.forEach((entry) => {
    if (!map.has(entry.section_name)) {
      map.set(entry.section_name, []);
    }
    map.get(entry.section_name).push(entry);
  });

  return map;
}, [entries]);




// ⬇️ NOW conditional returns are safe
if (loading) return <p>Creating checklist session...</p>;
if (error) return <p className="text-red-600">{error}</p>;
if (needsConsultationSelection && !session) {
  return (
    <div className="border rounded-xl p-4 bg-yellow-50 space-y-3">
      <h3 className="font-bold text-lg">
        📋 Select a Consultation
      </h3>

      <p className="text-sm text-gray-700">
        No active checklist exists. Choose a consultation to create one for:
      </p>

      <div className="space-y-2">
        {consultations.map((c) => (
          <button
            key={c.id}
            onClick={async () => {
              setLoading(true);

              try {
                const createRes = await authAxios.post(
                  "/checklist-sessions",
                  {
                    consultation_id: c.id,
                    label: label || "New Checklist",
                    status: "pending",
                  }
                );

                setConsultationId(c.id);
                setSession(createRes.data);

                const entriesRes = await authAxios.get(
                  `/consultations/${c.id}/entries`
                );
                setEntries(
                  Array.isArray(entriesRes.data) ? entriesRes.data : []
                );

                await refreshChecklistEntries(createRes.data.id);
                setNeedsConsultationSelection(false);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full text-left p-3 rounded-lg border bg-white hover:bg-gray-50"
          >
            <div className="font-semibold">
              Consultation #{c.id}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(c.created_at).toLocaleString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

if (!session) return null;


 return (
  <div className="border rounded-2xl p-6 bg-blue-50 space-y-6">
    {/* Header */}
    <div>
      <h3 className="font-extrabold text-xl mb-1">✅ Checklist Session</h3>

      <div className="text-sm text-gray-700">
        <p>
          <strong>ID:</strong> {session.id}
        </p>
        <p>
          <strong>Label:</strong> {session.label}
        </p>
        <p>
          <strong>Created:</strong>{" "}
          {session.created_at
            ? new Date(session.created_at).toLocaleString()
            : "-"}
        </p>
      </div>
      {consultations.find(c => c.id === consultationId)?.notes && (
  <div className="bg-white border-l-4 border-blue-500 rounded-lg p-4 text-sm text-gray-700">
    <p className="font-semibold mb-1">📝 Consultation Notes</p>
    <p className="whitespace-pre-line">
      {consultations.find(c => c.id === consultationId).notes}
    </p>
  </div>
)}

    </div>

    {/* Sections */}
    {[...entriesBySection.entries()].map(([sectionName, sectionEntries]) => (
      <div
        key={sectionName}
        className="bg-white border rounded-xl shadow-sm p-4"
      >
        {/* Section Header */}
        <h4 className="font-bold text-lg text-blue-700 mb-4">
          {sectionName}
        </h4>
{sectionEntries[0]?.section_description && (
  <p className="text-sm text-gray-600 italic mt-1 mb-3">
    {sectionEntries[0].section_description}
  </p>
)}
        {/* Section Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sectionEntries.map((entry) => {
            const checklist = checklistByConsultEntryId.get(entry.id);
            const isCompleted = !!checklist?.completed;
            const isUpdating = updatingEntryId === entry.id;

            const completedByName =
              checklist?.completed_by?.name ||
              (checklist?.completed_by?.profile
                ? `${checklist.completed_by.profile.first_name} ${checklist.completed_by.profile.last_name}`
                : null);

            return (
              <div
                key={entry.id}
                className={`p-3 border rounded-lg bg-gray-50 flex justify-between gap-3 ${
                  isCompleted ? "opacity-70" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {entry.item_title}
                  </p>

                  <p className="text-xs text-gray-600 italic">
                    Intensity: {entry.intensity_label}
                  </p>
                  {entry.multipliers?.length > 0 && (
  <div className="mt-2 space-y-1">
    {entry.multipliers.map((m) => (
      <div
        key={m.id}
        className="text-xs bg-yellow-50 border border-yellow-200 rounded px-2 py-1"
      >
        <span className="font-semibold">
          {m.label} (×{m.multiplier})
        </span>
        {m.notes && (
          <div className="text-gray-600 italic">
            {m.notes}
          </div>
        )}
      </div>
    ))}
  </div>
)}

{entry.item_notes && (
  <p className="text-xs text-gray-600 mt-1">
     {entry.item_notes}
  </p>
)}

                  {isCompleted && completedByName && (
                    <p className="text-xs mt-1 text-green-700">
                      ✅ {completedByName} ({checklist?.completed_by?.role})
                    </p>
                  )}

                  {isCompleted && checklist?.completed_at && (
                    <p className="text-[11px] text-gray-500">
                      {new Date(checklist.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <input
                  type="checkbox"
                  checked={isCompleted}
                  disabled={isUpdating}
                  onChange={async (e) => {
                    const completed = e.target.checked;
                    setUpdatingEntryId(entry.id);

                    try {
                      if (checklist) {
                        await authAxios.patch(
                          `/checklist-entries/${checklist.id}`,
                          { completed }
                        );
                      } else {
                        await authAxios.post("/checklist-entries", {
                          checklist_session_id: session.id,
                          consultation_entry_id: entry.id,
                          completed: true,
                        });
                      }

                      await refreshChecklistEntries(session.id);
                    } catch (err) {
                      console.error("❌ Checklist update failed", err);
                    } finally {
                      setUpdatingEntryId(null);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    ))}

    {/* Session Status */}
    <div className="flex items-center gap-3 pt-2">
      <label className="font-semibold">Status:</label>
      <select
        value={session.status}
        onChange={(e) => updateSessionStatus(e.target.value)}
        className="px-3 py-1.5 rounded-lg border bg-white shadow-sm text-sm"
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="canceled">Canceled</option>
      </select>
    </div>
  </div>
);

}
