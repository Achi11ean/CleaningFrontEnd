import React, { useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  addWeeks,
  addMonths,
  isAfter,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useAdmin } from "./AdminContext";
import CalendarAssign from "./CalendarAssign";
import AdminStartShift from "./AdminStartShift";
import AdminActiveShiftPanel from "./AdminActiveShiftPanel";

/* ------------------------------------------------------------------ */
/*  Setup                                                              */
/* ------------------------------------------------------------------ */

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EVENT_COLORS = {
  mine: "#10b981", // emerald  – shifts assigned to me
  other: "#3b82f6", // blue     – other admins' shifts
  consultation: "#ec4899", // pink     – consultations
  timeOff: "#ef4444", // red      – time off
};

/* ------------------------------------------------------------------ */
/*  Pure helpers (no state → live outside the component)              */
/* ------------------------------------------------------------------ */

const getGoogleMapsLink = (address) =>
  address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

const getTelLink = (phone) =>
  phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

const formatDateTime = (date) => format(date, "EEEE, MMM d • h:mm a");

function formatTo12Hour(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, "h:mm a");
}

function formatScheduleType(t) {
  if (!t) return "—";
  const map = {
    one_time: "One Time",
    weekly: "Weekly",
    bi_weekly: "Bi-Weekly",
    monthly: "Monthly",
  };
  return (
    map[t] || t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

const isMobileWidth = () =>
  typeof window !== "undefined" && window.innerWidth < 640;

// Day-name header format (S M T… on mobile, SUN MON… on desktop)
const dayFormat = (date) =>
  isMobileWidth() ? format(date, "EEEEE") : format(date, "EEE").toUpperCase();

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/* ------------------------------------------------------------------ */
/*  Recurring schedule → calendar events                              */
/* ------------------------------------------------------------------ */

function expandSchedules(schedules, rangeStart, rangeEnd) {
  
  const events = [];

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  schedules.forEach((s) => {
    if (s.status !== "active") return;

    const hasExceptions =
      Array.isArray(s.exceptions) && s.schedule_type !== "one_time";

    const canceledDates = new Set();
    const replacementsByDate = {};

    if (hasExceptions) {
      s.exceptions.forEach((ex) => {
        if (ex.original_date) canceledDates.add(ex.original_date);
        if (ex.replacement_date) replacementsByDate[ex.replacement_date] = ex;
      });
    }

    const startDate = parseLocalDate(s.start_date);
    if (!startDate) return;

    const makeEvent = (date, ex = null) => {
      const start = new Date(date);
      const end = new Date(date);

      const startTime = ex?.start_time ?? s.start_time;
      const endTime = ex?.end_time ?? s.end_time;

      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);

      start.setHours(sh, sm, 0, 0);
      end.setHours(eh, em, 0, 0);

      events.push({
        id: `${s.id}-${format(start, "yyyy-MM-dd")}`,
        title: `${s.client.first_name} ${s.client.last_name}`,
        start,
        end,
        resource: s,
        isException: Boolean(ex),
        exceptionId: ex?.id ?? null,
      });
    };

    // One-time
    if (s.schedule_type === "one_time") {
      makeEvent(startDate);
      return;
    }

    // Recurring
    let cursor = new Date(startDate);

    if (s.day_of_week !== null) {
      while (cursor.getDay() !== (s.day_of_week + 1) % 7) {
        cursor = addDays(cursor, 1);
      }
    }

    while (!isAfter(cursor, rangeEnd)) {
      const dateKey = format(cursor, "yyyy-MM-dd");

      if (!isAfter(rangeStart, cursor) && !canceledDates.has(dateKey)) {
        makeEvent(cursor);
      }

      if (s.schedule_type === "weekly") cursor = addWeeks(cursor, 1);
      else if (s.schedule_type === "bi_weekly") cursor = addWeeks(cursor, 2);
      else if (s.schedule_type === "monthly") cursor = addMonths(cursor, 1);
      else break;
    }

    // Injected reschedules
    Object.entries(replacementsByDate).forEach(([dateStr, ex]) => {
      const d = parseLocalDate(dateStr);
      if (d && d >= rangeStart && d <= rangeEnd) makeEvent(d, ex);
    });
  });

  return events;
}

/* ------------------------------------------------------------------ */
/*  Time-off requests → calendar events                               */
/* ------------------------------------------------------------------ */

function expandTimeOffRequests(rows) {
  const events = [];

  rows.forEach((r) => {
    const name = r.owner?.display_name || "Unknown";

    (r.entries || []).forEach((e, idx) => {
      const base = new Date(`${e.request_date}T00:00:00`);
      const start = new Date(base);
      const end = new Date(base);

      if (e.is_all_day) {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 0, 0);
      } else {
        const [sh, sm] = e.start_time.split(":").map(Number);
        const [eh, em] = e.end_time.split(":").map(Number);
        start.setHours(sh, sm, 0, 0);
        end.setHours(eh, em, 0, 0);
      }

      events.push({
        id: `timeoff-${r.id}-${idx}`,
        title: name,
        start,
        end,
        allDay: e.is_all_day,
        resource: { type: "time_off", request: r, entry: e },
      });
    });
  });

  return events;
}

