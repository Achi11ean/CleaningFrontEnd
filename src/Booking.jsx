import { useEffect, useMemo, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
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

function getDayLabel(schedule) {
  if (schedule.day_of_week !== null && schedule.day_of_week !== undefined) {
    return DAYS[schedule.day_of_week];
  }

  const date = schedule.starts_on || schedule.start_date;
  if (!date) return null;

  const jsDay = new Date(date + "T12:00:00").getDay();
  const normalized = jsDay === 0 ? 6 : jsDay - 1;
  return DAYS[normalized];
}

function getDaySortIndex(schedule) {
  const label = getDayLabel(schedule);
  if (!label) return 99;
  return DAY_ORDER_SUN_FIRST.indexOf(label);
}


function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const hour = h % 12 || 12;
  const period = h >= 12 ? "PM" : "AM";
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";

  const [year, month, day] = dateStr.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
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
const { axios: authAxios, role } = useAuthorizedAxios();
  const [rows, setRows] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleFilters, setScheduleFilters] = useState({});
  const [search, setSearch] = useState("");
const [openTimeOffFor, setOpenTimeOffFor] = useState(null);

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
    const isAvailableThatDay = slot?.start && slot?.end;

    return isAvailableThatDay || nameMatch;
  });
}, [rows, normalizedSearch, matchedDay]);

const getFilter = (id) => scheduleFilters[id] || "all";
  if (loading) {
    return <p className="italic text-gray-500">Loading booking overview…</p>;
  }


  const cycleFilter = (id) => {
  const order = ["all", "recurring", "one_time"];
  const current = getFilter(id);
  const next = order[(order.indexOf(current) + 1) % order.length];

  setScheduleFilters((prev) => ({
    ...prev,
    [id]: next,
  }));
};

 return (
  <>
    {/* TRIGGER BUTTON */}
    <button
      onClick={() => setOpenModal(true)}
      className="
        px-5 py-2
        rounded-full
        bg-gradient-to-r from-indigo-600 to-purple-600
        text-white text-sm font-semibold
        shadow-lg
        hover:scale-105 hover:shadow-xl
        transition-all duration-300
      "
    >
      📋 Open Booking Planner
    </button>

    {/* MODAL */}
    {openModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        
        {/* BACKDROP */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpenModal(false)}
        />

        {/* MODAL CONTENT */}
        <div
          className="
            relative
            w-[95%] max-w-7xl
            max-h-[90vh]
            overflow-y-auto
            rounded-2xl
            bg-gradient-to-br from-slate-900 via-black to-slate-900
            border border-white/10
            shadow-2xl
            p-4
            text-white
          "
        >
          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold tracking-wide">
              📋 Booking Planner
            </h2>

            <button
              onClick={() => setOpenModal(false)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          {/* SEARCH */}
          <div className="mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff or day (e.g. monday)…"
              className="
                w-full md:w-96
                px-4 py-2
                rounded-lg
                bg-black/40
                border border-white/20
                focus:outline-none
                focus:ring-2 focus:ring-purple-500
                text-white
              "
            />
          </div>

          {filteredRows.length === 0 && (
            <p className="text-center text-gray-400 italic">
              No staff match your search.
            </p>
          )}

          {/* CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRows.map((r) => {
              const weekly = r.availability?.weekly || {};
             const filterType = getFilter(r.id);

const consolidatedSchedules = r.clients
  .flatMap((client) =>
    client.schedules.map((schedule) => ({
      ...schedule,
      client,
      sortIndex: getDaySortIndex(schedule),
    }))
  )
  .filter((s) => {
    if (filterType === "all") return true;

    if (filterType === "one_time")
      return s.recurrence_type === "one_time";

    return s.recurrence_type !== "one_time";
  })
  .sort((a, b) => a.sortIndex - b.sortIndex);

              return (
                <div
                  key={`${r.type}-${r.id}`}
                  className="
                    rounded-2xl
                    bg-white/5
                    border border-white/10
                    backdrop-blur-md
                    p-5
                    space-y-4
                    shadow-lg
                    hover:shadow-purple-500/10
                    transition
                  "
                >
                  {/* HEADER */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {r.photo_url ? (
                        <img
                          src={r.photo_url}
                          alt={r.display_name}
                          className="w-14 h-14 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center font-bold">
                          {r.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="font-bold text-lg">
                          {r.display_name}
                        </div>
                        <div className="text-sm text-gray-400 capitalize">
                          {r.type} {r.role ? `• ${r.role}` : ""}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setOpenTimeOffFor(
                          openTimeOffFor === r.id ? null : r.id
                        )
                      }
                      className="
                        text-xs px-3 py-1
                        rounded-full
                        bg-red-500/20
                        border border-red-400/40
                        text-red-300
                        hover:bg-red-500/30
                        transition
                      "
                    >
                      🛑 Time Off
                    </button>
                  </div>

                  {/* AVAILABILITY */}
                  <div>
                    <h4 className="font-semibold text-center mb-2 text-gray-200">
                      🕒 Availability
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {DAYS.map((day) => {
                        const slot = weekly[day];

                        return (
                          <div
                            key={day}
                            className="
                              rounded-lg p-2
                              bg-white/5
                              border border-white/10
                            "
                          >
                            <div className="font-semibold capitalize text-gray-300">
                              {day}
                            </div>

                            {slot?.start && slot?.end ? (
                              <div className="text-gray-200">
                                {formatTime(slot.start)} – {formatTime(slot.end)}
                              </div>
                            ) : (
                              <div className="text-gray-500 italic">
                                Unavailable
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CLIENTS */}
                  <div>
<div className="flex items-center justify-between mb-2">
  <h4 className="font-semibold text-gray-200">
    🏠 Assigned Clients
  </h4>

  <button
    onClick={() => cycleFilter(r.id)}
    className="
      px-3 py-1
      text-xs
      rounded-full
      border
      transition-all
      bg-purple-600/20
      border-purple-400/40
      text-purple-200
      hover:bg-purple-600/40
    "
  >
    {getFilter(r.id) === "all" && "All"}
    {getFilter(r.id) === "recurring" && " Recurring"}
    {getFilter(r.id) === "one_time" && " One-Time"}
  </button>
</div>
                    {consolidatedSchedules.length === 0 ? (
                      <p className="text-gray-500 italic text-xs">
                        No assigned clients
                      </p>
                    ) : (
                      <ul className="text-xs mt-2 space-y-2">
                        {consolidatedSchedules.map((s) => (
                          <li
                            key={s.id}
                            className="
                              rounded-lg p-2
                              bg-white/5
                              border border-white/10
                            "
                          >
                            <div className="font-semibold">
                              {s.client.first_name} {s.client.last_name}
                            </div>

                            <div>
                              {formatRecurrence(s.recurrence_type)}
                              {getDayLabel(s) && (
                                <span className="capitalize">
                                  {" "}• {getDayLabel(s)}
                                </span>
                              )}
                            </div>

                            <div className="text-gray-400">
                              {formatTime(s.start_time)} →{" "}
                              {formatTime(s.end_time)}
                            </div>

                            <div className="text-gray-500 italic">
                              {s.recurrence_type === "one_time"
                                ? `Service Date ${formatDate(
                                    s.starts_on || s.start_date
                                  )}`
                                : `Starts ${formatDate(s.starts_on)}`}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* TIME OFF PREVIEW */}
                  {openTimeOffFor === r.id && (
                    <div className="border-t border-white/10 pt-3">
                      <TimeOffPreview
                        authAxios={authAxios}
                        owner={{ id: r.id, type: r.type }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
  </>
);
}

