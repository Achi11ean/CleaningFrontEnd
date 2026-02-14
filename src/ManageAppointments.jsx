import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ManageAppointments() {
  const { axios } = useAuthorizedAxios();

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [admins, setAdmins] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] = useState(false);

  // ─────────────────────────────
  // Load initial data
  // ─────────────────────────────
  useEffect(() => {
    if (!axios) return;

    axios.get("https://cleaningback.onrender.com/clients").then(res => setClients(res.data));
    axios.get("https://cleaningback.onrender.com/admin/all").then(res => setAdmins(res.data));
    axios.get("https://cleaningback.onrender.com/staff/all").then(res => setStaff(res.data));
  }, [axios]);

  // ─────────────────────────────
  // Load appointments
  // ─────────────────────────────
  const loadAppointments = async (clientId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/clients/${clientId}/appointments`);
      setAppointments(res.data);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // Delete
  // ─────────────────────────────
  const deleteAppointment = async (appt) => {
    if (!window.confirm("Delete this appointment?")) return;

    await axios.delete(`/clients/${appt.client_id}/appointments/${appt.id}`);

    loadAppointments(appt.client_id);
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
    loadAppointments(appt.client_id);
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Client Select */}
      <div>
        <label className="font-semibold block mb-2">Select Client</label>

        <select
          value={selectedClient}
          onChange={(e) => {
            setSelectedClient(e.target.value);
            loadAppointments(e.target.value);
          }}
          className="w-full border rounded p-2"
        >
          <option value="">Choose client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* Appointment List */}
      {loading && <p>Loading appointments...</p>}

      {appointments.map(appt => {
        const editing = editingId === appt.id;

        return (
          <div
            key={appt.id}
            className="border rounded-xl p-4 shadow-sm bg-white"
          >
            {/* Client Name */}
            <h3 className="font-bold text-lg mb-3">
              {appt.client_name}
            </h3>

            {/* Date */}
            <div className="mb-2">
              <label className="text-sm font-semibold">Date</label>

              {editing ? (
                <input
                  type="datetime-local"
                  value={appt.scheduled_for.slice(0, 16)}
                  onChange={(e) =>
                    appt.scheduled_for = e.target.value
                  }
                  className="w-full border rounded p-2"
                />
              ) : (
                <p>{new Date(appt.scheduled_for).toLocaleString()}</p>
              )}
            </div>

            {/* Assignee */}
            <div className="mb-2">
              <label className="text-sm font-semibold">Assigned To</label>

              {editing ? (
                <select
                  value={`${appt.assigned_user_type}-${appt.assigned_user_id}`}
                  onChange={(e) => {
                    const [type, id] = e.target.value.split("-");
                    appt.assigned_user_type = type;
                    appt.assigned_user_id = id;
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
                <p>{appt.assigned_user_name || "Unassigned"}</p>
              )}
            </div>

            {/* Notes */}
            <div className="mb-3">
              <label className="text-sm font-semibold">Notes</label>

              {editing ? (
                <textarea
                  defaultValue={appt.notes}
                  onChange={(e) => appt.notes = e.target.value}
                  className="w-full border rounded p-2"
                />
              ) : (
                <p>{appt.notes || "-"}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={() => saveEdit(appt)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-400 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditingId(appt.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteAppointment(appt)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
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
