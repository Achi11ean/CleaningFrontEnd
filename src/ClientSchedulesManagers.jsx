import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import SchedulesMiniCalendar from "./SchedulesMiniCalendar";
import AssignClients from "./AssignClients";
import Exceptions from "./Exceptions";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/* ------------------------------------------------------------------ */
/*  Inline line-icons (no external dependency, inherit currentColor)    */
/* ------------------------------------------------------------------ */
function Icon({ children, className = "w-4 h-4", ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

const SearchIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" />
  </Icon>
);
const CalendarIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="17" rx="2.5" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Icon>
);
const CalendarDaysIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="17" rx="2.5" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M7.5 14h.01M12 14h.01M16.5 14h.01M7.5 17.5h.01M12 17.5h.01" />
  </Icon>
);
const ClockIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 1.75" />
  </Icon>
);
const UsersIcon = (p) => (
  <Icon {...p}>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="9" cy="7" r="3.5" />
    <path d="M22 20v-1.5a4 4 0 0 0-3-3.87" />
    <path d="M16 3.63a4 4 0 0 1 0 6.74" />
  </Icon>
);
const PencilIcon = (p) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
);
const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
);
const XIcon = (p) => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);
const ChevronRightIcon = (p) => (
  <Icon {...p}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);
const RepeatIcon = (p) => (
  <Icon {...p}>
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </Icon>
);
const ArrowRightIcon = (p) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

/* ------------------------------------------------------------------ */
/*  Status theming                                                      */
/* ------------------------------------------------------------------ */
const STATUS_STYLES = {
  active: { bar: "bg-emerald-500", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  paused: { bar: "bg-amber-500", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700 ring-amber-600/15" },
  ended: { bar: "bg-slate-300", dot: "bg-slate-400", pill: "bg-slate-100 text-slate-600 ring-slate-500/15" },
};
const statusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.ended;

/* ------------------------------------------------------------------ */
/*  Pure helpers (no component state)                                   */
/* ------------------------------------------------------------------ */
const getCleanerName = (c) => {
  if (c.profile?.first_name || c.profile?.last_name) {
    return `${c.profile?.first_name || ""} ${c.profile?.last_name || ""}`.trim();
  }
  return c.username;
};

const getDayOfWeekFromDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const jsDay = date.getDay(); // 0 = Sunday
  return jsDay === 0 ? 6 : jsDay - 1; // convert to Monday = 0
};

const formatLocalDate = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return new Date(year, month - 1, day).toLocaleDateString();
};

const formatTime12 = (time24) => {
  if (!time24) return "";
  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
};

/* Shared field styling for the edit modal */
const LABEL_CLS = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";
const FIELD_CLS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10";

