import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function CreateAppointment({ onCreated }) {
  const { axios } = useAuthorizedAxios();

  const [clients, setClients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [staff, setStaff] = useState([]);

  const [clientId, setClientId] = useState("");
  const [assignedId, setAssignedId] = useState("");
  const [assignedType, setAssignedType] = useState("");
const [clientSearch, setClientSearch] = useState("");
const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [scheduledFor, setScheduledFor] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  // ─────────────────────────────
  // Load data
  // ─────────────────────────────
  useEffect(() => {
    if (!axios) return;

    axios.get("https://cleaningback.onrender.com/clients").then(res => setClients(res.data));
    axios.get("https://cleaningback.onrender.com/admin/all").then(res => setAdmins(res.data));
    axios.get("https://cleaningback.onrender.com/staff/all").then(res => setStaff(res.data));
  }, [axios]);

  // ─────────────────────────────
  // Submit
  // ─────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientId || !scheduledFor) {
      alert("Client and date/time required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        scheduled_for: scheduledFor,
        notes,
      };

      if (assignedId && assignedType) {
        payload.assigned_user_id = assignedId;
        payload.assigned_user_type = assignedType;
      }

      await axios.post(`https://cleaningback.onrender.com/clients/${clientId}/appointments`, payload);

      alert("Appointment created!");

      setClientId("");
      setAssignedId("");
      setAssignedType("");
      setScheduledFor("");
      setNotes("");

      onCreated?.();

    } catch (err) {
      alert(err.response?.data?.error || "Failed to create appointment");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((c) => {
  const search = clientSearch.toLowerCase();

  return (
    c.first_name.toLowerCase().includes(search) ||
    c.last_name.toLowerCase().includes(search) ||
    c.phone?.toLowerCase().includes(search) ||
    c.email?.toLowerCase().includes(search)
  );
});

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Schedule Consultation
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Client */}
       <div className="relative">
  <label className="block font-semibold mb-1">Client</label>

  {/* Input */}
  <input
    type="text"
    value={clientSearch}
    onChange={(e) => {
      setClientSearch(e.target.value);
      setShowClientDropdown(true);
    }}
    onFocus={() => setShowClientDropdown(true)}
    placeholder="Search client by name, phone, or email..."
    className="w-full border rounded p-2"
    required={!clientId}
  />

  {/* Dropdown */}
  {showClientDropdown && (
    <div className="absolute z-50 w-full bg-white border rounded shadow max-h-60 overflow-y-auto">
      {filteredClients.length === 0 ? (
        <div className="p-3 text-gray-500">No clients found</div>
      ) : (
        filteredClients.map((c) => (
          <div
            key={c.id}
            onClick={() => {
              setClientId(c.id);
              setClientSearch(`${c.first_name} ${c.last_name}`);
              setShowClientDropdown(false);
            }}
            className="p-3 cursor-pointer hover:bg-blue-50 border-b"
          >
            <div className="font-semibold">
              {c.first_name} {c.last_name}
            </div>
            <div className="text-sm text-gray-500">
              {c.phone} • {c.email}
            </div>
          </div>
        ))
      )}
    </div>
  )}
</div>


        {/* Date Time */}
        <div>
          <label className="block font-semibold mb-1">Date & Time</label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="block font-semibold mb-1">
            Assign To (Optional)
          </label>

          <select
            value={`${assignedType}-${assignedId}`}
            onChange={(e) => {
              const [type, id] = e.target.value.split("-");
              setAssignedType(type);
              setAssignedId(id);
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
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded p-2"
            rows={3}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
        >
          {loading ? "Scheduling..." : "Schedule Appointment"}
        </button>

      </form>
    </div>
  );
}
