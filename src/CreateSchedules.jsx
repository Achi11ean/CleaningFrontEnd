import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import AssignCleaners from "./AssignCleaners";

/* Shared field styles for a consistent form */
const fieldCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";
const labelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400";

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
  const [crossRefLoading, setCrossRefLoading] = useState(false);
  const [crossRefResult, setCrossRefResult] = useState(null); // { ok, conflicts, checkedOwner }
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate + "T12:00:00"); // prevents timezone shift
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
    // half-open intervals [start,end)
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
          message:
            "No assigned cleaners found. Assign at least one cleaner first.",
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
            if (!occ?.date || occ.start_minutes == null || occ.end_minutes == null)
              return false;

            if (form.schedule_type === "one_time") {
              if (occ.date !== form.start_date) return false;
            }

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
            ? `✅ No conflicts across ${checkedOwners.length} assigned cleaner(s).`
            : `❌ ${allConflicts.length} conflict(s) across ${checkedOwners.length} cleaner(s).`,
      });
    } catch (err) {
      console.error("Cross reference failed:", err);
      setCrossRefResult({
        ok: false,
        conflicts: [],
        checkedOwners: [],
        message:
          err.response?.data?.error || "Failed to cross reference schedule.",
      });
    } finally {
      setCrossRefLoading(false);
    }
  };
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

    await authAxios.post(`/clients/${selectedClient.id}/assign-one`, {
      staff_id,
      admin_id,
    });

    const res = await authAxios.get(`/clients/${selectedClient.id}/assignments`);

    setSelectedClient({
      ...selectedClient,
      cleaners: res.data.assignments,
    });
  };

  const removeCleaner = async (assignmentId) => {
    await authAxios.delete(
      `/clients/${selectedClient.id}/assignments/${assignmentId}`
    );

    const res = await authAxios.get(`/clients/${selectedClient.id}/assignments`);

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

      await authAxios.post(`/clients/${selectedClientId}/schedules`, payload);

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
      setStatus(err.response?.data?.error || "Failed to create schedule");
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

  // Presentation-only: color the inline feedback without changing logic
  const feedback = status || crossRefResult?.message;
  const feedbackOk =
    (status && (status.includes("✅") || status.toLowerCase().includes("success"))) ||
    (!status && crossRefResult?.ok);

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
        <h2 className="text-lg font-bold text-slate-800">Create Client Schedule</h2>
        <p className="mt-0.5 text-sm text-slate-400">
          Pick a client, set the recurrence, and check for conflicts before saving.
        </p>
      </div>

      <div className="p-6">
        {/* Client Selector */}
        <div className="relative mb-5">
          <label className={labelCls}>Client</label>

          <input
            type="text"
            value={clientQuery}
            onChange={(e) => {
              setClientQuery(e.target.value);
              setShowClientDropdown(true);
            }}
            onFocus={() => setShowClientDropdown(true)}
            placeholder="Search client by name or email…"
            className={fieldCls}
          />

          {showClientDropdown && filteredClients.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
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
                  className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm transition last:border-b-0 hover:bg-blue-50"
                >
                  <div className="font-semibold text-slate-800">
                    {c.first_name} {c.last_name}
                  </div>
                  <div className="text-xs text-slate-500">{c.email}</div>
                </button>
              ))}
            </div>
          )}

          {showClientDropdown && filteredClients.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow">
              No clients found
            </div>
          )}

          {selectedClient && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckIcon />
              {selectedClient.first_name} {selectedClient.last_name} selected
            </p>
          )}
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Schedule Type */}
          <div>
            <label className={labelCls}>Schedule Type</label>
            <select
              name="schedule_type"
              value={form.schedule_type}
              onChange={handleChange}
              className={fieldCls}
            >
              <option value="one_time">One Time</option>
              <option value="weekly">Weekly</option>
              <option value="bi_weekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className={labelCls}>Start Date</label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className={fieldCls}
              required
            />
          </div>

          {/* Day of Week (only for recurring) */}
          {form.schedule_type !== "one_time" && form.start_date && (
            <div>
              <label className={labelCls}>Day of Week (Derived)</label>
              <input
                disabled
                className={`${fieldCls} bg-slate-100 text-slate-500`}
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
            <label className={labelCls}>Start Time</label>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className={fieldCls}
              required
            />
          </div>

          {/* End Time */}
          <div>
            <label className={labelCls}>End Time</label>
            <input
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              className={fieldCls}
              required
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className={fieldCls}
              placeholder="Optional notes about this schedule…"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={crossReference}
              disabled={crossRefLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-50"
            >
              {crossRefLoading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                  Checking…
                </>
              ) : (
                <>
                  <SearchIcon />
                  Check conflicts
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:shadow-md hover:shadow-blue-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving…
                </>
              ) : (
                "Create Schedule"
              )}
            </button>

            {feedback && (
              <span
                className={`text-sm font-semibold ${
                  feedbackOk ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {feedback}
              </span>
            )}
          </div>
        </form>

        {selectedClient && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <AssignCleaners
              client={selectedClient}
              staff={staff}
              admins={admins}
              onAssign={assignCleaner}
              onRemove={removeCleaner}
            />
          </div>
        )}

        {crossRefResult && crossRefResult.conflicts?.length > 0 && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-bold text-rose-700">
              <AlertIcon />
              {crossRefResult.message}
            </div>

            {/* Checked Owners Summary */}
            {crossRefResult.checkedOwners?.length > 0 && (
              <div className="mb-3 text-sm text-rose-700">
                Checked against{" "}
                <span className="font-semibold">
                  {crossRefResult.checkedOwners.length}
                </span>{" "}
                assigned cleaner(s):
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {crossRefResult.checkedOwners.map((o) => (
                    <span
                      key={`${o.type}-${o.id}`}
                      className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700"
                    >
                      {o.profile?.first_name || o.username || `${o.type} #${o.id}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Conflict List */}
            <ul className="space-y-2">
              {crossRefResult.conflicts.slice(0, 8).map((c) => (
                <li
                  key={`${c.schedule_id}-${c.date}-${c.start_time}-${c.conflict_owner?.id}`}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="font-semibold text-slate-800">
                    {c.client_name || `Client #${c.client_id}`}
                  </div>
                  <div className="text-sm text-slate-600">
                    {formatDate(c.date)} • {c.start_time}–{c.end_time} •{" "}
                    {c.schedule_type}
                  </div>
                  {/* Show which cleaner conflicts */}
                  <div className="mt-1 text-xs font-semibold text-rose-600">
                    Conflict with:{" "}
                    {c.conflict_owner?.profile?.first_name ||
                      c.conflict_owner?.username ||
                      `${c.conflict_owner_type} #${c.conflict_owner?.id}`}
                  </div>

                  {c.exception?.reason && (
                    <div className="mt-1 text-xs italic text-slate-500">
                      Exception: {c.exception.reason}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {crossRefResult.conflicts.length > 8 && (
              <div className="mt-2 text-xs text-slate-500">
                Showing first 8 conflicts…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= INLINE ICONS ================= */
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9.5v4.5M12 17.2v.2" />
    </svg>
  );
}