export default function ClientSchedulesManagers() {
  const { authAxios } = useStaff(); // 👈 DIFFERENCE: useStaff instead of useAdmin

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [exceptionCtx, setExceptionCtx] = useState(null);
  const [actionCtx, setActionCtx] = useState(null);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const normalizedSearch = search.trim().toLowerCase();

  /* --- search matchers (depend on the current search term) --- */
  const dayMatches = (schedule) => {
    if (schedule.day_of_week == null) return false;
    const dayName = DAY_NAMES[schedule.day_of_week]?.toLowerCase();
    return dayName?.includes(normalizedSearch);
  };

  const clientMatches = (schedule) => {
    const name = `${schedule.client?.first_name || ""} ${schedule.client?.last_name || ""}`.toLowerCase();
    return name.includes(normalizedSearch);
  };

  const cleanerMatches = (schedule) => {
    return schedule.client?.cleaners?.some((c) => {
      const name = getCleanerName(c).toLowerCase();
      return name.includes(normalizedSearch);
    });
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get("/schedules"); // same endpoint
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
      day_of_week: getDayOfWeekFromDate(s.start_date),
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
    return clientMatches(s) || cleanerMatches(s) || dayMatches(s);
  });

  /* --------------------------- states --------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-500" />
          <p className="text-sm font-medium">Loading schedules…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-rose-200 bg-rose-50/70 px-6 py-8 text-center">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <p className="mt-1 text-xs text-rose-600/80">Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            loadSchedules();
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-rose-700 shadow-sm ring-1 ring-inset ring-rose-200 transition hover:bg-rose-100"
        >
          Try again
        </button>
      </div>
    );
  }

  /* --------------------------- render --------------------------- */
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ============================ HEADER ============================ */}
      <header className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
              <CalendarDaysIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Client Schedules
                </h2>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-600 ring-1 ring-inset ring-indigo-600/15">
                  Manager
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                Manage recurring cleanings, exceptions, and crew assignments.
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, cleaner, or day (e.g. Monday)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* ==================== ACTION MODAL (recurring) ==================== */}
      {actionCtx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
            {/* HEADER */}
            <div className="flex items-start gap-3.5 border-b border-slate-100 px-6 pt-6 pb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                  Modify scheduled cleaning
                </h3>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {actionCtx.schedule.client?.first_name}{" "}
                  {actionCtx.schedule.client?.last_name}
                </p>
              </div>
            </div>

            {/* BODY */}
            <div className="space-y-5 px-6 py-5">
              {/* DATE CONTEXT */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Selected date
                </p>
                <p className="mt-1 text-base font-semibold text-slate-800">
                  {actionCtx.occurrenceDate}
                </p>
              </div>

              <p className="text-sm font-medium text-slate-700">What would you like to do?</p>

              {/* ACTIONS */}
              <div className="space-y-3">
                {/* EDIT ENTIRE SCHEDULE */}
                <button
                  type="button"
                  onClick={() => {
                    startEdit(actionCtx.schedule);
                    setActionCtx(null);
                  }}
                  className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <PencilIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800">
                      Edit entire schedule
                    </span>
                    <span className="block text-xs text-slate-500">
                      Update recurrence, time, or details
                    </span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-400" />
                </button>

                {/* MODIFY SINGLE DATE */}
                <button
                  type="button"
                  onClick={() => {
                    setExceptionCtx(actionCtx);
                    setActionCtx(null);
                  }}
                  className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-amber-300 hover:bg-amber-50/50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <CalendarIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800">
                      Modify this date only
                    </span>
                    <span className="block text-xs text-slate-500">
                      Cancel or reschedule just this occurrence
                    </span>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-slate-300 transition group-hover:text-amber-400" />
                </button>
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                onClick={() => setActionCtx(null)}
                className="w-full rounded-lg py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= CALENDAR PANEL ======================= */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-slate-700">
          <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Calendar
          </h3>
        </div>

        <SchedulesMiniCalendar
          schedules={filteredSchedules}
          onEdit={(ctx) => {
            // 🚫 One-time schedules cannot use exceptions
            if (ctx.schedule.schedule_type === "one_time") {
              startEdit(ctx.schedule); // 👈 auto-open edit modal
              return;
            }
            // 🔁 Recurring schedules get options modal
            setActionCtx(ctx);
          }}
          onDelete={deleteSchedule}
        />
      </section>

      {/* ======================= EXCEPTIONS MODAL ======================= */}
      {exceptionCtx && (
        <Exceptions
          schedule={exceptionCtx.schedule}
          occurrenceDate={exceptionCtx.occurrenceDate}
          exceptionId={exceptionCtx.exceptionId} // 👈 ADD
          isException={exceptionCtx.isException} // 👈 ADD
          onClose={() => setExceptionCtx(null)}
          onSuccess={loadSchedules}
        />
      )}

      {/* ========================= SCHEDULE GRID ========================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            All schedules
          </h3>
          {schedules.length > 0 && (
            <span className="text-xs font-medium text-slate-400">
              {filteredSchedules.length} shown
            </span>
          )}
        </div>

        {/* Empty: nothing created yet */}
        {schedules.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200">
              <CalendarDaysIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-600">No schedules yet</p>
            <p className="mt-1 text-xs text-slate-400">New schedules will appear here once created.</p>
          </div>
        )}

        {/* Empty: nothing matches the current search */}
        {schedules.length > 0 && filteredSchedules.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200">
              <SearchIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-600">No matches found</p>
            <p className="mt-1 text-xs text-slate-400">
              Nothing matches “{search}”. Try a different name or day.
            </p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Cards */}
        {filteredSchedules.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSchedules.map((s) => {
              const st = statusStyle(s.status);
              return (
                <div
                  key={s.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  {/* status accent bar (encodes schedule status) */}
                  <span className={`absolute inset-y-0 left-0 w-1 ${st.bar}`} aria-hidden="true" />

                  <div className="flex flex-1 flex-col gap-4 p-5 pl-6">
                    {/* CLIENT + STATUS */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate text-base font-semibold tracking-tight text-slate-900">
                          {s.client?.first_name} {s.client?.last_name}
                        </h4>
                        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
                          <RepeatIcon className="h-3 w-3 text-slate-400" />
                          {s.schedule_type.replace("_", " ")}
                        </span>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${st.pill}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {s.status}
                      </span>
                    </div>

                    {/* META: date/day + time */}
                    <div className="space-y-2.5 text-sm text-slate-600">
                      <div className="flex items-center gap-2.5">
                        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {s.start_date ? (
                            <>
                              {formatLocalDate(s.start_date)}
                              <span className="mx-1.5 text-slate-300">·</span>
                              {DAY_NAMES[getDayOfWeekFromDate(s.start_date)]}
                            </>
                          ) : (
                            <span className="text-slate-400">No start date</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="inline-flex items-center gap-2">
                          {formatTime12(s.start_time)}
                          <ArrowRightIcon className="h-3.5 w-3.5 text-slate-300" />
                          {formatTime12(s.end_time)}
                        </span>
                      </div>
                    </div>

                    {/* ASSIGNED CLEANERS */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Assigned cleaners
                      </div>

                      {s.client?.cleaners?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {s.client.cleaners.map((c) => (
                            <div
                              key={c.assignment_id}
                              className="flex items-center gap-1.5 rounded-full bg-slate-50 py-1 pl-1 pr-2.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                            >
                              {c.profile?.photo_url ? (
                                <img
                                  src={c.profile.photo_url}
                                  alt=""
                                  className="h-5 w-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                                  {getCleanerName(c)[0]}
                                </div>
                              )}
                              <span>{getCleanerName(c)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs italic text-slate-400">No cleaners assigned</div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-auto flex gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSchedule(s.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================== EDIT MODAL ========================== */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <PencilIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                    Edit schedule
                  </h3>
                  {editing?.client && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {editing.client.first_name} {editing.client.last_name}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* BODY (scrollable) */}
            <div className="flex-1 space-y-6 overflow-auto px-6 py-5">
              {/* ASSIGN CLEANERS */}
              {editing?.client && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center gap-2 text-slate-700">
                    <UsersIcon className="h-4 w-4 text-slate-500" />
                    <h4 className="text-sm font-semibold">Assign cleaners</h4>
                  </div>

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

              {/* FORM */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={LABEL_CLS}>Schedule type</label>
                  <select
                    value={editForm.schedule_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setEditForm({
                        ...editForm,
                        schedule_type: type,
                        day_of_week: type === "one_time" ? null : editForm.day_of_week,
                      });
                    }}
                    className={FIELD_CLS}
                  >
                    <option value="one_time">One Time</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLS}>Start date</label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => {
                      const date = e.target.value;
                      let day = editForm.day_of_week;

                      if (date && editForm.schedule_type !== "one_time") {
                        const [year, month, dayNum] = date.split("-").map(Number);
                        const jsDay = new Date(year, month - 1, dayNum).getDay();
                        day = jsDay === 0 ? 6 : jsDay - 1;
                      }

                      setEditForm({
                        ...editForm,
                        start_date: date,
                        day_of_week: day,
                      });
                    }}
                    className={FIELD_CLS}
                  />
                </div>

                {/* DAY OF WEEK (DERIVED FROM START DATE) */}
                {editForm.schedule_type !== "one_time" && (
                  <div>
                    <label className={LABEL_CLS}>Day of week</label>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600">
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                      {editForm.start_date
                        ? DAY_NAMES[getDayOfWeekFromDate(editForm.start_date)]
                        : "Select a start date"}
                    </div>
                  </div>
                )}

                <div>
                  <label className={LABEL_CLS}>Start time</label>
                  <input
                    type="time"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    className={FIELD_CLS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>End time</label>
                  <input
                    type="time"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    className={FIELD_CLS}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={LABEL_CLS}>Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className={`${FIELD_CLS} resize-none`}
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className={FIELD_CLS}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveEdit}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-700"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}