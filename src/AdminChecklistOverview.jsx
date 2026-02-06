import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function AdminChecklistOverview() {
  const { axios, role } = useAuthorizedAxios();

  const [sessions, setSessions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [entriesBySession, setEntriesBySession] = useState({});
  const [loading, setLoading] = useState(true);
const [staffList, setStaffList] = useState([]);
const [adminList, setAdminList] = useState([]);

  const canManage = role === "admin" || role === "manager";

  useEffect(() => {
    if (!axios || !canManage) return;

    const load = async () => {
      setLoading(true);
      const res = await axios.get("/checklist-sessions/all");
      setSessions(res.data || []);
      setLoading(false);
    };

    load();
  }, [axios, canManage]);
  useEffect(() => {
  if (!axios || !canManage) return;

  Promise.all([
    axios.get("/staff/all"),
    axios.get("/admin/all"),
  ]).then(([staffRes, adminRes]) => {
    setStaffList(staffRes.data || []);
    setAdminList(adminRes.data || []);
  });
}, [axios, canManage]);
const formatDisplayName = ({ profile, username }) => {
  if (profile?.first_name) {
    return `${profile.first_name} ${profile.last_name?.[0] || ""}.`;
  }

  return username || "Unknown";
};

const updateSessionStatus = async (sessionId, status) => {
  const res = await axios.patch(
    `/checklist-sessions/${sessionId}`,
    { status }
  );

  setSessions((prev) =>
    prev.map((s) =>
      s.id === sessionId ? res.data : s
    )
  );
};


  const loadEntries = async (sessionId) => {
    if (entriesBySession[sessionId]) return;

    const res = await axios.get(
      `/checklist-entries/by-session/${sessionId}`
    );

    setEntriesBySession((prev) => ({
      ...prev,
      [sessionId]: res.data || [],
    }));
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm("Delete this checklist and ALL its entries?")) return;

    await axios.delete(`/checklist-sessions/${sessionId}`);

    setSessions((prev) =>
      prev.filter((s) => s.id !== sessionId)
    );
  };

  if (!canManage) {
    return (
      <p className="text-red-600 p-6">
        You do not have permission to view this page.
      </p>
    );
  }

  if (loading) {
    return <p className="p-6">Loading checklists…</p>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold">
        📋 Checklist Sessions
      </h2>

      {sessions.length === 0 && (
        <p className="italic text-gray-500">
          No checklist sessions found.
        </p>
      )}

      <div className="space-y-4">
        {sessions.map((s) => {
          const isOpen = expandedId === s.id;
          const entries = entriesBySession[s.id] || [];

          const completedCount = entries.filter(
            (e) => e.completed
          ).length;

          return (
            <div
              key={s.id}
              className="border rounded-2xl bg-white shadow-sm"
            >
              {/* HEADER */}
              <div className="p-4 flex justify-between items-center">
                <button
                  onClick={async () => {
                    setExpandedId(isOpen ? null : s.id);
                    if (!isOpen) await loadEntries(s.id);
                  }}
                  className="text-left flex-1"
                >
                    <div className="text-sm text-gray-600">
  🏠 {s.client
    ? `${s.client.first_name} ${s.client.last_name}`
    : "Unknown Client"}
</div>

                  <div className="font-bold text-lg">
                    {s.label || "Untitled Checklist"}
                  </div>

                  <div className="text-sm text-gray-600">
                    Session #{s.id} • Consultation #{s.consultation_id}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    Status:{" "}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
  <span>
    Status:
  </span>

  <select
    className={`
      text-xs font-semibold rounded px-2 py-1 border
      ${
        s.status === "completed"
          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
          : s.status === "pending"
          ? "bg-yellow-50 text-yellow-700 border-yellow-300"
          : s.status === "archived"
          ? "bg-gray-100 text-gray-600 border-gray-300"
          : "bg-blue-50 text-blue-700 border-blue-300"
      }
    `}
    value={s.status}
    onChange={(e) =>
      updateSessionStatus(s.id, e.target.value)
    }
  >
    <option value="pending">⏳ Pending</option>
    <option value="completed">✅ Completed</option>
    <option value="archived">🗄️ Archived</option>
  </select>

  <span>• Created {new Date(s.created_at).toLocaleString()}</span>
</div>
{" "}
                    • Created{" "}
                    {new Date(s.created_at).toLocaleString()}
                  </div>

                  <div className="text-xs text-gray-500">
                    By {s.created_by?.role} #{s.created_by?.id}
                  </div>

                  {entries.length > 0 && (
                    <div className="text-xs mt-1">
                      ✅ {completedCount} / {entries.length} completed
                    </div>
                  )}
                </button>

                <button
                  onClick={() => deleteSession(s.id)}
                  className="ml-4 px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
              </div>

              {/* ENTRIES */}
              {isOpen && (
                <div className="border-t bg-gray-50 p-4 space-y-3">
                  {entries.length === 0 ? (
                    <p className="italic text-gray-500 text-sm">
                      No checklist entries yet.
                    </p>
                  ) : (
                    entries.map((e) => (
                      <div
                        key={e.id}
                        className="bg-white border rounded-lg p-3 text-sm"
                      >
                        <div className="font-semibold">
                          {e.consultation_entry?.section_name} →{" "}
                          {e.consultation_entry?.item_title}
                        </div>

                        <div className="text-gray-600">
                          Intensity:{" "}
                          {e.consultation_entry?.intensity_label} •{" "}
                          Points:{" "}
                          {e.consultation_entry?.calculated_points}
                        </div>

                        {e.consultation_entry?.notes && (
                          <div className="text-xs italic text-gray-500 mt-1">
                            {e.consultation_entry.notes}
                          </div>
                        )}

                        <div className="text-xs mt-1">
{e.completed ? (
  <div className="mt-2 space-y-1">
    <div className="text-green-700 text-xs">
      ✅ Completed
    </div>

    <select
      className="text-xs border rounded px-2 py-1 bg-white"
      value={`${e.completed_by?.role || ""}:${e.completed_by?.id || ""}`}
      onChange={async (ev) => {
        const [role, id] = ev.target.value.split(":");

        const payload =
          role === "admin"
            ? { completed_by_admin_id: Number(id) }
            : { completed_by_staff_id: Number(id) };

        const res = await axios.patch(
          `/checklist-entries/${e.id}`,
          payload
        );

        // 🔄 Refresh local entry
        setEntriesBySession((prev) => ({
          ...prev,
          [s.id]: prev[s.id].map((x) =>
            x.id === e.id ? res.data : x
          ),
        }));
      }}
    >
      <option disabled value="">
        Assign completed by…
      </option>

<optgroup label="Staff">
  {staffList.map((st) => (
    <option
      key={`staff-${st.id}`}
      value={`staff:${st.id}`}
    >
      {formatDisplayName(st)}
    </option>
  ))}
</optgroup>


<optgroup label="Admins">
  {adminList.map((a) => (
    <option
      key={`admin-${a.id}`}
      value={`admin:${a.id}`}
    >
      {formatDisplayName(a)}
    </option>
  ))}
</optgroup>


    </select>
  </div>
) : (
  <span className="text-gray-400 text-xs">
    ⏳ Not completed
  </span>
)}

                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
