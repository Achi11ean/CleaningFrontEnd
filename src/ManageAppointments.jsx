import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ManageAppointments() {
  const { axios } = useAuthorizedAxios();

  const [appointments, setAppointments] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [admins, setAdmins] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] = useState(false);

  // ─────────────────────────────
  // Load ALL appointments
  // ─────────────────────────────
  const loadAllAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/appointments");
      setAppointments(res.data);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // Initial load
  // ─────────────────────────────
  useEffect(() => {
    if (!axios) return;

    loadAllAppointments();

    axios.get("/admin/all").then(res => setAdmins(res.data));
    axios.get("/staff/all").then(res => setStaff(res.data));
  }, [axios]);

  // ─────────────────────────────
  // Delete
  // ─────────────────────────────
  const deleteAppointment = async (appt) => {
    if (!window.confirm("Delete this appointment?")) return;

    await axios.delete(
      `/clients/${appt.client_id}/appointments/${appt.id}`
    );

    loadAllAppointments();
  };

  // ─────────────────────────────
  // Save edits
  // ─────────────────────────────
  const saveEdit = async (appt) => {
    await axios.patch(
      `/clients/${appt.client_id}/appointments/${appt.id}`,
      appt
    );

    setEditingId(null);
    loadAllAppointments();
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Consultation Appointments</h2>
        <p className="text-gray-500">
          Manage all scheduled consultations across clients
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-10 text-gray-500">
          Loading appointments...
        </div>
      )}

      {/* Empty State */}
      {!loading && appointments.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          No consultations scheduled yet.
        </div>
      )}

      {/* Appointment List */}
      {appointments.map(appt => {
        const editing = editingId === appt.id;

        return (
          <div
            key={appt.id}
            className="border rounded-xl p-5 shadow-sm bg-white"
          >

            {/* Header Row */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {appt.client_name}
              </h3>

              <span className="text-sm text-gray-500">
                {new Date(appt.scheduled_for).toLocaleString()}
              </span>
            </div>

            {/* Date */}
            {editing && (
              <div className="mb-3">
                <label className="text-sm font-semibold">Date</label>
                <input
                  type="datetime-local"
                  value={appt.scheduled_for.slice(0, 16)}
                  onChange={(e) =>
                    appt.scheduled_for = e.target.value
                  }
                  className="w-full border rounded p-2"
                />
              </div>
            )}

            {/* Assignee */}
            <div className="mb-3">
              <label className="text-sm font-semibold">
                Assigned To
              </label>

              {editing ? (
                <select
                  value={`${appt.assigned_user_type || ""}-${appt.assigned_user_id || ""}`}
                  onChange={(e) => {
                    const [type, id] = e.target.value.split("-");
                    appt.assigned_user_type = type || null;
                    appt.assigned_user_id = id || null;
                  }}
                  className="w-full border rounded p-2"
                >
                  <option value="">Unassigned</option>

                  <optgroup label="Admins">
                    {admins.map(a => (
                      <option key={a.id} value={`admin-${a.id}`}>
                        {a.username}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Managers">
                    {staff
                      .filter(s => s.role === "manager")
                      .map(s => (
                        <option key={s.id} value={`staff-${s.id}`}>
                          {s.username}
                        </option>
                      ))}
                  </optgroup>
                </select>
              ) : (
                <p className="text-gray-700">
                  {appt.assigned_user_name || "Unassigned"}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="text-sm font-semibold">Notes</label>

              {editing ? (
                <textarea
                  defaultValue={appt.notes}
                  onChange={(e) => appt.notes = e.target.value}
                  className="w-full border rounded p-2"
                />
              ) : (
                <p className="text-gray-600">
                  {appt.notes || "No notes"}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={() => saveEdit(appt)}
                    className="bg-green-600 text-white px-4 py-1 rounded"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-400 text-white px-4 py-1 rounded"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditingId(appt.id)}
                    className="bg-blue-600 text-white px-4 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteAppointment(appt)}
                    className="bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
