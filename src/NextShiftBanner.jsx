import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, addMonths, isAfter, format } from "date-fns";
import StartShift from "./StartShift";
import { useStaff } from "./StaffContext";
import ActiveShiftPanel from "./ActiveShiftPanel";
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
        if (ex.original_date) {
          canceledDates.add(ex.original_date);
        }

        if (ex.replacement_date) {
          replacementsByDate[ex.replacement_date] = ex;
        }
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

    // ONE TIME
    if (s.schedule_type === "one_time") {
      makeEvent(startDate);
      return;
    }

    // RECURRING
    let cursor = new Date(startDate);

    // Align weekday properly
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

      if (s.schedule_type === "weekly") {
        cursor = addWeeks(cursor, 1);
      } else if (s.schedule_type === "bi_weekly") {
        cursor = addWeeks(cursor, 2);
      } else if (s.schedule_type === "monthly") {
        cursor = addMonths(cursor, 1);
      } else {
        break;
      }
    }

    // Inject replacements
    Object.entries(replacementsByDate).forEach(([dateStr, ex]) => {
      const d = parseLocalDate(dateStr);
      if (!d) return;

      if (d >= rangeStart && d <= rangeEnd) {
        makeEvent(d, ex);
      }
    });
  });

  return events;
}

/* ================= COMPONENT ================= */
export default function NextShiftBanner() {
  const { authAxios, staff } = useStaff();
  const myStaffId = staff?.id;

  const [schedules, setSchedules] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
const [refreshKey, setRefreshKey] = useState(0);
  const isAssignedToMe = (schedule) =>
    schedule?.client?.cleaners?.some(
      (c) => c.type === "staff" && c.id === myStaffId
    );

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [schedRes, shiftRes] = await Promise.all([
          authAxios.get("/schedules"),
          authAxios.get("/staff/shifts/active"),
        ]);

        setSchedules(schedRes.data || []);
        setActiveShift(shiftRes.data?.active ? shiftRes.data.shift : null);
      } finally {
        setLoading(false);
      }
    };

    load();
}, [authAxios, refreshKey]);
const refresh = () => setRefreshKey((k) => k + 1);
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
  }, [events, myStaffId]);

  const formatDateTime = (d) =>
    format(d, "EEEE, MMM d • h:mm a");

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
          {activeShift.client?.first_name} {activeShift.client?.last_name}
        </p>
<ActiveShiftPanel
  refreshKey={refreshKey}
  onShiftUpdated={refresh}
/>      </div>
    );
  }

  /* ================= NEXT SHIFT ================= */
  if (nextShift) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-none p-5">
        <p className="text-green-700 font-semibold text-sm">
          Your next scheduled shift
        </p>
        <p className="text-lg font-bold text-green-900 mt-1">
          {formatDateTime(nextShift.start)}
        </p>

        <div className="flex justify-between items-center mt-3">
          <div>
            <p className="text-green-800 text-sm">
              {nextShift.resource.client.first_name}{" "}
              {nextShift.resource.client.last_name}
            </p>
            <p className="text-sm text-green-700">
              {formatTime(nextShift.resource.start_time)} →{" "}
              {formatTime(nextShift.resource.end_time)}
            </p>
          </div>

<StartShift
  schedule={nextShift.resource}
  compact
  onStarted={refresh}
/>

        </div>
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