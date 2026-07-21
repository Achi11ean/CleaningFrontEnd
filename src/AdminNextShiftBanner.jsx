import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, addMonths, isAfter, format } from "date-fns";
import { useAdmin } from "./AdminContext";
import AdminStartShift from "./AdminStartShift";
import AdminActiveShiftPanel from "./AdminActiveShiftPanel";

/* ================= EXPAND SCHEDULES ================= */
function expandSchedules(schedules, rangeStart, rangeEnd) {
  const events = [];

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

    const parseLocalDate = (dateStr) => {
      if (!dateStr) return null;
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d);
    };

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
        start,
        end,
        resource: s,
      });
    };

    if (s.schedule_type === "one_time") {
      makeEvent(startDate);
      return;
    }

    let cursor = new Date(startDate);

    if (s.day_of_week !== null) {
      while (cursor.getDay() !== ((s.day_of_week + 1) % 7)) {
        cursor = addDays(cursor, 1);
      }
    }

    while (!isAfter(cursor, rangeEnd)) {
      const dateKey = format(cursor, "yyyy-MM-dd");

      if (!isAfter(rangeStart, cursor)) {
        if (!canceledDates.has(dateKey)) {
          makeEvent(cursor);
        }
      }

      if (s.schedule_type === "weekly") cursor = addWeeks(cursor, 1);
      else if (s.schedule_type === "bi_weekly") cursor = addWeeks(cursor, 2);
      else if (s.schedule_type === "monthly") cursor = addMonths(cursor, 1);
      else break;
    }

    Object.entries(replacementsByDate).forEach(([dateStr, ex]) => {
      const d = parseLocalDate(dateStr);
      if (!d) return;
      if (d >= rangeStart && d <= rangeEnd) makeEvent(d, ex);
    });
  });

  return events;
}

/* ================= COMPONENT ================= */
export default function AdminNextShiftBanner() {
  const { authAxios, admin } = useAdmin();
  const myAdminId = admin?.id;
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  const isAssignedToMe = (schedule) =>
    schedule?.client?.cleaners?.some(
      (c) => c.type === "admin" && c.id === myAdminId
    );

  const nextConsultation = useMemo(() => {
    const now = new Date();

    const upcoming = appointments
      .filter((a) => {
        if (!a.scheduled_for) return false;

        const date = new Date(a.scheduled_for);

        const assignedToMe =
          a.assigned_user_type === "admin" &&
          a.assigned_user_id === myAdminId;

        return assignedToMe && date > now;
      })
      .sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for));

    return upcoming[0] || null;
  }, [appointments, myAdminId]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [schedRes, shiftRes, apptRes] = await Promise.all([
          authAxios.get("/schedules"),
          authAxios.get("/admin/shifts/active"),
          authAxios.get("/appointments"),
        ]);

        setSchedules(schedRes.data || []);
        setAppointments(apptRes.data || []);
        setActiveShift(shiftRes.data?.active ? shiftRes.data.shift : null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authAxios, refreshKey]);

  /* ================= NEXT SHIFT ================= */
  const events = useMemo(() => {
    const rangeStart = addDays(new Date(), -30);
    const rangeEnd = addDays(new Date(), 120);
    return expandSchedules(schedules, rangeStart, rangeEnd);
  }, [schedules]);

  const nextShift = useMemo(() => {
    const now = new Date();

    return events
      .filter((e) => isAssignedToMe(e.resource) && e.start > now)
      .sort((a, b) => a.start - b.start)[0];
  }, [events, myAdminId]);

  const formatDateTime = (d) => format(d, "EEEE, MMM d • h:mm a");

  const formatTime = (t) => {
    const [h, m] = t.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m);
    return format(d, "h:mm a");
  };

  if (loading) return null;

  /* ================= ACTIVE SHIFT ================= */
  if (activeShift) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 shadow-sm">
        <span className="absolute right-5 top-5 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
          </span>
          Live
        </span>

        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          You're currently clocked in
        </p>

        <p className="mt-1 flex items-center gap-2 text-lg font-bold text-blue-950">
          <ClockIcon className="text-blue-500" />
          {formatDateTime(new Date(activeShift.check_in_at))}
        </p>

        <p className="mt-0.5 text-sm font-medium text-blue-800">
          {activeShift.client?.first_name} {activeShift.client?.last_name}
        </p>

        <div className="mt-4">
          <AdminActiveShiftPanel refreshKey={refreshKey} onShiftUpdated={refresh} />
        </div>
      </div>
    );
  }

  /* ================= NEXT SHIFT / CONSULTATION ================= */
  if (nextShift || nextConsultation) {
    return (
      <div className="space-y-4">
        {/* NEXT SHIFT */}
        {nextShift && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Your next scheduled shift
                </p>

                <p className="mt-1 flex items-center gap-2 text-lg font-bold text-emerald-950">
                  <CalendarIcon className="text-emerald-500" />
                  {formatDateTime(nextShift.start)}
                </p>

                <p className="mt-0.5 text-sm font-medium text-emerald-800">
                  {nextShift.resource.client.first_name}{" "}
                  {nextShift.resource.client.last_name}
                </p>

                {nextShift.resource.client.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      nextShift.resource.client.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <MapPinIcon />
                    {nextShift.resource.client.address}
                  </a>
                )}
              </div>

              <div className="shrink-0">
                <AdminStartShift
                  schedule={nextShift.resource}
                  compact
                  onStarted={refresh}
                />
              </div>
            </div>
          </div>
        )}

        {/* NEXT CONSULTATION */}
        {nextConsultation && (
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Next consultation
            </p>

            <p className="mt-1 flex items-center gap-2 text-lg font-bold text-violet-950">
              <CalendarIcon className="text-violet-500" />
              {format(new Date(nextConsultation.scheduled_for), "EEEE, MMM d • h:mm a")}
            </p>

            <p className="mt-0.5 text-sm font-medium text-violet-800">
              {nextConsultation.client_name}
            </p>

            {nextConsultation.client_address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  nextConsultation.client_address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                <MapPinIcon />
                {nextConsultation.client_address}
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ================= NONE ================= */
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
      <p className="text-sm font-medium text-slate-500">
        You have no upcoming shifts.
      </p>
      <p className="mt-1 text-xs text-slate-400">
        New assignments will show up here as soon as they're scheduled.
      </p>
    </div>
  );
}

/* ================= INLINE ICONS ================= */
function ClockIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function CalendarIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

function MapPinIcon() {
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
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}