import { useEffect, useMemo, useState } from "react";
import { useStaff } from "./StaffContext";
import TimeOffPreview from "./TimeOffPreview";

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
function getDayLabel(schedule) {
  // If backend already provided day_of_week, use it
  if (schedule.day_of_week !== null && schedule.day_of_week !== undefined) {
    return DAYS[schedule.day_of_week];
  }

  // Fallback: derive from date (for one-time)
  const date =
    schedule.starts_on || schedule.start_date;

  if (!date) return null;

  const jsDay = new Date(date + "T12:00:00").getDay(); // 0=Sun
  const normalized = jsDay === 0 ? 6 : jsDay - 1; // Mon=0

  return DAYS[normalized];
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

export default function ManagerBooking() {
  const { authAxios } = useStaff();
const DAY_GRADIENTS = {
  monday: "bg-gradient-to-br from-blue-100 to-blue-50",
  tuesday: "bg-gradient-to-br from-purple-100 to-purple-50",
  wednesday: "bg-gradient-to-br from-emerald-100 to-emerald-50",
  thursday: "bg-gradient-to-br from-amber-100 to-amber-50",
  friday: "bg-gradient-to-br from-pink-100 to-pink-50",
  saturday: "bg-gradient-to-br from-indigo-100 to-indigo-50",
  sunday: "bg-gradient-to-br from-rose-100 to-rose-50",
};
const DAY_ORDER_SUN_FIRST = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const [openTimeOffFor, setOpenTimeOffFor] = useState(null);

function getDaySortIndex(schedule) {
  const label = getDayLabel(schedule);
  if (!label) return 99;
  return DAY_ORDER_SUN_FIRST.indexOf(label);
}

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

    // If not searching a day, fallback to name search
    if (!matchedDay) return nameMatch;

    // 🔥 KEY FIX: check AVAILABILITY
    const slot = r.availability?.weekly?.[matchedDay];

    const isAvailableThatDay =
      slot?.start && slot?.end;

    return isAvailableThatDay || nameMatch;
  });
}, [rows, normalizedSearch, matchedDay]);


  if (loading) {
    return <p className="italic text-gray-500">Loading booking planner…</p>;
  }

  return (
    <div className="space-y-6 mt-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-800">
          📋 Booking Planner
        </h2>

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

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRows.map((r) => {
          const weekly = r.availability?.weekly || {};
const consolidatedSchedules = r.clients
  .flatMap((client) =>
    client.schedules.map((schedule) => ({
      ...schedule,
      client,
      sortIndex: getDaySortIndex(schedule),
    }))
  )
  .sort((a, b) => a.sortIndex - b.sortIndex);

          return (
            <div
              key={`${r.type}-${r.id}`}
              className="border rounded-2xl shadow bg-white p-5 space-y-4"
            >
              {/* STAFF HEADER */}
{/* STAFF HEADER */}
<div className="flex items-center gap-3">
  {r.photo_url ? (
    <img
      src={r.photo_url}
      alt={r.display_name}
      className="w-14 h-14 rounded-full object-cover border"
    />
  ) : (
    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
      {r.display_name?.charAt(0).toUpperCase()}
    </div>
  )}

  <div className="flex-1">
    <div className="font-bold text-lg">
      {r.display_name}
    </div>
    <div className="text-sm text-gray-500 capitalize">
      {r.type} {r.role ? `• ${r.role}` : ""}
    </div>
  </div>

  {/* 🛑 TIME OFF TOGGLE */}
  <button
    onClick={() =>
      setOpenTimeOffFor(
        openTimeOffFor === r.id ? null : r.id
      )
    }
    className="text-xs px-3 py-1 rounded-full border
               bg-white hover:bg-red-50
               border-red-300 text-red-700"
  >
    🛑 Time Off
  </button>
</div>

              {/* AVAILABILITY */}
 <div>
  <h4 className="font-semibold text-center mb-2">🕒 Availability</h4>

  <div className="grid grid-cols-2 gap-2 text-sm">
    {DAYS.map((day) => {
      const slot = weekly[day];

      return (
        <div
          key={day}
          className={`
            rounded-lg p-2
            border border-black/10
            ${DAY_GRADIENTS[day]}
          `}
        >
          <div className="font-semibold capitalize text-gray-800">
            {day}
          </div>

          {slot?.start && slot?.end ? (
            <div className="text-gray-700">
              {formatTime(slot.start)} – {formatTime(slot.end)}
            </div>
          ) : (
            <div className="text-gray-400 italic">
              Unavailable
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>

              {/* CLIENTS */}
            {/* CLIENTS */}
<div>
  <h4 className="font-semibold mb-1">🏠 Assigned Clients</h4>

  {consolidatedSchedules.length === 0 ? (
    <p className="text-gray-500 italic text-sm">
      No assigned clients
    </p>
  ) : (
    <ul className="text-xs mt-2 space-y-2">
      {consolidatedSchedules.map((s) => (
        <li
          key={s.id}
          className="border rounded-lg p-2 bg-gray-50"
        >
          <div className="font-semibold text-sm">
            {s.client.first_name} {s.client.last_name}
          </div>

          <div className="font-medium">
            {formatRecurrence(s.recurrence_type)}
            {getDayLabel(s) && (
              <span className="capitalize">
                {" "}• {getDayLabel(s)}
              </span>
            )}
          </div>

          <div className="text-gray-600">
            {formatTime(s.start_time)} → {formatTime(s.end_time)}
          </div>

          <div className="text-gray-500 italic">
            {s.recurrence_type === "one_time"
              ? `Service Date ${formatDate(s.starts_on || s.start_date)}`
              : `Starts ${formatDate(s.starts_on)}`
            }
          </div>
        </li>
      ))}
    </ul>
  )}
</div>
{openTimeOffFor === r.id && (
  <div className="border-t pt-3">
    <h4 className="font-semibold mb-2 text-red-700">
      🚫 Time Off Requests
    </h4>

    <TimeOffPreview
      authAxios={authAxios}
      owner={{
        id: r.id,
        type: r.type, // "staff" | "admin"
      }}
    />
  </div>
)}

      </div>
          );
        })}
      </div>
      
    </div>
  );
}
