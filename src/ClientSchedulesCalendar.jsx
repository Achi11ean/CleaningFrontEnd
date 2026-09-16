import React, { useEffect, useMemo, useState, useRef } from "react";
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
import CleaningTheme from "./CleaningTheme";
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
    if (!startDate || Number.isNaN(startDate.getTime()) || !s.client || !s.start_time || !s.end_time) return;

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

    if (Number.isInteger(s.day_of_week) && s.day_of_week >= 0 && s.day_of_week <= 6) {
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

const btnGhost = "cc-button";

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
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus?.(); };
  }, []);
  return <dialog ref={dialogRef} className="cc-dialog" aria-label={title} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="cc-dialog-inner"><header><span className="cc-dialog-icon" style={{ color: accent }}>{icon}</span><h3>{title}</h3><button type="button" className="cc-icon-btn" onClick={onClose} aria-label="Close details">×</button></header><div className="cc-dialog-body">{children}</div><footer>{footer}</footer></div>
  </dialog>;
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
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [displayMode, setDisplayMode] = useState("auto");
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [loadError, setLoadError] = useState("");
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);

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
      } catch (err) {
        setLoadError("We couldn’t load the cleaning schedules. Please refresh to try again.");
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
    if (timeOffLoading) return;
    setLoadError("");
    const next = !showTimeOff;
    setShowTimeOff(next);
    if (next && timeOffRows.length === 0) {
      try {
        setTimeOffLoading(true);
        const res = await authAxios.get("/time-off/all");
        setTimeOffRows(res.data || []);
      } catch (err) {
        setShowTimeOff(false);
        setLoadError("We couldn’t load time off. Please try the overlay again.");
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
    const requestedWeek = addWeeks(new Date(), weekOffset);
    const rangeStart = new Date(Math.min(addDays(new Date(), -60), addDays(calendarDate, -42), addDays(requestedWeek, -7)));
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(Math.max(addDays(new Date(), 180), addDays(calendarDate, 42), addDays(requestedWeek, 14)));
    return expandSchedules(schedules, rangeStart, rangeEnd);
  }, [schedules, calendarDate, weekOffset]);

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
    setSelectedOccurrence(event);
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

  const visibleEvents = allEvents.filter(event => {
    const type = event.resource?.type;
    const matchesType = eventFilter === "all" || (eventFilter === "mine" && !type && isAssignedToMe(event.resource)) || (eventFilter === "consultation" && type === "consultation") || (eventFilter === "time_off" && type === "time_off");
    return matchesType && event.title.toLowerCase().includes(query.trim().toLowerCase());
  });
  const agendaMode = displayMode === "agenda" || (displayMode === "auto" && isMobile);
  return (
    <CleaningTheme className="cc-calendar">
      <style>{RBC_STYLES}{CALENDAR_STYLES}</style>
      <div className="cc-content">
      <header className="cc-header"><span className="cc-brand"><CalendarIcon/></span><div><p className="cc-eyebrow">A little planning. A beautifully clean day.</p><h2>Cleaning schedule</h2><p>Shifts, consultations & team availability.</p></div></header>
      {loadError && <div className="cc-error" role="alert">{loadError}<button type="button" onClick={() => setLoadError("")} aria-label="Dismiss error">×</button></div>}
      {loading && <p className="cc-loading" role="status">Loading your schedule…</p>}
      <div className="cc-summary">
        <article className="cc-next"><div className="cc-eyebrow"><ClockIcon/> Your next shift</div>{nextShift ? <><h3>{nextShift.title}</h3><p>{format(nextShift.start, "EEE, MMM d")} · {format(nextShift.start, "h:mm a")} – {format(nextShift.end, "h:mm a")}</p><button type="button" className="cc-link" onClick={() => handleSelectEvent(nextShift)}>View shift <ArrowIcon/></button></> : <p>{loading ? "Finding your next shift…" : "No upcoming assigned shifts."}</p>}</article>
        <article className="cc-next cc-next-consult"><div className="cc-eyebrow"><SparkleIcon/> Next consultation</div>{nextConsultation ? <><h3>{nextConsultation.client_name}</h3><p>{format(new Date(nextConsultation.scheduled_for), "EEE, MMM d · h:mm a")}</p><div className="cc-quick-links">{nextConsultation.client_address && <a href={getGoogleMapsLink(nextConsultation.client_address)} target="_blank" rel="noopener noreferrer"><MapPinIcon/>Directions</a>}{nextConsultation.client_phone && <a href={getTelLink(nextConsultation.client_phone)}><PhoneIcon/>Call</a>}<button type="button" className="cc-link" onClick={() => setSelectedConsultation(nextConsultation)}>Details <ArrowIcon/></button></div></> : <p>No upcoming assigned consultations.</p>}</article>
      </div>
      <section className="cc-week"><button type="button" className="cc-week-toggle" aria-expanded={showWeekly} aria-controls="cc-my-week" onClick={() => setShowWeekly(v => !v)}><span><CalendarIcon/> My weekly schedule <b>{myWeeklyEvents.length}</b></span><ChevronIcon className={showWeekly ? "cc-rotated" : ""}/></button>{showWeekly && <div id="cc-my-week" className="cc-week-body"><div className="cc-date-nav"><button type="button" onClick={() => setWeekOffset(w => w-1)} aria-label="Previous assigned week">←</button><strong>{format(weekStart,"MMM d")} – {format(addDays(weekStart,6),"MMM d, yyyy")}</strong><button type="button" onClick={() => setWeekOffset(w => w+1)} aria-label="Next assigned week">→</button></div>{myWeeklyEvents.length ? myWeeklyEvents.map(event => <button type="button" key={event.id} className="cc-week-event" onClick={() => handleSelectEvent(event)}><span><strong>{event.title}</strong><small>{format(event.start,"EEE, MMM d")}</small></span><span>{format(event.start,"h:mm a")} – {format(event.end,"h:mm a")} <b aria-hidden="true">↗</b></span></button>) : <p className="cc-empty">No assigned shifts this week.</p>}</div>}</section>
      <section className="cc-planner">
        <div className="cc-controls"><label className="cc-search"><span className="cc-sr-only">Search events by name</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a client or team member…"/></label><label><span className="cc-sr-only">Filter event type</span><select value={eventFilter} onChange={e => setEventFilter(e.target.value)}><option value="all">All events</option><option value="mine">My shifts</option><option value="consultation">Consultations</option>{showTimeOff && <option value="time_off">Time off</option>}</select></label><div className="cc-view-switch"><button type="button" aria-pressed={!agendaMode} onClick={() => setDisplayMode("calendar")}>Calendar</button><button type="button" aria-pressed={agendaMode} onClick={() => setDisplayMode("agenda")}>Agenda</button></div></div>
        <div className="cc-legend-row"><Legend/><button type="button" className="cc-overlay-toggle" aria-pressed={showTimeOff} disabled={timeOffLoading} onClick={() => { if(showTimeOff && eventFilter === "time_off") setEventFilter("all"); toggleTimeOff(); }}><BanIcon/>{timeOffLoading ? "Loading…" : showTimeOff ? "Time off on" : "Show time off"}</button></div>
        {agendaMode ? <MobileAgenda events={visibleEvents} onSelectEvent={handleSelectEvent} getColor={eventColor} date={calendarDate} onNavigate={setCalendarDate}/> : <div className="rbc-modern cc-grid"><Calendar localizer={localizer} events={visibleEvents} date={calendarDate} onNavigate={setCalendarDate} startAccessor="start" endAccessor="end" defaultView={isMobile ? "day" : "month"} views={isMobile ? ["month","day"] : ["month","week","day"]} popup formats={{dayFormat,eventTimeRangeFormat:()=>"",eventTimeRangeStartFormat:()=>"",eventTimeRangeEndFormat:()=>""}} onSelectEvent={handleSelectEvent} eventPropGetter={eventPropGetter}/></div>}
      </section>
      {/* ============================ MODALS =========================== */}

      {/* Client detail */}
      {selectedEvent && (
        <Modal
          onClose={() => setSelectedEvent(null)}
          accent={EVENT_COLORS.mine}
          icon={<CalendarIcon />}
          title="Client details"
          footer={
            <button type="button" onClick={() => setSelectedEvent(null)} className={btnGhost}>
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
          selectedOccurrence?.start || new Date(selectedEvent.start_date + "T00:00:00"),
          "EEEE, MMMM d, yyyy"
        )
      : "—"}
  </Field>

  <Field label="Time">
    {selectedOccurrence ? format(selectedOccurrence.start,"h:mm a") : formatTo12Hour(selectedEvent.start_time)}
    {" — "}
    {selectedOccurrence ? format(selectedOccurrence.end,"h:mm a") : formatTo12Hour(selectedEvent.end_time)}
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
            <button type="button"
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
                new Date(`${selectedTimeOff.entry.request_date}T00:00:00`),
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
            <button type="button"
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
    </CleaningTheme>
  );
}

/* ================================================================== */
/*  Mobile agenda                                                     */
/* ================================================================== */

function MobileAgenda({ events, onSelectEvent, getColor, date, onNavigate }) {
  const start = new Date(date); start.setHours(0,0,0,0);
  const end = addDays(start,7);
  const days = Array.from({length:7},(_,i)=>addDays(start,i));
  const visible = events.filter(e=>e.start < end && e.end >= start).sort((a,b)=>a.start-b.start);
  return <div className="cc-agenda"><div className="cc-date-nav"><button type="button" aria-label="Previous seven days" onClick={()=>onNavigate(addDays(start,-7))}>←</button><div><strong>{format(start,"MMM d")} – {format(addDays(start,6),"MMM d, yyyy")}</strong><button type="button" className="cc-today" onClick={()=>onNavigate(new Date())}>Today</button></div><button type="button" aria-label="Next seven days" onClick={()=>onNavigate(addDays(start,7))}>→</button></div>{visible.length === 0 ? <p className="cc-empty">No matching events in these seven days.</p> : days.map(day=>{
    const dayEnd=addDays(day,1);const rows=visible.filter(e=>e.start < dayEnd && e.end >= day);
    if(!rows.length)return null;
    return <section className="cc-agenda-day" key={format(day,"yyyy-MM-dd")}><header><span>{format(day,"dd")}</span><div><strong>{format(day,"EEEE")}</strong><small>{format(day,"MMMM yyyy")}</small></div><b>{rows.length} {rows.length === 1 ? "event" : "events"}</b></header><div>{rows.map(event=><button type="button" key={event.id} className="cc-agenda-event" style={{"--event-color":getColor(event)}} onClick={()=>onSelectEvent(event)}><span className="cc-event-time">{event.allDay ? "All day" : format(event.start,"h:mm a")}<small>{!event.allDay && format(event.end,"h:mm a")}</small></span><span className="cc-event-copy"><strong>{event.title}</strong><small>{event.resource?.type === "consultation" ? "Consultation" : event.resource?.type === "time_off" ? `Time off · ${event.resource.request.status}` : event.isException ? "Rescheduled cleaning" : "Cleaning shift"}</small></span><span aria-hidden="true">↗</span></button>)}</div></section>;
  })}</div>;
}

const CALENDAR_STYLES = `
.cleaning-theme.cc-calendar{min-height:0;border-radius:18px;overflow:visible;background:radial-gradient(ellipse at top right,#153b5d88,transparent 60%),#050e1d;padding:22px}.cleaning-theme .cc-calendar .ct-page-atmosphere{display:none}.cc-calendar .ct-content{min-width:0}.cc-content{display:flex;flex-direction:column;gap:16px;color:#dcedf7;min-width:0}.cc-header{display:flex;align-items:center;gap:12px}.cc-brand{display:grid;place-items:center;flex-shrink:0;width:43px;height:43px;border:1px solid #77e2e64d;border-radius:14px;background:#163d51;color:#9df4e2}.cc-brand svg{width:22px;height:22px}.cc-eyebrow{display:flex;align-items:center;gap:7px;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#87dedf;line-height:1.6}.cc-calendar .cc-header h2{font-family:inherit;font-size:25px;font-weight:700;letter-spacing:-.04em;line-height:1.2;margin:5px 0}.cc-header p:last-child{font-size:12px;color:#a4bdd0}.cc-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cc-next{background:linear-gradient(125deg,#0e2b3c,#0c192c);border:1px solid #6ee7b72c;border-radius:16px;padding:17px;min-width:0}.cc-next-consult{background:linear-gradient(125deg,#1f2240,#0c192c);border-color:#d1a4f42b}.cc-next-consult .cc-eyebrow{color:#e5bdf8}.cc-next .cc-eyebrow svg{height:16px;width:16px}.cc-next h3{font:650 16px/1.4 system-ui;margin:11px 0 4px}.cc-next p{font-size:12px;line-height:1.7;color:#aec8d8;margin-top:7px}.cc-link,.cc-quick-links a{display:inline-flex;align-items:center;gap:7px;font-size:11px!important;color:#93f1e5!important;background:none;border:0;padding:0;min-height:38px;font-weight:650!important}.cc-link svg,.cc-quick-links a svg{width:14px;height:14px}.cc-quick-links{display:flex;flex-wrap:wrap;gap:14px}.cc-week,.cc-planner{border:1px solid #7dd3fc2b;border-radius:16px;background:#0a182a;min-width:0}.cc-week-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;min-height:48px;border:0;background:none;color:#dceff7;font-size:12px!important;text-align:left}.cc-week-toggle>span{display:flex;align-items:center;gap:9px}.cc-week-toggle svg{width:17px;height:17px;color:#89dfe5}.cc-week-toggle b{padding:3px 7px;border-radius:6px;background:#194154;color:#a9f7e7;font-size:10px}.cc-rotated{transform:rotate(180deg)}.cc-week-body{border-top:1px solid #7dd3fc22;padding:12px}.cc-week-event{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;padding:12px 9px;border:0;border-top:1px solid #7dd3fc1c;background:transparent;text-align:left;color:#d4ebf5;font-size:11px!important}.cc-week-event strong,.cc-week-event small{display:block}.cc-week-event small{color:#99b8cc;margin-top:4px}.cc-week-event>span:last-child{color:#92ecdb}.cc-planner{padding:15px}.cc-controls{display:flex;flex-wrap:wrap;gap:8px}.cc-search{display:flex;align-items:center;gap:8px;flex:1 1 220px;border:1px solid #7dd3fc36;border-radius:10px;background:#061121;padding:0 11px;min-width:0}.cc-search svg{width:17px;flex-shrink:0;color:#81b5cd}.cc-search input{width:100%;min-width:0;height:43px;border:0;background:transparent;color:#e3f6ff;font-size:12px;outline-offset:2px}.cc-search input::placeholder{color:#8eacc0}.cc-controls select{height:44px;max-width:100%;border:1px solid #7dd3fc36;border-radius:10px;padding:0 10px;background:#0d243a;color:#cfeaf7;font-size:12px}.cc-view-switch{display:flex;gap:3px;padding:3px;border:1px solid #7dd3fc36;border-radius:10px;background:#061121}.cc-view-switch button{padding:8px 12px;border:0;border-radius:7px;color:#9bbdd0;background:none;font-size:11px!important;min-height:36px}.cc-view-switch button[aria-pressed=true]{background:#83e4e6;color:#092735;font-weight:700}.cc-legend-row{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;padding:14px 0}.cc-legend-row>div{gap:8px 14px}.cc-legend-row>div>span{color:#a6c4d6;font-size:10px}.cc-overlay-toggle{display:flex;align-items:center;gap:7px;padding:8px 10px;min-height:40px;border:1px solid #7dd3fc33;border-radius:9px;background:#10283c;color:#c9e6f3;font-size:10px!important}.cc-overlay-toggle[aria-pressed=true]{background:#482039;border-color:#eb9da54d;color:#ffdbe2}.cc-overlay-toggle svg{width:14px;height:14px}.cc-overlay-toggle:disabled{opacity:.6;cursor:wait}.cc-date-nav{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px}.cc-date-nav>button{display:grid;place-items:center;width:42px;height:42px;background:#153148;border:1px solid #7dd3fc33;border-radius:10px;color:#c5f3f6;flex-shrink:0}.cc-date-nav strong{font-size:12px;color:#d6edf5;line-height:1.5}.cc-date-nav>div{text-align:center}.cc-today{display:block;margin:4px auto 0;border:0;background:none;color:#8fe9e7;font-size:10px!important;padding:3px 15px;min-height:27px}.cc-agenda-day{margin-top:19px}.cc-agenda-day>header{display:flex;align-items:center;gap:10px;margin-bottom:9px}.cc-agenda-day>header>span{width:39px;height:39px;background:#14364b;border-radius:11px;display:grid;place-items:center;color:#b1f7ed;font-size:19px;font-weight:650}.cc-agenda-day header strong,.cc-agenda-day header small{display:block;font-size:12px}.cc-agenda-day header small{font-size:10px;color:#90afc5;margin-top:4px}.cc-agenda-day header b{margin-left:auto;color:#8eaec4;font-size:9px;font-weight:500}.cc-agenda-event{display:flex;align-items:center;gap:11px;width:100%;padding:12px;margin:7px 0;border:1px solid #7dd3fc24;border-left:3px solid var(--event-color);border-radius:10px;background:#102238;color:#d5e9f3;text-align:left;min-height:65px}.cc-agenda-event:hover{background:#173349}.cc-event-time{min-width:66px;font-size:11px;font-weight:650}.cc-event-time small{display:block;color:#90b1c5;margin-top:5px;font-size:10px}.cc-event-copy{flex:1;min-width:0}.cc-event-copy strong{display:block;font-size:13px;overflow-wrap:anywhere}.cc-event-copy small{display:block;font-size:10px;color:#a0bccf;margin-top:5px}.cc-empty{padding:25px 12px;border:1px dashed #7dd3fc33;border-radius:12px;font-size:12px;text-align:center;color:#9ebdcf}.cc-grid{height:650px}.cc-sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.cc-error{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#4b2233;color:#ffdfdf;border:1px solid #ff9eae55;border-radius:10px;padding:12px;font-size:12px}.cc-error button{border:0;background:none;color:inherit;font-size:20px;min-width:35px;min-height:35px}.cc-loading{padding:12px;font-size:12px;color:#a5e9ee}.cc-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 18px;border:1px solid #7dc9d2;border-radius:10px;background:#e4f7f8;color:#124552;font-size:12px!important;font-weight:650!important}
.cc-calendar .rbc-modern{color:#c6dcea}.cc-calendar .rbc-modern .rbc-toolbar{gap:8px;margin:3px 0 15px}.cc-calendar .rbc-modern .rbc-toolbar-label{color:#e1f3fa;font-size:16px}.cc-calendar .rbc-modern .rbc-toolbar button{background:#10263d;border-color:#7dd3fc33;color:#bedde9;min-height:40px;padding:8px 12px}.cc-calendar .rbc-modern .rbc-toolbar button.rbc-active{background:#91e9e5!important;color:#0b3540!important;border-color:#91e9e5!important;box-shadow:none}.cc-calendar .rbc-month-view,.cc-calendar .rbc-time-view{background:#0b1b2e;border-color:#7dd3fc30}.cc-calendar .rbc-modern .rbc-header{color:#9cc1d3;border-color:#7dd3fc22}.cc-calendar .rbc-modern .rbc-header+.rbc-header,.cc-calendar .rbc-modern .rbc-day-bg+.rbc-day-bg,.cc-calendar .rbc-modern .rbc-month-row+.rbc-month-row,.cc-calendar .rbc-modern .rbc-time-content,.cc-calendar .rbc-modern .rbc-time-header-content,.cc-calendar .rbc-modern .rbc-timeslot-group{border-color:#7dd3fc22}.cc-calendar .rbc-modern .rbc-off-range-bg{background:#061220}.cc-calendar .rbc-modern .rbc-off-range{color:#668197}.cc-calendar .rbc-modern .rbc-date-cell{color:#bad7e5}.cc-calendar .rbc-modern .rbc-today{background:#13384a}.cc-calendar .rbc-modern .rbc-now .rbc-button-link,.cc-calendar .rbc-modern .rbc-show-more{color:#8ff7e0}.cc-calendar .rbc-modern .rbc-event{font-size:10px;padding:3px 5px}.cc-calendar .rbc-modern .rbc-event:focus-visible{outline:2px solid #baffef;outline-offset:2px}.cc-calendar .rbc-overlay{background:#12283d;color:#dbf5ff;border:1px solid #7dd3fc55;border-radius:12px}.cc-calendar .rbc-overlay-header{border-color:#7dd3fc33}.cc-calendar .rbc-day-slot .rbc-time-slot{border-color:#7dd3fc14}
.cc-dialog{position:fixed;inset:0;margin:auto;padding:0;max-width:min(570px,calc(100% - 24px));width:100%;max-height:90dvh;background:#f5fafc;color:#173a4c;border:1px solid #8bd9e0;border-radius:20px;box-shadow:0 30px 100px #0008;overflow:auto}.cc-dialog::backdrop{background:#020b1bd6;backdrop-filter:blur(7px)}.cc-dialog-inner>header{display:flex;align-items:center;gap:10px;padding:16px 18px;background:linear-gradient(110deg,#102942,#0a1a30);color:#e1f4fc;position:sticky;top:0;z-index:1}.cc-dialog-inner>header h3{font-size:16px;font-weight:650}.cc-dialog-icon{width:33px;height:33px;border-radius:10px;background:#ffffff16;display:grid;place-items:center}.cc-dialog-icon svg{width:18px;height:18px}.cc-icon-btn{display:grid;place-items:center;margin-left:auto;min-height:38px;width:38px;background:#ffffff10;color:#e8faff;border:1px solid #7dd3fc44;border-radius:10px;font-size:23px!important}.cc-dialog-body{padding:18px;overflow-wrap:anywhere}.cc-dialog-body>div+div{margin-top:17px}.cc-dialog-inner>footer{display:flex;justify-content:flex-end;padding:13px 18px;background:#e9f2f5;border-top:1px solid #cee1e8}.cc-dialog a{overflow-wrap:anywhere}
@media(max-width:700px){.cleaning-theme.cc-calendar{padding:13px;border-radius:13px}.cc-content{gap:12px}.cc-header{gap:9px}.cc-brand{width:35px;height:35px;border-radius:10px}.cc-header .cc-eyebrow{font-size:8px;letter-spacing:.06em}.cc-calendar .cc-header h2{font-size:21px}.cc-header p:last-child{font-size:10px}.cc-summary{gap:8px}.cc-next{padding:12px;border-radius:12px}.cc-next h3{font-size:14px}.cc-next p{font-size:10px}.cc-next .cc-eyebrow{font-size:8px;letter-spacing:.04em}.cc-next .cc-eyebrow svg{display:none}.cc-quick-links{gap:7px}.cc-link,.cc-quick-links a{font-size:10px!important}.cc-planner{padding:10px}.cc-search{flex-basis:100%}.cc-search input,.cc-controls select{font-size:16px}.cc-controls>label:not(.cc-search){flex:1;min-width:0}.cc-controls select{width:100%}.cc-view-switch button{padding-inline:10px}.cc-legend-row{gap:10px}.cc-legend-row>div{gap:7px 10px}.cc-legend-row>div>span{font-size:9px}.cc-week-toggle{font-size:11px!important;padding:12px}.cc-week-event{align-items:flex-start;flex-direction:column;gap:6px}.cc-grid{height:580px}.cc-calendar .rbc-modern .rbc-toolbar{justify-content:center}.cc-calendar .rbc-modern .rbc-toolbar-label{flex-basis:100%;order:-1;font-size:15px}.cc-calendar .rbc-modern .rbc-toolbar button{min-height:44px}.cc-dialog-body{padding:14px}.cc-dialog-body input,.cc-dialog-body select{font-size:16px;max-width:100%}}
@media(max-width:390px){.cc-summary{grid-template-columns:1fr}.cc-event-time{min-width:56px;font-size:10px}.cc-agenda-event{gap:8px;padding:10px}.cc-event-copy strong{font-size:12px}.cc-calendar .cc-header h2{font-size:19px}}
`;