/* ------------------------------------------------------------------ */
/*  Small inline icons (no extra dependency)                          */
/* ------------------------------------------------------------------ */

const Icon = ({ path, className = "h-4 w-4", stroke = 2 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {path}
  </svg>
);

const CalendarIcon = (p) => (
  <Icon
    {...p}
    path={
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    }
  />
);
const ClockIcon = (p) => (
  <Icon {...p} path={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />
);
const SparkleIcon = (p) => (
  <Icon
    {...p}
    path={<path d="M12 3l1.6 4.8L18 9.4l-4.4 1.6L12 16l-1.6-5L6 9.4l4.4-1.6z" />}
  />
);
const MapPinIcon = (p) => (
  <Icon {...p} path={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></>} />
);
const PhoneIcon = (p) => (
  <Icon {...p} path={<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.8 2z" />} />
);
const BanIcon = (p) => (
  <Icon {...p} path={<><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>} />
);
const ChevronIcon = (p) => <Icon {...p} path={<path d="M6 9l6 6 6-6" />} />;
const ArrowIcon = (p) => (
  <Icon {...p} path={<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>} />
);

/* ------------------------------------------------------------------ */
/*  Presentational bits                                               */
/* ------------------------------------------------------------------ */

const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:ring-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400";

function Legend() {
  const items = [
    ["Your shifts", EVENT_COLORS.mine],
    ["Other shifts", EVENT_COLORS.other],
    ["Consultations", EVENT_COLORS.consultation],
    ["Time off", EVENT_COLORS.timeOff],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-sm text-slate-800">{children}</span>
    </div>
  );
}

function Modal({ onClose, accent, icon, title, children, footer }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm rbc-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rbc-modal-pop w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            {icon}
          </span>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          {children}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  react-big-calendar restyle + tiny animations                     */
/* ------------------------------------------------------------------ */

const RBC_STYLES = `
.rbc-modern .rbc-toolbar { display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; justify-content:space-between; margin-bottom:1rem; }
.rbc-modern .rbc-toolbar-label { font-weight:700; font-size:1.05rem; color:#0f172a; letter-spacing:-.01em; }
.rbc-modern .rbc-btn-group { display:inline-flex; gap:.35rem; }
.rbc-modern .rbc-toolbar button { color:#475569; border:1px solid #e2e8f0; background:#fff; border-radius:.6rem; padding:.4rem .85rem; font-weight:600; font-size:.78rem; transition:all .15s ease; box-shadow:0 1px 2px rgba(15,23,42,.04); }
.rbc-modern .rbc-toolbar button:hover { background:#f8fafc; border-color:#cbd5e1; color:#0f172a; }
.rbc-modern .rbc-toolbar button:focus-visible { outline:2px solid #a5b4fc; outline-offset:1px; }
.rbc-modern .rbc-toolbar button.rbc-active,
.rbc-modern .rbc-toolbar button.rbc-active:hover { background:#4f46e5 !important; border-color:#4f46e5 !important; color:#fff !important; box-shadow:0 2px 6px rgba(79,70,229,.35); }

.rbc-modern .rbc-month-view, .rbc-modern .rbc-time-view { border:1px solid #eef2f6; border-radius:1rem; overflow:hidden; background:#fff; }
.rbc-modern .rbc-header { padding:.65rem 0; font-weight:700; font-size:.68rem; letter-spacing:.06em; color:#64748b; text-transform:uppercase; border-bottom:1px solid #f1f5f9; }
.rbc-modern .rbc-header + .rbc-header { border-left:1px solid #f1f5f9; }
.rbc-modern .rbc-month-row + .rbc-month-row { border-top:1px solid #f1f5f9; }
.rbc-modern .rbc-day-bg + .rbc-day-bg { border-left:1px solid #f1f5f9; }
.rbc-modern .rbc-off-range-bg { background:#fafbfc; }
.rbc-modern .rbc-off-range { color:#cbd5e1; }
.rbc-modern .rbc-date-cell { padding:.35rem .5rem; font-size:.78rem; font-weight:600; color:#475569; }
.rbc-modern .rbc-today { background:#eef2ff; }
.rbc-modern .rbc-now .rbc-button-link { color:#4f46e5; font-weight:800; }
.rbc-modern .rbc-event { border:1px solid transparent; border-radius:.5rem; padding:2px 6px; font-size:.72rem; font-weight:600; box-shadow:0 1px 2px rgba(15,23,42,.12); }
.rbc-modern .rbc-event:focus, .rbc-modern .rbc-event:focus-visible { outline:none; }
.rbc-modern .rbc-event.rbc-selected { box-shadow:0 0 0 2px #fff, 0 3px 8px rgba(15,23,42,.25); }
.rbc-modern .rbc-show-more { color:#4f46e5; font-weight:700; font-size:.7rem; background:transparent; }
.rbc-modern .rbc-time-content, .rbc-modern .rbc-time-header-content, .rbc-modern .rbc-timeslot-group { border-color:#f1f5f9; }
.rbc-modern .rbc-current-time-indicator { background:#ef4444; height:2px; }

@keyframes rbcFadeIn { from { opacity:0 } to { opacity:1 } }
@keyframes rbcModalPop { from { opacity:0; transform:translateY(8px) scale(.985) } to { opacity:1; transform:translateY(0) scale(1) } }
.rbc-fade-in { animation: rbcFadeIn .15s ease-out; }
.rbc-modal-pop { animation: rbcModalPop .18s cubic-bezier(.16,1,.3,1); }

@media (prefers-reduced-motion: reduce) {
  .rbc-fade-in, .rbc-modal-pop { animation: none; }
  .rbc-modern .rbc-toolbar button { transition: none; }
}
`;

/* ================================================================== */
/*  Main component                                                    */
/* ================================================================== */

export default function ClientSchedulesCalendar() {
  const { authAxios, admin } = useAdmin();
  const myAdminId = admin?.id;
  const isMobile = useIsMobile();

  /* ---- data ---- */
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [timeOffRows, setTimeOffRows] = useState([]);
  const [activeShift, setActiveShift] = useState(null);

  /* ---- ui ---- */
  const [loading, setLoading] = useState(false);
  const [checkingActiveShift, setCheckingActiveShift] = useState(true);
  const [timeOffLoading, setTimeOffLoading] = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week
  const [showTimeOff, setShowTimeOff] = useState(false);

  /* ---- selections / modals ---- */
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [selectedTimeOff, setSelectedTimeOff] = useState(null);

  /* ---------------------------------------------------------------- */
  /*  Data loading                                                    */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await authAxios.get("/schedules");
        setSchedules(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authAxios]);

  useEffect(() => {
    Promise.all([authAxios.get("/staff/all"), authAxios.get("/admin/all")])
      .then(([staffRes, adminRes]) => {
        setStaffList(staffRes.data || []);
        setAdminList(adminRes.data || []);
      })
      .catch(console.error);
  }, [authAxios]);

  useEffect(() => {
    authAxios
      .get("/appointments")
      .then((res) => setAppointments(res.data || []))
      .catch((err) => console.error("Failed to load consultations", err));
  }, [authAxios]);

  useEffect(() => {
    const loadActiveShift = async () => {
      try {
        setCheckingActiveShift(true);
        const res = await authAxios.get("/admin/shifts/active");
        setActiveShift(res.data?.active ? res.data.shift : null);
      } catch (err) {
        console.error("Failed to load active shift", err);
        setActiveShift(null);
      } finally {
        setCheckingActiveShift(false);
      }
    };
    loadActiveShift();
  }, [authAxios]);

  /* ---------------------------------------------------------------- */
  /*  Actions                                                         */
  /* ---------------------------------------------------------------- */

  const refetchSchedules = async () => {
    const res = await authAxios.get("/schedules");
    setSchedules(res.data || []);
  };

const handleAssignCleaner = async (payload) => {
  if (!selectedEvent) return;

  await authAxios.post(
    `/clients/${selectedEvent.client.id}/assign-one`,
    payload
  );

  await refetchSchedules();
};
const handleRemoveCleaner = async (assignment) => {
  if (!selectedEvent) return;

  if (!window.confirm(`Unassign ${assignment.username}?`)) return;

  try {
    await authAxios.delete(
      `/clients/${selectedEvent.client.id}/assignments/${assignment.assignment_id}`
    );

    await refetchSchedules();

    // Refresh the modal with the latest client data
    setSelectedEvent((prev) => {
      if (!prev) return null;

      const updatedSchedule = schedules.find(
        (s) => s.id === prev.id
      );

      return updatedSchedule || prev;
    });
  } catch (err) {
    console.error(err);
    alert(
      err.response?.data?.error || "Failed to remove assignment."
    );
  }
};
  const toggleTimeOff = async () => {
    const next = !showTimeOff;
    setShowTimeOff(next);
    if (next && timeOffRows.length === 0) {
      try {
        setTimeOffLoading(true);
        const res = await authAxios.get("/time-off/all");
        setTimeOffRows(res.data || []);
      } finally {
        setTimeOffLoading(false);
      }
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Derived values                                                  */
  /* ---------------------------------------------------------------- */

  const isAssignedToMe = (schedule) => {
    if (!schedule?.client?.cleaners || !myAdminId) return false;
    return schedule.client.cleaners.some(
      (c) => c.type === "admin" && c.id === myAdminId,
    );
  };

  const scheduleEvents = useMemo(() => {
    const rangeStart = addDays(new Date(), -60);
    const rangeEnd = addDays(new Date(), 180);
    return expandSchedules(schedules, rangeStart, rangeEnd);
  }, [schedules]);

  const consultationEvents = useMemo(
    () =>
      appointments
        .filter((a) => a.scheduled_for)
        .map((a) => {
          const start = new Date(a.scheduled_for);
          const end = new Date(start);
          end.setHours(end.getHours() + 1); // default 1h consultation
          return {
            id: `consult-${a.id}`,
            title: a.client_name,
            start,
            end,
            resource: { type: "consultation", appointment: a },
          };
        }),
    [appointments],
  );

  const timeOffEvents = useMemo(
    () => (showTimeOff ? expandTimeOffRequests(timeOffRows) : []),
    [showTimeOff, timeOffRows],
  );

  const allEvents = useMemo(
    () => [...scheduleEvents, ...consultationEvents, ...timeOffEvents],
    [scheduleEvents, consultationEvents, timeOffEvents],
  );

  const nextShift = useMemo(() => {
    const now = new Date();
    return (
      scheduleEvents
        .filter((e) => isAssignedToMe(e.resource) && e.start > now)
        .sort((a, b) => a.start - b.start)[0] || null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleEvents, myAdminId]);

  const nextConsultation = useMemo(() => {
    const now = new Date();
    return (
      appointments
        .filter((a) => {
          if (!a.scheduled_for) return false;
          const assignedToMe =
            a.assigned_user_type === "admin" &&
            a.assigned_user_id === myAdminId;
          return assignedToMe && new Date(a.scheduled_for) > now;
        })
        .sort(
          (a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for),
        )[0] || null
    );
  }, [appointments, myAdminId]);

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset],
  );
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  const myWeeklyEvents = useMemo(
    () =>
      scheduleEvents
        .filter(
          (e) =>
            isAssignedToMe(e.resource) &&
            e.start >= weekStart &&
            e.start < weekEnd,
        )
        .sort((a, b) => a.start - b.start),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scheduleEvents, weekStart, weekEnd, myAdminId],
  );

  /* ---------------------------------------------------------------- */
  /*  Event handlers shared by calendar + mobile agenda               */
  /* ---------------------------------------------------------------- */

  const handleSelectEvent = (event) => {
    const type = event?.resource?.type;
    if (type === "consultation") return setSelectedConsultation(event.resource.appointment);
    if (type === "time_off") return setSelectedTimeOff(event.resource);
    setSelectedEvent(event.resource);
  };

  const eventColor = (event) => {
    const type = event?.resource?.type;
    if (type === "consultation") return EVENT_COLORS.consultation;
    if (type === "time_off") return EVENT_COLORS.timeOff;
    return isAssignedToMe(event.resource) ? EVENT_COLORS.mine : EVENT_COLORS.other;
  };

  const eventPropGetter = (event) => {
    const backgroundColor = eventColor(event);
    const style = {
      backgroundColor,
      color: "#fff",
      borderRadius: "0.5rem",
      fontWeight: 600,
    };
    if (event?.resource?.type === "consultation")
      style.boxShadow = "0 1px 6px rgba(236,72,153,0.45)";
    return { style };
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-6 text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
        Loading calendar…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <style>{RBC_STYLES}</style>

      {/* ---------------------------- Header ---------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Cleaning Schedule
            </h2>
            <p className="text-sm text-slate-500">
              Your shifts, consultations, and team time off at a glance.
            </p>
          </div>
        </div>
        <Legend />
      </div>

      {/* ------------------------- Summary cards ------------------------ */}
      {!checkingActiveShift && (nextShift || nextConsultation) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Next shift */}
          {nextShift && (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <ClockIcon />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                    Your next admin shift
                  </p>
                  <p className="text-base font-bold text-emerald-900">
                    {formatDateTime(nextShift.start)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {nextShift.resource.client.first_name}{" "}
                  {nextShift.resource.client.last_name}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  {formatTo12Hour(nextShift.resource.start_time)} →{" "}
                  {formatTo12Hour(nextShift.resource.end_time)}
                </span>
              </div>

              <button
                onClick={() => setSelectedEvent(nextShift.resource)}
                className={`mt-4 ${btnGhost}`}
              >
                View details <ArrowIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Next consultation */}
          {nextConsultation && (
            <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600">
                  <SparkleIcon />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-pink-600">
                    Next consultation
                  </p>
                  <p className="text-base font-bold text-pink-900">
                    {format(
                      new Date(nextConsultation.scheduled_for),
                      "EEEE, MMM d • h:mm a",
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <p className="text-sm font-semibold text-slate-800">
                  {nextConsultation.client_name}
                </p>

                {nextConsultation.client_address && (
                  <a
                    href={getGoogleMapsLink(nextConsultation.client_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                  >
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {nextConsultation.client_address}
                  </a>
                )}

                {nextConsultation.client_phone && (
                  <a
                    href={getTelLink(nextConsultation.client_phone)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
                  >
                    <PhoneIcon className="h-3.5 w-3.5" />
                    {nextConsultation.client_phone}
                  </a>
                )}

                {nextConsultation.notes && (
                  <p className="text-sm italic text-slate-500">
                    {nextConsultation.notes}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedConsultation(nextConsultation)}
                className={`mt-4 ${btnGhost}`}
              >
                View details <ArrowIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------------- Weekly schedule ------------------------ */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setShowWeekly((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-indigo-500" />
            My weekly admin schedule
          </span>
          <ChevronIcon
            className={`h-4 w-4 text-slate-400 transition-transform ${
              showWeekly ? "rotate-180" : ""
            }`}
          />
        </button>

        {showWeekly && (
          <div className="space-y-3 border-t border-slate-100 p-4">
            {/* Week nav */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className={btnGhost}
              >
                ◀ Prev
              </button>
              <div className="text-sm font-semibold text-slate-700">
                {format(weekStart, "MMM d")} –{" "}
                {format(addDays(weekStart, 6), "MMM d, yyyy")}
              </div>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className={btnGhost}
              >
                Next ▶
              </button>
            </div>

            {/* Week list */}
            {myWeeklyEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
                No assigned admin shifts this week.
              </div>
            ) : (
              <div className="space-y-2">
                {myWeeklyEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800">
                        {format(e.start, "EEEE, MMM d")}
                      </div>
                      <div className="text-sm font-medium text-emerald-700">
                        {format(e.start, "h:mm a")} → {format(e.end, "h:mm a")}
                      </div>
                      <div className="truncate text-sm text-slate-500">
                        {e.resource.client.first_name}{" "}
                        {e.resource.client.last_name}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEvent(e.resource)}
                      className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------------- Time-off toggle ------------------------ */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <BanIcon className="h-4 w-4 text-red-500" />
          Time off overlay
        </div>
        <button
          onClick={toggleTimeOff}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 ${
            showTimeOff
              ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-300"
          }`}
        >
          {showTimeOff ? "Hide time off" : "Show time off"}
        </button>
      </div>

      {timeOffLoading && (
        <p className="px-2 text-sm italic text-slate-500">Loading time off…</p>
      )}

      {/* ------------------- Calendar (or mobile agenda) --------------- */}
      {isMobile ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <MobileAgenda
            events={allEvents}
            onSelectEvent={handleSelectEvent}
            getColor={eventColor}
          />
        </div>
      ) : (
        <div
          className="rbc-modern rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ height: 720 }}
        >
          <Calendar
            localizer={localizer}
            events={allEvents}
            startAccessor="start"
            endAccessor="end"
            defaultView="month"
            views={["month", "week", "day"]}
            popup
            selectable
            formats={{
              dayFormat,
              // Hide the time prefix in event labels
              eventTimeRangeFormat: () => "",
              eventTimeRangeStartFormat: () => "",
              eventTimeRangeEndFormat: () => "",
            }}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
          />
        </div>
      )}

      {/* ============================ MODALS =========================== */}

      {/* Client detail */}
      {selectedEvent && (
        <Modal
          onClose={() => setSelectedEvent(null)}
          accent={EVENT_COLORS.mine}
          icon={<CalendarIcon />}
          title="Client details"
          footer={
            <button onClick={() => setSelectedEvent(null)} className={btnGhost}>
              Close
            </button>
          }
        >
       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

  <Field label="Client">
    {selectedEvent.client.first_name} {selectedEvent.client.last_name}
  </Field>

  <Field label="Status">
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold
      ${
        selectedEvent.status === "active"
          ? "bg-emerald-100 text-emerald-700"
          : selectedEvent.status === "paused"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {selectedEvent.status.toUpperCase()}
    </span>
  </Field>

  <Field label="Schedule Type">
    {formatScheduleType(selectedEvent.schedule_type)}
  </Field>

  <Field label="Cleaning Date">
    {selectedEvent.start_date
      ? format(
          new Date(selectedEvent.start_date + "T00:00:00"),
          "EEEE, MMMM d, yyyy"
        )
      : "—"}
  </Field>

  <Field label="Time">
    {formatTo12Hour(selectedEvent.start_time)}
    {" — "}
    {formatTo12Hour(selectedEvent.end_time)}
  </Field>

  {selectedEvent.day_of_week !== null && (
    <Field label="Recurring Day">
      {[
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ][selectedEvent.day_of_week]}
    </Field>
  )}

  <div className="sm:col-span-2">
    <Field label="Address">
      {selectedEvent.client.address ? (
        <a
          href={getGoogleMapsLink(selectedEvent.client.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:underline"
        >
          📍 {selectedEvent.client.address}
        </a>
      ) : (
        "—"
      )}
    </Field>
  </div>

  {selectedEvent.client.phone && (
    <Field label="Phone">
      <a
        href={getTelLink(selectedEvent.client.phone)}
        className="font-semibold text-emerald-700 hover:underline"
      >
        📞 {selectedEvent.client.phone}
      </a>
    </Field>
  )}

  {selectedEvent.client.email && (
    <Field label="Email">
      <a
        href={`mailto:${selectedEvent.client.email}`}
        className="font-semibold text-indigo-600 hover:underline"
      >
        {selectedEvent.client.email}
      </a>
    </Field>
  )}

</div>
{selectedEvent.description && (
  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">

    <div className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-700">
      Cleaning Notes
    </div>

    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
      {selectedEvent.description}
    </p>

  </div>
)}
          <div className="border-t border-slate-100 pt-4">
<CalendarAssign
  clientId={selectedEvent.client.id}
/>
          </div>

          {isAssignedToMe(selectedEvent) && (
            <div className="border-t border-slate-100 pt-4">
              <AdminStartShift
                schedule={selectedEvent}
                onStarted={() => {
                  setSelectedEvent(null);
                }}
              />
            </div>
          )}
        </Modal>
      )}

      {/* Time off */}
      {selectedTimeOff && (
        <Modal
          onClose={() => setSelectedTimeOff(null)}
          accent={EVENT_COLORS.timeOff}
          icon={<BanIcon />}
          title="Time off request"
          footer={
            <button
              onClick={() => setSelectedTimeOff(null)}
              className={btnGhost}
            >
              Close
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name">
              {selectedTimeOff.request.owner.display_name}
            </Field>
            <Field label="Role">
              <span className="capitalize">
                {selectedTimeOff.request.owner.type}
              </span>
            </Field>
            <Field label="Status">
              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-red-700 ring-1 ring-red-100">
                {selectedTimeOff.request.status}
              </span>
            </Field>
            <Field label="Date">
              {format(
                new Date(selectedTimeOff.entry.request_date),
                "EEEE, MMM d, yyyy",
              )}
            </Field>
            <Field label="Time">
              {selectedTimeOff.entry.is_all_day
                ? "All day"
                : `${formatTo12Hour(selectedTimeOff.entry.start_time)} → ${formatTo12Hour(selectedTimeOff.entry.end_time)}`}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Reason">
                {selectedTimeOff.request.description || (
                  <span className="italic text-slate-400">
                    No reason provided
                  </span>
                )}
              </Field>
            </div>
          </div>
        </Modal>
      )}

      {/* Consultation */}
      {selectedConsultation && (
        <Modal
          onClose={() => setSelectedConsultation(null)}
          accent={EVENT_COLORS.consultation}
          icon={<SparkleIcon />}
          title="Consultation details"
          footer={
            <button
              onClick={() => setSelectedConsultation(null)}
              className={btnGhost}
            >
              Close
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Client">{selectedConsultation.client_name}</Field>
            <Field label="Date">
              {format(
                new Date(selectedConsultation.scheduled_for),
                "EEEE, MMM d • h:mm a",
              )}
            </Field>

            {selectedConsultation.client_address && (
              <div className="sm:col-span-2">
                <Field label="Address">
                  <a
                    href={getGoogleMapsLink(selectedConsultation.client_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-blue-600 hover:underline"
                  >
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {selectedConsultation.client_address}
                  </a>
                </Field>
              </div>
            )}

            {selectedConsultation.client_phone && (
              <Field label="Phone">
                <a
                  href={getTelLink(selectedConsultation.client_phone)}
                  className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline"
                >
                  <PhoneIcon className="h-3.5 w-3.5" />
                  {selectedConsultation.client_phone}
                </a>
              </Field>
            )}

            {selectedConsultation.notes && (
              <div className="sm:col-span-2">
                <Field label="Notes">{selectedConsultation.notes}</Field>
              </div>
            )}
          </div>
        </Modal>
      )}

      {!loading && <AdminActiveShiftPanel />}
    </div>
  );
}

/* ================================================================== */
/*  Mobile agenda                                                     */
/* ================================================================== */

function MobileAgenda({ events, onSelectEvent, getColor }) {
  const now = new Date();

  const grouped = useMemo(() => {
    const map = {};
    events
      .filter((e) => e.end >= now)
      .sort((a, b) => a.start - b.start)
      .forEach((e) => {
        const day = format(e.start, "yyyy-MM-dd");
        (map[day] ||= []).push(e);
      });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const days = Object.keys(grouped).sort();

  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
        No upcoming events.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {days.map((day) => (
        <div key={day}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            {format(new Date(`${day}T00:00:00`), "EEEE, MMM d")}
          </h3>

          <div className="space-y-2">
            {grouped[day].map((e) => {
              const color = getColor ? getColor(e) : EVENT_COLORS.other;
              return (
                <button
                  key={e.id}
                  onClick={() => onSelectEvent?.(e)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:border-slate-200 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  <span
                    className="h-10 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900">
                      {e.title}
                    </div>
                    <div className="text-sm text-slate-500">
                      {e.allDay
                        ? "All day"
                        : `${format(e.start, "h:mm a")} – ${format(e.end, "h:mm a")}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}