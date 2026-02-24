import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import AssignCleaners from "./AssignCleaners";
export default function CreateSchedules({ defaultDate = null }) {
const { axios: authAxios, role } = useAuthorizedAxios();
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  const [form, setForm] = useState({
    schedule_type: "one_time",
    start_date: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    description: "",
  });
useEffect(() => {
  if (defaultDate) {
    const derivedDay = deriveDayOfWeek(defaultDate);

    setForm((prev) => ({
      ...prev,
      start_date: defaultDate,
      day_of_week: derivedDay,
    }));
  }
}, [defaultDate]);
  const [clientQuery, setClientQuery] = useState("");
const [showClientDropdown, setShowClientDropdown] = useState(false);


const deriveDayOfWeek = (dateStr) => {
  if (!dateStr) return "";

  // Force local time to avoid timezone shifting
  const jsDay = new Date(dateStr + "T12:00:00").getDay(); // 0=Sunday ... 6=Saturday

  // Convert JS (Sun=0) to your DB format (Mon=0 ... Sun=6)
  return jsDay === 0 ? 6 : jsDay - 1;
};

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
const [selectedClient, setSelectedClient] = useState(null);
const [staff, setStaff] = useState([]);
const [admins, setAdmins] = useState([]);
const assignCleaner = async ({ staff_id = null, admin_id = null }) => {
  if (!selectedClient) return;

  await authAxios.post(
    `/clients/${selectedClient.id}/assign-one`,
    { staff_id, admin_id }
  );

  const res = await authAxios.get(
    `/clients/${selectedClient.id}/assignments`
  );

  setSelectedClient({
    ...selectedClient,
    cleaners: res.data.assignments,
  });
};

const removeCleaner = async (assignmentId) => {
  await authAxios.delete(
    `/clients/${selectedClient.id}/assignments/${assignmentId}`
  );

  const res = await authAxios.get(
    `/clients/${selectedClient.id}/assignments`
  );

  setSelectedClient({
    ...selectedClient,
    cleaners: res.data.assignments,
  });
};


useEffect(() => {
  const loadInitialData = async () => {
    try {
      const [clientsRes, staffRes, adminsRes] = await Promise.all([
        authAxios.get("/clients"),
        authAxios.get("/staff/all"),
        authAxios.get("/admin/all"),
      ]);

      setClients(clientsRes.data || []);
      setStaff(staffRes.data || []);
      setAdmins(adminsRes.data || []);
    } catch (err) {
      console.error("Failed to load data", err);
    }
  };

  loadInitialData();
}, []);





const handleChange = (e) => {
  const { name, value } = e.target;

  // If start_date changes, derive day_of_week automatically
  if (name === "start_date") {
    const derivedDay = deriveDayOfWeek(value);

    setForm((prev) => ({
      ...prev,
      start_date: value,
      day_of_week: derivedDay,
    }));

    return;
  }

  setForm((prev) => ({ ...prev, [name]: value }));
};


  const submit = async (e) => {
    e.preventDefault();

    if (!selectedClientId) {
      alert("Select a client first");
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      const payload = {
        schedule_type: form.schedule_type,
        start_date: form.start_date,
        start_time: form.start_time,
        end_time: form.end_time,
        description: form.description,
      };

      // Only include day_of_week for recurring
      if (form.schedule_type !== "one_time") {
        payload.day_of_week = Number(form.day_of_week);
      }

      await authAxios.post(
        `/clients/${selectedClientId}/schedules`,
        payload
      );

      setStatus("✅ Schedule created successfully");

      // reset form
      setForm({
        schedule_type: "one_time",
        start_date: "",
        day_of_week: "",
        start_time: "",
        end_time: "",
        description: "",
      });
    } catch (err) {
      console.error(err);
      setStatus(
        err.response?.data?.error || "Failed to create schedule"
      );
    } finally {
      setLoading(false);
    }
  };


  const filteredClients = clients.filter((c) => {
  const q = clientQuery.toLowerCase();
  return (
    c.first_name.toLowerCase().includes(q) ||
    c.last_name.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q)
  );
});


  return (
    <div className="max-w-3xl mx-auto border rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-4">📅 Create Client Schedule</h2>

      {/* Client Selector */}
    {/* Client Selector */}
<div className="mb-4 relative">
  <label className="block font-semibold mb-1">Client</label>

  <input
    type="text"
    value={clientQuery}
    onChange={(e) => {
      setClientQuery(e.target.value);
      setShowClientDropdown(true);
    }}
    onFocus={() => setShowClientDropdown(true)}
    placeholder="Search client by name or email…"
    className="w-full border rounded p-2"
  />

  {showClientDropdown && filteredClients.length > 0 && (
    <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded border bg-white shadow-lg">
      {filteredClients.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => {
            setSelectedClientId(c.id);
            setSelectedClient(c);
            setClientQuery(`${c.first_name} ${c.last_name} — ${c.email}`);
            setShowClientDropdown(false);
          }}
          className="
            w-full text-left px-3 py-2 text-sm
            hover:bg-blue-50
            border-b last:border-b-0
          "
        >
          <div className="font-semibold">
            {c.first_name} {c.last_name}
          </div>
          <div className="text-xs text-gray-500">{c.email}</div>
        </button>
      ))}
    </div>
  )}

  {showClientDropdown && filteredClients.length === 0 && (
    <div className="absolute z-20 mt-1 w-full rounded border bg-white p-3 text-sm text-gray-500 shadow">
      No clients found
    </div>
  )}
</div>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Schedule Type */}
        <div>
          <label className="block font-semibold mb-1">Schedule Type</label>
          <select
            name="schedule_type"
            value={form.schedule_type}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="one_time">One Time</option>
            <option value="weekly">Weekly</option>
            <option value="bi_weekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block font-semibold mb-1">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        {/* Day of Week (only for recurring) */}
        {form.schedule_type !== "one_time" && form.start_date && (
  <div>
    <label className="block font-semibold mb-1">Day of Week (Derived)</label>
    <input
      disabled
      className="w-full border rounded p-2 bg-gray-100"
      value={[
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ][form.day_of_week]}
    />
  </div>
)}

        {/* Start Time */}
        <div>
          <label className="block font-semibold mb-1">Start Time</label>
          <input
            type="time"
            name="start_time"
            value={form.start_time}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block font-semibold mb-1">End Time</label>
          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full border rounded p-2"
            placeholder="Optional notes about this schedule..."
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create Schedule"}
          </button>

          {status && (
            <span className="text-sm font-semibold">
              {status}
            </span>
          )}
        </div>
      </form>
      {selectedClient && (
  <AssignCleaners
    client={selectedClient}
    staff={staff}
    admins={admins}
    onAssign={assignCleaner}
    onRemove={removeCleaner}
  />
)}

    </div>
  );
}
