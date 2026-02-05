import React, { useEffect, useState } from "react";
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
    setChecklistEntries(res.data);
  };
const updateSessionStatus = async (newStatus) => {
  try {
    const res = await authAxios.patch(`/checklist-sessions/${session.id}`, {
      status: newStatus,
    });
    setSession(res.data); // Update UI
  } catch (err) {
    console.error("❌ Failed to update session status:", err);
  }
};

  useEffect(() => {
    const initializeChecklist = async () => {
      console.log("🚀 Initializing checklist for clientId:", clientId);
      setLoading(true);
      try {
        // 1. Get latest consultation
        const consultRes = await authAxios.get(`/clients/${clientId}/consultations`);
        const consultations = consultRes.data;
        if (!consultations.length) {
          setError("❌ No consultations found for this client.");
          setLoading(false);
          return;
        }
        const latest = consultations[0];
        setConsultationId(latest.id);

        // 2. Try to find existing checklist session
        const res = await authAxios.get(`/checklist-sessions/by-consultation/${latest.id}`);
        let sessionData = res.data.find((s) => s.status === "pending");

        // 3. If no pending session, create one
        if (!sessionData) {
          const createRes = await authAxios.post("/checklist-sessions", {
            consultation_id: latest.id,
            label: label || "New Checklist",
            status: "pending",
          });
          sessionData = createRes.data;
        }

        setSession(sessionData);

        // 4. Load consultation entries
        const entriesRes = await authAxios.get(`/consultations/${latest.id}/entries`);
        setEntries(entriesRes.data);

        // 5. Load checklist entries
        await refreshChecklistEntries(sessionData.id);
      } catch (err) {
        console.error("❌ Error initializing checklist:", err);
        setError("Failed to load checklist");
      } finally {
        setLoading(false);
      }
    };

    if (clientId && authAxios) {
      initializeChecklist();
    }
  }, [clientId, label, authAxios]);

  if (loading) return <p>Creating checklist session...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!session) return null;

  return (
    <div className="border rounded-xl p-4 bg-blue-50">
      <h3 className="font-bold text-lg mb-2">✅ Checklist Session</h3>

      <div className="text-sm text-gray-700 mb-4">
        <p><strong>ID:</strong> {session.id}</p>

        <p><strong>Label:</strong> {session.label}</p>
        <p><strong>Created At:</strong> {new Date(session.created_at).toLocaleString()}</p>
      </div>

      {entries.map((entry) => {
        const checklist = checklistEntries.find(
          (ce) => ce.consultation_entry_id === entry.id
        );
        const isCompleted = checklist?.completed || false;
        const isUpdating = updatingEntryId === entry.id;

        return (
          <div
            key={entry.id}
            className={`p-3 border rounded mb-3 bg-white shadow-sm flex justify-between items-start ${
              isCompleted ? "opacity-70" : ""
            }`}
          >
            <div className="flex-1 pr-4">
              <p className="font-medium">{entry.section_name}: {entry.item_title}</p>
              <p className="text-sm text-gray-600 italic">Intensity: {entry.intensity_label}</p>

        {isCompleted && checklist?.completed_by?.profile && (
  <p className="text-xs mt-1 text-green-700">
    ✅ Checked by{" "}
    {checklist.completed_by.profile.first_name}{" "}
    {checklist.completed_by.profile.last_name}{" "}
    ({checklist.completed_by.role})
  </p>
)}

            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isCompleted}
                disabled={isUpdating}
                onChange={async (e) => {
                  const completed = e.target.checked;
                  setUpdatingEntryId(entry.id);

                  try {
                    if (checklist) {
                      await authAxios.patch(`/checklist-entries/${checklist.id}`, {
                        completed,
                      });
                    } else {
                      await authAxios.post("/checklist-entries", {
                        checklist_session_id: session.id,
                        consultation_entry_id: entry.id,
                        completed: true,
                      });
                    }

                    await refreshChecklistEntries(session.id);
                  } catch (err) {
                    console.error("❌ Checklist entry update failed", err);
                  } finally {
                    setUpdatingEntryId(null);
                  }
                }}
              />
            </div>
            
          </div>
        );
      })}
      <div className="flex items-center gap-2">
  <label className="font-semibold">Status:</label>
  <select
    value={session.status}
    onChange={(e) => updateSessionStatus(e.target.value)}
    className="px-2 py-1 rounded border bg-white shadow-sm text-sm"
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
