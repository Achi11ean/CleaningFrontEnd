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
      console.log("🚀 Initializing checklist for clientId:", clientId);
      setLoading(true);
      setError(null);

      try {
        // 1) latest consultation
        const consultRes = await authAxios.get(`/clients/${clientId}/consultations`);
        const consultations = Array.isArray(consultRes.data) ? consultRes.data : [];

        if (!consultations.length) {
          setError("❌ No consultations found for this client.");
          return;
        }

        const latest = consultations[0];
        setConsultationId(latest.id);

        // 2) get sessions by consultation, pick pending
        const sessionsRes = await authAxios.get(
          `/checklist-sessions/by-consultation/${latest.id}`
        );

        const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
        let sessionData = sessions.find((s) => s.status === "pending");

        // 3) create if none pending
        if (!sessionData) {
          const createRes = await authAxios.post("/checklist-sessions", {
            consultation_id: latest.id,
            label: label || "New Checklist",
            status: "pending",
          });
          sessionData = createRes.data;
        }

        setSession(sessionData);

        // 4) load consultation entries
        const entriesRes = await authAxios.get(`/consultations/${latest.id}/entries`);
        setEntries(Array.isArray(entriesRes.data) ? entriesRes.data : []);

        // 5) load checklist entries
        await refreshChecklistEntries(sessionData.id);
      } catch (err) {
        console.error("❌ Error initializing checklist:", err);
        setError("Failed to load checklist");
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


  if (loading) return <p>Creating checklist session...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!session) return null;

// ✅ ALWAYS ABOVE RETURNS

// ⬇️ NOW conditional returns are safe
if (loading) return <p>Creating checklist session...</p>;
if (error) return <p className="text-red-600">{error}</p>;
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
