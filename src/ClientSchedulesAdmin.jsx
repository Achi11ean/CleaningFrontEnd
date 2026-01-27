import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function ClientSchedulesAdmin() {
  const { authAxios } = useAdmin();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null); // schedule being edited
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
      const res = await authAxios.get("/schedules");
      setSchedules(res.data || []);
    } catch (err) {
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

  if (loading) return <p className="p-6">Loading schedules...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        📅 Client Schedules
      </h2>

      {schedules.length === 0 && (
        <p className="text-gray-500 italic">
          No schedules created yet.
        </p>
      )}

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 uppercase text-gray-700 text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Start Date</th>
              <th className="px-4 py-3 text-left">Day</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {schedules.map((s) => (
              <tr key={s.id} className="hover:bg-blue-50">
                <td className="px-4 py-3 font-semibold">
                  {s.client?.first_name} {s.client?.last_name}
                </td>

                <td className="px-4 py-3 capitalize">
                  {s.schedule_type.replace("_", " ")}
                </td>

                <td className="px-4 py-3">
                  {s.start_date
                    ? new Date(s.start_date).toLocaleDateString()
                    : "-"}
                </td>

                <td className="px-4 py-3">
                  {s.day_of_week !== null
                    ? DAY_NAMES[s.day_of_week]
                    : "—"}
                </td>

       <td className="px-4 py-3">
  {formatTime12(s.start_time)} → {formatTime12(s.end_time)}
</td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      s.status === "active"
                        ? "bg-green-100 text-green-700"
                        : s.status === "paused"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>

                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => startEdit(s)}
                    className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteSchedule(s.id)}
                    className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-xl font-bold">
              ✏️ Edit Schedule
            </h3>

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
