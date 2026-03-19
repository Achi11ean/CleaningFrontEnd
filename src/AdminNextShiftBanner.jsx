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
      <div className="bg-blue-50 border border-blue-200 rounded-none p-5">
        <p className="text-blue-700 font-semibold text-sm">
          You are currently clocked in
        </p>

        <p className="text-lg font-bold text-blue-900 mt-1">
          {formatDateTime(new Date(activeShift.check_in_at))}
        </p>

        <p className="text-blue-800 text-sm">
          {activeShift.client?.first_name}{" "}
          {activeShift.client?.last_name}
        </p>

        <AdminActiveShiftPanel
          refreshKey={refreshKey}
          onShiftUpdated={refresh}
        />
      </div>
    );
  }

  /* ================= NEXT SHIFT ================= */
 if (nextShift || nextConsultation) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-4">

      {/* NEXT SHIFT */}
{nextShift && (
  <div className="flex justify-between items-center">
    <div>
      <p className="text-green-700 font-semibold text-sm">
        Your next scheduled shift
      </p>

      <p className="text-lg font-bold text-green-900 mt-1">
        {formatDateTime(nextShift.start)}
      </p>

      <p className="text-green-800 text-sm">
        {nextShift.resource.client.first_name}{" "}
        {nextShift.resource.client.last_name}
      </p>

      {/* 👇 ADD THIS */}
      {nextShift.resource.client.address && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            nextShift.resource.client.address
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 underline hover:text-blue-800 block mt-1"
        >
          📍 {nextShift.resource.client.address}
        </a>
      )}
    </div>

    <AdminStartShift
      schedule={nextShift.resource}
      compact
      onStarted={refresh}
    />
  </div>
)}
    {nextConsultation && (
  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
    <p className="text-sm font-semibold text-pink-700">
      🩷 Next Consultation
    </p>

    <p className="text-lg font-bold text-pink-900">
      {format(new Date(nextConsultation.scheduled_for), "EEEE, MMM d • h:mm a")}
    </p>

    <p className="text-sm text-pink-800">
      {nextConsultation.client_name}
    </p>

    {/* 👇 ADD THIS */}
   {nextConsultation.client_address && (
  <a
    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      nextConsultation.client_address
    )}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm text-blue-600 underline hover:text-blue-800 block mt-1"
  >
    📍 {nextConsultation.client_address}
  </a>
)}
  </div>
)}

    </div>
  );
}
  /* ================= NONE ================= */
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-600 italic text-sm">
      You have no upcoming shifts.
    </div>
  );
}