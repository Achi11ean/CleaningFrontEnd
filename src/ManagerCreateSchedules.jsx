import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import AssignCleaners from "./AssignCleaners";

export default function ManagerCreateSchedules() {
  const { authAxios } = useStaff();

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
const [staff, setStaff] = useState([]);
const [admins, setAdmins] = useState([]);
const [selectedClient, setSelectedClient] = useState(null);

  const [form, setForm] = useState({
    schedule_type: "one_time",
    start_date: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
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

  const deriveDayOfWeek = (dateStr) => {
    if (!dateStr) return "";

    // Force local time to avoid timezone shifting
    const jsDay = new Date(dateStr + "T12:00:00").getDay(); // 0=Sun ... 6=Sat

    // Convert JS (Sun=0) to DB format (Mon=0 ... Sun=6)
    return jsDay === 0 ? 6 : jsDay - 1;
  };

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await authAxios.get("/clients");
        setClients(res.data || []);
      } catch (err) {
        console.error("Failed to load clients", err);
      }
    };

    loadClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

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

      if (form.schedule_type !== "one_time") {
        payload.day_of_week = Number(form.day_of_week);
      }

      await authAxios.post(
        `/clients/${selectedClientId}/schedules`,
        payload
      );

      setStatus("✅ Schedule created successfully");

      // reset
      setForm({
        schedule_type: "one_time",
        start_date: "",
        day_of_week: "",
        start_time: "",
        end_time: "",
        description: "",
      });
      setSelectedClientId("");
    } catch (err) {
      console.error(err);
      setStatus(
        err.response?.data?.error || "Failed to create schedule"
      );
    } finally {
      setLoading(false);
    }
  };


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

const removeAssignment = async (assignmentId) => {
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

  return (
    <div className="max-w-3xl mx-auto border rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-4">➕ Create Client Schedule</h2>

      {/* Client Selector */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Client</label>
  <select
  value={selectedClientId}
  onChange={(e) => {
    const id = Number(e.target.value);
    setSelectedClientId(id);

    const client = clients.find((c) => c.id === id);
    setSelectedClient(client || null);
  }}
  className="w-full border rounded p-2"
>

          <option value="">-- Select a client --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name} — {c.email}
            </option>
          ))}
        </select>
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

        {/* Derived Day */}
        {form.schedule_type !== "one_time" && form.start_date && (
          <div>
            <label className="block font-semibold mb-1">Day of Week</label>
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
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
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
    onRemove={removeAssignment}
  />
)}
    </div>
  );
}
