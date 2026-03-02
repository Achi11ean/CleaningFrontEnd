import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import AssignCleaners from "./AssignCleaners";

export default function CreateSchedules({ defaultDate = null }) {
  const { authAxios } = useStaff();

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
const [staff, setStaff] = useState([]);
const [admins, setAdmins] = useState([]);
const [selectedClient, setSelectedClient] = useState(null);
const [crossRefLoading, setCrossRefLoading] = useState(false);
const [crossRefResult, setCrossRefResult] = useState(null);
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
const formatDate = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T12:00:00");
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

const toMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => {
  return aStart < bEnd && bStart < aEnd;
};

const getAllAssignedCleaners = async (clientId) => {
  const res = await authAxios.get(`/clients/${clientId}/assignments`);
  const assignments = res.data?.assignments || res.data || [];

  return assignments.map((a) => ({
    owner_type: a.type,
    owner_id: a.id,
    owner: a,
  }));
};


const crossReference = async () => {
  if (!selectedClientId) {
    alert("Select a client first");
    return;
  }

  if (!form.start_date || !form.start_time || !form.end_time) {
    alert("Pick a date + start/end time first");
    return;
  }

  if (toMinutes(form.end_time) <= toMinutes(form.start_time)) {
    alert("End time must be after start time");
    return;
  }

  setCrossRefLoading(true);
  setCrossRefResult(null);

  try {
    const owners = await getAllAssignedCleaners(selectedClientId);

    if (!owners.length) {
      setCrossRefResult({
        ok: false,
        conflicts: [],
        checkedOwners: [],
        message: "No assigned cleaners found.",
      });
      return;
    }

    const start = form.start_date;
    const days = form.schedule_type === "one_time" ? 1 : 90;

    const proposedStart = toMinutes(form.start_time);
    const proposedEnd = toMinutes(form.end_time);

    let allConflicts = [];
    let checkedOwners = [];

    for (const o of owners) {
      const url = `/admin/owners/${o.owner_type}/${o.owner_id}/schedule?start=${start}&days=${days}`;
      const res = await authAxios.get(url);

      const occs = res.data?.occurrences || [];
      checkedOwners.push(o.owner);

      const conflictsForOwner = occs
        .filter((occ) => {
          if (!occ?.date) return false;
          if (form.schedule_type === "one_time" && occ.date !== form.start_date)
            return false;

          return overlaps(
            proposedStart,
            proposedEnd,
            occ.start_minutes,
            occ.end_minutes
          );
        })
        .map((c) => ({
          ...c,
          conflict_owner: o.owner,
          conflict_owner_type: o.owner_type,
        }));

      allConflicts = [...allConflicts, ...conflictsForOwner];
    }

    setCrossRefResult({
      ok: allConflicts.length === 0,
      conflicts: allConflicts,
      checkedOwners,
      message:
        allConflicts.length === 0
          ? "✅ No conflicts found."
          : `❌ ${allConflicts.length} conflict(s) found.`,
    });
  } catch (err) {
    setCrossRefResult({
      ok: false,
      conflicts: [],
      checkedOwners: [],
      message: "Failed to cross reference.",
    });
  } finally {
    setCrossRefLoading(false);
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
      <h2 className="text-2xl font-bold mb-4">➕ Create Client Schedule</h2>

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
            hover:bg-green-50
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
       <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">

  <button
    type="button"
    onClick={crossReference}
    disabled={crossRefLoading}
    className="px-5 py-2 bg-purple-100 text-purple-700 rounded"
  >
    {crossRefLoading ? "Checking..." : "🔎 Check Conflicts"}
  </button>

  <button
    type="submit"
    disabled={loading}
    className="px-6 py-2 bg-green-600 text-white rounded"
  >
    {loading ? "Saving..." : "Create Schedule"}
  </button>

  {(status || crossRefResult?.message) && (
    <span className="text-sm font-semibold">
      {status || crossRefResult?.message}
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

{crossRefResult && crossRefResult.conflicts?.length > 0 && (
  <div className="mt-4 border rounded-lg p-4 bg-red-50">

    <div className="font-bold text-red-700 mb-2">
      {crossRefResult.message}
    </div>

    <ul className="space-y-2">
      {crossRefResult.conflicts.slice(0, 8).map((c) => (
        <li key={`${c.schedule_id}-${c.date}`} className="bg-white p-3 border rounded">
          <div className="font-semibold">{c.client_name}</div>
          <div className="text-sm text-gray-600">
            {formatDate(c.date)} • {c.start_time}–{c.end_time}
          </div>
        </li>
      ))}
    </ul>

  </div>
)}
    </div>
  );
}
