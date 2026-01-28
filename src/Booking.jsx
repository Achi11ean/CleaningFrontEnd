import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "./AdminContext";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const hour = h % 12 || 12;
  const period = h >= 12 ? "PM" : "AM";
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRecurrence(type) {
  switch (type) {
    case "one_time":
      return "One-time";
    case "weekly":
      return "Weekly";
    case "bi_weekly":
      return "Bi-weekly";
    case "monthly":
      return "Monthly";
    default:
      return type;
  }
}

export default function Booking() {
  const { authAxios } = useAdmin();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const matchedDay = DAYS.find((d) => d.startsWith(normalizedSearch));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await authAxios.get("/admin/availability/overview");
        setRows(res.data || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authAxios]);

const filteredRows = useMemo(() => {
  if (!normalizedSearch) return rows;

  return rows.filter((r) => {
    const nameMatch =
      r.display_name?.toLowerCase().includes(normalizedSearch) ||
      r.username?.toLowerCase().includes(normalizedSearch);

    if (!matchedDay) return nameMatch;

    const slot = r.availability?.weekly?.[matchedDay];
    if (!slot || !slot.start || !slot.end) return false;

    const hasClientThatDay = r.clients.some((c) =>
      c.schedules.some(
        (s) =>
          s.day_of_week !== null &&
          s.day_of_week === DAYS.indexOf(matchedDay)
      )
    );

    return hasClientThatDay || nameMatch;
  });
}, [rows, normalizedSearch, matchedDay]);

  if (loading) {
    return <p className="italic text-gray-500">Loading booking overview…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">📋 Booking Planner</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search staff or day (e.g. monday)…"
          className="w-full md:w-80 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredRows.length === 0 && (
        <p className="text-center text-gray-500 italic">
          No staff match your search.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRows.map((r) => {
          const weekly = r.availability?.weekly || {};

          return (
            <div
              key={`${r.type}-${r.id}`}
              className="border rounded-2xl shadow bg-white p-5 space-y-4"
            >
              {/* HEADER */}
              <div className="flex items-center gap-3">
                {r.photo_url ? (
                  <img
                    src={r.photo_url}
                    alt={r.display_name}
                    className="w-14 h-14 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                    {r.display_name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="font-bold text-lg">
                    {r.display_name}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {r.type} {r.role ? `• ${r.role}` : ""}
                  </div>
                </div>
              </div>

              {/* AVAILABILITY */}
              <div>
                <h4 className="font-semibold mb-1">🕒 Availability</h4>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {DAYS.map((day) => {
                    const slot = weekly?.[day];
                    return (
                      <div key={day}>
                        <strong className="capitalize">{day}:</strong>{" "}
                        {slot?.start && slot?.end ? (
                          <span>
                            {formatTime(slot.start)} –{" "}
                            {formatTime(slot.end)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Unavailable</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CLIENTS */}
              <div>
                <h4 className="font-semibold mb-1">🏠 Assigned Clients</h4>

                {r.clients.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">
                    No assigned clients
                  </p>
                ) : (
                  <div className="space-y-2">
                    {r.clients.map((c) => (
                      <div
                        key={c.id}
                        className="border rounded-lg p-2 bg-gray-50"
                      >
                        <div className="font-semibold text-sm">
                          {c.first_name} {c.last_name}
                        </div>

                        {c.schedules.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">
                            No active schedules
                          </p>
                        ) : (
                          <ul className="text-xs mt-1 space-y-1">
                            {c.schedules.map((s) => (
                              <li key={s.id} className="leading-snug">
  <div className="font-medium">
    {formatRecurrence(s.recurrence_type)}
    {s.day_of_week !== null && (
      <span className="capitalize">
        {" "}• {DAYS[s.day_of_week]}
      </span>
    )}
  </div>

  <div className="text-gray-600">
    {formatTime(s.start_time)} → {formatTime(s.end_time)}
  </div>

  <div className="text-gray-500 italic">
    Starts {formatDate(s.starts_on)}
  </div>
</li>

                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

