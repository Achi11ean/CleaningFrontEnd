import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { toast } from "react-toastify";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function to12Hour(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const hour = h % 12 || 12;
  const period = h >= 12 ? "PM" : "AM";
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function ManageAvailability() {
  const { role, axios } = useAuthorizedAxios();

  // 🔐 Admins + Managers only
  if (!axios || (role !== "admin" && role !== "manager")) {
    return <p className="text-red-600">Unauthorized</p>;
  }

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const matchedDay =
    normalizedSearch.length > 0
      ? DAYS.find((day) => day.startsWith(normalizedSearch))
      : null;

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/availability/all");
      setRows(res.data || []);
    } catch {
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [axios]);

  const updateSlot = (rowId, day, field, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              weekly: {
                ...r.weekly,
                [day]: {
                  ...(r.weekly?.[day] || { start: "", end: "" }),
                  [field]: value,
                },
              },
            }
          : r
      )
    );
  };

  const saveAvailability = async (row) => {
    try {
      setSavingId(row.id);
      await axios.patch(
        `/admin/staff/${row.owner.id}/availability`,
        { weekly: row.weekly }
      );
      toast.success("Availability updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const toggleLock = async (row) => {
    try {
      if (row.owner.type !== "staff") return;

      await axios.patch(
        `/admin/staff/${row.owner.id}/availability/lock`,
        { is_locked: !row.is_locked }
      );

      toast.success(row.is_locked ? "Unlocked" : "Locked");
      load();
    } catch {
      toast.error("Failed to update lock");
    }
  };

  const lockAll = async () => {
    await axios.patch("/admin/availability/lock-all");
    toast.success("All availability locked");
    load();
  };

  const unlockAll = async () => {
    await axios.patch("/admin/availability/unlock-all");
    toast.success("All availability unlocked");
    load();
  };

  if (loading) {
    return <p className="italic text-gray-500">Loading availability…</p>;
  }

  const filteredRows = rows.filter((row) => {
    if (!normalizedSearch) return true;

    const nameMatch =
      row.owner.display_name?.toLowerCase().includes(normalizedSearch) ||
      row.owner.username?.toLowerCase().includes(normalizedSearch);

    if (matchedDay) {
      const slot = row.weekly?.[matchedDay];
      return Boolean(slot && slot.start && slot.end);
    }

    return nameMatch;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <h2 className="text-2xl font-bold">👥 Employee Availability</h2>

        <input
          type="text"
          placeholder="Search by name or day (e.g. monday)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* GLOBAL CONTROLS */}
      <div className="flex gap-3">
        <button
          onClick={lockAll}
          className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
        >
          🔒 Lock All
        </button>
        <button
          onClick={unlockAll}
          className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
        >
          🔓 Unlock All
        </button>
      </div>

      {filteredRows.length === 0 && (
        <p className="text-center text-gray-500 italic">
          No availability matches your search.
        </p>
      )}

      {filteredRows.map((row) => (
        <div
          key={row.id}
          className={`border rounded-xl p-4 shadow ${
            row.is_locked ? "bg-gray-100 border-gray-400" : "bg-white"
          }`}
        >
          {/* HEADER */}
          <div className="flex justify-between mb-3">
            <div>
              <p className="font-semibold">{row.owner.display_name}</p>
              <p className="text-xs text-gray-500">
                {row.owner.type.toUpperCase()}
                {row.owner.role ? ` • ${row.owner.role}` : ""}
              </p>
            </div>

            {row.owner.type === "staff" && (
              <button
                onClick={() => toggleLock(row)}
                className={`px-3 py-1 text-sm rounded font-semibold ${
                  row.is_locked
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {row.is_locked ? "Unlock" : "Lock"}
              </button>
            )}
          </div>

          {/* WEEKLY GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(matchedDay ? [matchedDay] : DAYS).map((day) => {
              const slot = row.weekly?.[day];

              return (
                <div key={day} className="text-sm">
                  <strong className="capitalize">{day}</strong>

                  {!slot ? (
                    <p className="text-gray-400">Unavailable</p>
                  ) : (
                    <div className="flex gap-2 items-center mt-1">
                      <input
                        type="time"
                        value={slot.start}
                        disabled={row.is_locked}
                        onChange={(e) =>
                          updateSlot(row.id, day, "start", e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <span>→</span>
                      <input
                        type="time"
                        value={slot.end}
                        disabled={row.is_locked}
                        onChange={(e) =>
                          updateSlot(row.id, day, "end", e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <span className="text-gray-500">
                        ({to12Hour(slot.start)} – {to12Hour(slot.end)})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!row.is_locked && (
            <div className="flex justify-end mt-4">
              <button
                onClick={() => saveAvailability(row)}
                disabled={savingId === row.id}
                className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                {savingId === row.id ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
