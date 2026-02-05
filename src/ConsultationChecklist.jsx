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

  if (loading) return <p>Creating checklist session...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!session) return null;

  return (
    <div className="border rounded-xl p-4 bg-blue-50">
      <h3 className="font-bold text-lg mb-2">✅ Checklist Session</h3>

      <div className="text-sm text-gray-700 mb-4">
        <p>
          <strong>ID:</strong> {session.id}
        </p>
        <p>
          <strong>Label:</strong> {session.label}
        </p>
        <p>
          <strong>Created At:</strong>{" "}
          {session.created_at ? new Date(session.created_at).toLocaleString() : "-"}
        </p>
      </div>

      {entries.map((entry) => {
        const checklist = checklistByConsultEntryId.get(entry.id); // ✅ correct
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
            className={`p-3 border rounded mb-3 bg-white shadow-sm flex justify-between items-start ${
              isCompleted ? "opacity-70" : ""
            }`}
          >
            <div className="flex-1 pr-4">
              <p className="font-medium">
                {entry.section_name}: {entry.item_title}
              </p>
              <p className="text-sm text-gray-600 italic">
                Intensity: {entry.intensity_label}
              </p>

              {isCompleted && completedByName && (
                <p className="text-xs mt-1 text-green-700">
                  ✅ Checked by {completedByName} ({checklist?.completed_by?.role})
                </p>
              )}

              {isCompleted && checklist?.completed_at && (
                <p className="text-[11px] mt-0.5 text-gray-500">
                  {new Date(checklist.completed_at).toLocaleString()}
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

                  console.log("🟦 Checkbox changed", {
                    entryId: entry.id,
                    completed,
                    hasChecklistEntry: !!checklist,
                    checklistId: checklist?.id,
                    sessionId: session.id,
                    role,
                  });

                  setUpdatingEntryId(entry.id);

                  try {
                    if (checklist) {
                      console.log("🟡 PATCH checklist entry", {
                        checklistEntryId: checklist.id,
                        completed,
                      });

                      const res = await authAxios.patch(
                        `/checklist-entries/${checklist.id}`,
                        { completed }
                      );

                      console.log("✅ PATCH success", res.data);
                    } else {
                      console.log("🟢 POST new checklist entry", {
                        checklist_session_id: session.id,
                        consultation_entry_id: entry.id,
                        completed: true,
                      });

                      const res = await authAxios.post("/checklist-entries", {
                        checklist_session_id: session.id,
                        consultation_entry_id: entry.id,
                        completed: true,
                      });

                      console.log("✅ POST success", res.data);
                    }

                    console.log("🔄 Refreshing checklist entries…");
                    await refreshChecklistEntries(session.id);
                    console.log("✅ Checklist refreshed");
                  } catch (err) {
                    console.error("❌ Checklist entry update failed", {
                      error: err,
                      response: err.response?.data,
                    });
                  } finally {
                    setUpdatingEntryId(null);
                    console.log("🟣 Update cycle finished for entry", entry.id);
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
