import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import SchedulesMiniCalendar from "./SchedulesMiniCalendar";
import AssignClients from "./AssignClients";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function ClientSchedulesManagers() {
  const { authAxios } = useStaff();   // 👈 DIFFERENCE: useStaff instead of useAdmin
const getCleanerName = (c) => {
  if (c.profile?.first_name || c.profile?.last_name) {
    return `${c.profile?.first_name || ""} ${c.profile?.last_name || ""}`.trim();
  }
  return c.username;
};
const [search, setSearch] = useState("");
const normalizedSearch = search.trim().toLowerCase();
const formatLocalDate = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return new Date(year, month - 1, day).toLocaleDateString();
};

const dayMatches = (schedule) => {
  if (schedule.day_of_week == null) return false;
  const dayName = DAY_NAMES[schedule.day_of_week]?.toLowerCase();
  return dayName?.includes(normalizedSearch);
};

const clientMatches = (schedule) => {
  const name = `${schedule.client?.first_name || ""} ${schedule.client?.last_name || ""}`
    .toLowerCase();
  return name.includes(normalizedSearch);
};

const cleanerMatches = (schedule) => {
  return schedule.client?.cleaners?.some((c) => {
    const name = getCleanerName(c).toLowerCase();
    return name.includes(normalizedSearch);
  });
};

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const formatTime12 = (time24) => {
    if (!time24) return "";

    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr, 10);

    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${hour}:${minute} ${ampm}`;
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get("/schedules");  // same endpoint
      setSchedules(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const startEdit = (s) => {
    setEditing(s);
    setEditForm({
      schedule_type: s.schedule_type,
      start_date: s.start_date,
      start_time: s.start_time,
      end_time: s.end_time,
      description: s.description || "",
      status: s.status,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      await authAxios.patch(`/schedules/${editing.id}`, editForm);
      await loadSchedules();
      cancelEdit();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update schedule");
    }
  };

  const deleteSchedule = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this schedule?");
    if (!ok) return;

    try {
      await authAxios.delete(`/schedules/${id}`);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete schedule");
    }
  };
const filteredSchedules = schedules.filter((s) => {
  if (!normalizedSearch) return true;

  return (
    clientMatches(s) ||
    cleanerMatches(s) ||
    dayMatches(s)
  );
});

  if (loading) return <p className="p-6">Loading schedules...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        📅 Client Schedules (Manager)
      </h2>
      <input
  type="text"
  placeholder="Search by client, cleaner, or day (e.g. Monday)…"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="
    w-full max-w-md
    px-4 py-2
    border rounded-lg
    focus:ring-2 focus:ring-blue-500
    focus:outline-none
  "
/>

<SchedulesMiniCalendar
  schedules={filteredSchedules}
  onEdit={startEdit}
  onDelete={deleteSchedule}
/>

      {schedules.length === 0 && (
        <p className="text-gray-500 italic">
          No schedules created yet.
        </p>
      )}

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
{schedules
  .filter((s) => {
    if (!normalizedSearch) return true;

    return (
      clientMatches(s) ||
      cleanerMatches(s) ||
      dayMatches(s)
    );
  })
  .map((s) => (
    <div
      key={s.id}
      className="rounded-2xl border bg-white shadow-sm p-4 space-y-3 hover:shadow-md transition"
    >
      {/* CLIENT NAME */}
      <div>
        <div className="font-bold text-lg">
          {s.client?.first_name} {s.client?.last_name}
        </div>
        <div className="text-sm text-gray-500 capitalize">
          {s.schedule_type.replace("_", " ")}
        </div>
      </div>

      {/* DATE + DAY */}
      <div className="text-sm text-gray-700">
        <div>
          📆{" "}
          {s.start_date
  ? formatLocalDate(s.start_date)
  : "No start date"}

        </div>
        <div>
          🗓️{" "}
          {s.day_of_week !== null
            ? DAY_NAMES[s.day_of_week]
            : "No fixed day"}
        </div>
      </div>

      {/* TIME */}
      <div className="text-sm text-gray-700">
        ⏰ {formatTime12(s.start_time)} → {formatTime12(s.end_time)}
      </div>

      {/* STATUS */}
      <div>
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            s.status === "active"
              ? "bg-green-100 text-green-700"
              : s.status === "paused"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {s.status}
        </span>
      </div>
      {/* ASSIGNED CLEANERS */}
<div className="space-y-1">
  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
    Assigned Cleaners
  </div>

  {s.client?.cleaners?.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {s.client.cleaners.map((c) => (
        <div
          key={c.assignment_id}
          className="
            flex items-center gap-2
            bg-blue-50 text-blue-800
            px-3 py-1 rounded-full text-xs font-medium
          "
        >
          {c.profile?.photo_url ? (
            <img
              src={c.profile.photo_url}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-[10px] font-bold">
              {getCleanerName(c)[0]}
            </div>
          )}

          <span>{getCleanerName(c)}</span>

        </div>
      ))}
    </div>
  ) : (
    <div className="text-xs italic text-gray-400">
      No cleaners assigned
    </div>
  )}
</div>


      {/* ACTIONS */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => startEdit(s)}
          className="flex-1 px-3 py-2 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          Edit
        </button>

        <button
          onClick={() => deleteSchedule(s.id)}
          className="flex-1 px-3 py-2 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
        >
          Delete
        </button>
      </div>
    </div>
  ))}
</div>


      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-xl font-bold">
              ✏️ Edit Schedule
            </h3>
{editing?.client && (
  <div className="border rounded-lg p-4 bg-slate-50">
    <h4 className="text-sm font-bold text-slate-700 mb-3">
      👥 Assign Cleaners
    </h4>

<AssignClients
  client={editing.client}
  onUpdated={(updatedCleaners) => {
    // 🔥 update modal state immediately
    setEditing((prev) => ({
      ...prev,
      client: {
        ...prev.client,
        cleaners: updatedCleaners,
      },
    }));

    // 🔁 refresh calendar + cards
    loadSchedules();
  }}
/>

  </div>
)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Schedule Type
                </label>
                <select
                  value={editForm.schedule_type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, schedule_type: e.target.value })
                  }
                  className="w-full border rounded p-2"
                >
                  <option value="one_time">One Time</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi_weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, start_date: e.target.value })
                  }
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={editForm.start_time}
                  onChange={(e) =>
                    setEditForm({ ...editForm, start_time: e.target.value })
                  }
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={editForm.end_time}
                  onChange={(e) =>
                    setEditForm({ ...editForm, end_time: e.target.value })
                  }
                  className="w-full border rounded p-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full border rounded p-2"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </div>
{/* CLIENT ASSIGNMENT */}


            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
