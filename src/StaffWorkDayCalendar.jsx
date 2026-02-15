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
import StartShift from "./StartShift";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { useStaff } from "./StaffContext";
import enUS from "date-fns/locale/en-US";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Expand recurring schedules into actual calendar events
function expandSchedules(schedules, rangeStart, rangeEnd) {
  const events = [];

  schedules.forEach((s) => {
    if (s.status !== "active") return;

    // ❗ One-time schedules ignore exceptions
    const hasExceptions =
      Array.isArray(s.exceptions) && s.schedule_type !== "one_time";

    // 🧠 Build exception maps
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

    const [sh, sm] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);

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

    // 🟢 ONE-TIME
    if (s.schedule_type === "one_time") {
      makeEvent(startDate);
      return;
    }

    // 🔁 RECURRING
    let cursor = new Date(startDate);

    // Align weekday
    if (s.day_of_week !== null) {
      while (cursor.getDay() !== ((s.day_of_week + 1) % 7)) {
        cursor = addDays(cursor, 1);
      }
    }

    while (!isAfter(cursor, rangeEnd)) {
      const dateKey = format(cursor, "yyyy-MM-dd");

      if (!isAfter(rangeStart, cursor)) {
        // ❌ canceled occurrence → skip
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

    // ➕ Inject replacement occurrences
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


export default function StaffWorkDayCalendar() {
const { authAxios, staff } = useStaff();
const myStaffId = staff?.id;
const isMobile = () => window.innerWidth < 640; // tailwind sm breakpoint

const weekDayHeaderFormat = (date, culture, localizer) => {
  if (isMobile()) {
    // Mobile: S M T W Th F Sa
    return format(date, "EEEEE"); // single letter, except Thu = Th
  }

  // Desktop: Sun Mon Tue Wed Thu Fri Sat
  return format(date, "EEE");
};
const formatScheduleType = (t) => {
  if (!t) return "—";
  const map = {
    one_time: "One Time",
    weekly: "Weekly",
    bi_weekly: "Bi-Weekly",
    monthly: "Monthly",
  };
  return map[t] || t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};


  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
const [showWeekly, setShowWeekly] = useState(false);
const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, 1 = next, -1 = last
const [activeShift, setActiveShift] = useState(null);
const [checkingActiveShift, setCheckingActiveShift] = useState(true);

const isAssignedToMe = (schedule) => {
  if (!schedule?.client?.cleaners || !myStaffId) return false;

  return schedule.client.cleaners.some(
    (c) => c.type === "staff" && c.id === myStaffId
  );
};

  const getGoogleMapsLink = (address) => {
    if (!address) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
  };

  const getTelLink = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/[^\d+]/g, "");
    return `tel:${cleaned}`;
  };

  const getMailLink = (email) => {
    if (!email) return null;
    return `mailto:${email}`;
  };

  const formatTo12Hour = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return format(date, "h:mm a");
  };

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
  }, []);

useEffect(() => {
  const loadActiveShift = async () => {
    try {
      setCheckingActiveShift(true);

      const res = await authAxios.get("/staff/shifts/active");

      if (res.data?.active) {
        setActiveShift(res.data.shift);
      } else {
        setActiveShift(null);
      }
    } catch (err) {
      console.error("Failed to load active shift", err);
      setActiveShift(null);
    } finally {
      setCheckingActiveShift(false);
    }
  };

  loadActiveShift();
}, [authAxios]);



  const formatDateTime = (date) => {
  return format(date, "EEEE, MMM d • h:mm a"); 
  // Example: Tuesday, Feb 6 • 9:00 AM
};


  const events = useMemo(() => {
    const rangeStart = addDays(new Date(), -30);
    const rangeEnd = addDays(new Date(), 120);
    return expandSchedules(schedules, rangeStart, rangeEnd);
  }, [schedules]);

  const nextShift = useMemo(() => {
  const now = new Date();

  const myUpcoming = events
    .filter((e) => {
      const schedule = e.resource;
      const assignedToMe = isAssignedToMe(schedule);
      return assignedToMe && e.start > now;
    })
    .sort((a, b) => a.start - b.start);

  return myUpcoming.length > 0 ? myUpcoming[0] : null;
}, [events, myStaffId]);


const weekStart = useMemo(() => {
  const base = addWeeks(new Date(), weekOffset);
  return startOfWeek(base, { weekStartsOn: 1 }); // Monday start
}, [weekOffset]);

const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

const myWeeklyEvents = useMemo(() => {
  return events
    .filter((e) => {
      const schedule = e.resource;
      const assignedToMe = isAssignedToMe(schedule);
      return (
        assignedToMe &&
        e.start >= weekStart &&
        e.start < weekEnd
      );
    })
    .sort((a, b) => a.start - b.start);
}, [events, weekStart, weekEnd, myStaffId]);


  if (loading) return <p className="p-6">Loading work calendar...</p>;

  return (
    <div className="space-y-4">
<h2 className="text-2xl font-bold">🗓️ Work Day Schedule</h2>
{/* NEXT SHIFT BANNER */}
{checkingActiveShift ? null : activeShift ? (

  // 🔵 ACTIVE SHIFT
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

      <div>
        <p className="text-xs sm:text-sm text-blue-700 font-semibold">
          You are currently clocked in
        </p>

        <p className="text-base sm:text-lg font-bold text-blue-900 mt-1">
          {formatDateTime(new Date(activeShift.check_in_at))}
        </p>

        <p className="text-sm text-blue-800 mt-0.5">
          {activeShift.client?.first_name}{" "}
          {activeShift.client?.last_name}
        </p>
      </div>

      <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1.5 rounded-lg">
        Shift in progress
      </div>

    </div>
  </div>

) : nextShift ? (

  // 🟢 NEXT SHIFT
  <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

      <div>
        <p className="text-xs sm:text-sm text-green-700 font-semibold">
          Your next scheduled work shift
        </p>

        <p className="text-base sm:text-lg font-bold text-green-900 mt-1">
          {formatDateTime(nextShift.start)}
        </p>

        <p className="text-sm text-green-800 mt-0.5">
          {nextShift.resource.client.first_name}{" "}
          {nextShift.resource.client.last_name}
        </p>
      </div>

      <div className="flex flex-col items-start sm:items-end gap-2">

        <div className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1.5 rounded-lg">
          {formatTo12Hour(nextShift.resource.start_time)}{" "}
          <span className="mx-1">→</span>
          {formatTo12Hour(nextShift.resource.end_time)}
        </div>

        {isAssignedToMe(nextShift.resource) && (
          <StartShift
            schedule={nextShift.resource}
            compact
            onStarted={() => {
              alert("Shift started successfully!");
            }}
          />
        )}
      </div>

    </div>
  </div>

) : (

  // ⚪ NO SHIFTS
  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-600 italic text-sm">
    You have no upcoming assigned work shifts.
  </div>

)}


{/* WEEKLY SCHEDULE DROPDOWN */}
<div className="bg-white border rounded-xl shadow-sm">

  <button
    onClick={() => setShowWeekly((v) => !v)}
    className="w-full flex items-center justify-between px-4 py-3 font-semibold text-gray-800 hover:bg-gray-50 rounded-xl"
  >
    <span>📅 See My Weekly Schedule</span>
    <span className="text-sm text-gray-500">
      {showWeekly ? "▲ Hide" : "▼ Show"}
    </span>
  </button>

  {showWeekly && (
    <div className="border-t p-4 space-y-3">

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
        >
          ◀ Previous
        </button>

        <div className="font-semibold text-gray-700">
          {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </div>

        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
        >
          Next  ▶
        </button>
      </div>

      {/* Weekly List */}
      {myWeeklyEvents.length === 0 ? (
        <p className="text-gray-500 italic">
          You have no assigned shifts this week.
        </p>
      ) : (
        <div className="space-y-2">
          {myWeeklyEvents.map((e) => (
            <div
              key={e.id}
              className="border rounded-lg p-3 flex items-center justify-between bg-green-50"
            >
              <div>
                <div className="font-semibold text-gray-800">
                  {format(e.start, "EEEE, MMM d")}
                </div>

                <div className="text-sm text-gray-700">
                  {format(e.start, "h:mm a")} → {format(e.end, "h:mm a")}
                </div>

                <div className="text-sm text-gray-600">
                  {e.resource.client.first_name}{" "}
                  {e.resource.client.last_name}
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(e.resource)}
                className="px-3 py-1 rounded bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
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


      <div className="bg-white rounded-xl shadow p-4" style={{ height: 700 }}>
 <Calendar
  localizer={localizer}
  events={events}
  startAccessor="start"
  endAccessor="end"
  defaultView="month"
  views={["month", "week", "day"]}
  popup
  onSelectEvent={(event) => setSelectedEvent(event.resource)}

  formats={{
    dayFormat: weekDayHeaderFormat,   // 👈 THIS IS THE KEY
  }}

  eventPropGetter={(event) => {
    const assignedToMe = isAssignedToMe(event.resource);

    return {
      style: {
        backgroundColor: assignedToMe ? "#16a34a" : "#2563eb",
        borderRadius: "8px",
        color: "white",
        border: assignedToMe ? "2px solid #14532d" : "none",
        boxShadow: assignedToMe
          ? "0 0 8px rgba(22, 163, 74, 0.6)"
          : "none",
        fontWeight: assignedToMe ? "700" : "500",
      },
    };
  }}
/>

      </div>

      {/* CLIENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-xl font-bold">🧑‍💼 Client Details</h3>

            <div className="space-y-2">
              <p>
                <strong>Name:</strong>{" "}
                {selectedEvent.client.first_name}{" "}
                {selectedEvent.client.last_name}
              </p>

 

              <p>
                <strong>Address:</strong>{" "}
                {selectedEvent.client.address ? (
                  <a
                    href={getGoogleMapsLink(selectedEvent.client.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {selectedEvent.client.address}
                  </a>
                ) : (
                  "—"
                )}
              </p>

              <p>
             <strong>Schedule Type:</strong> {formatScheduleType(selectedEvent.schedule_type)}

              </p>

              <p>
                <strong>Time:</strong>{" "}
                {formatTo12Hour(selectedEvent.start_time)} →{" "}
                {formatTo12Hour(selectedEvent.end_time)}
              </p>
              <div>
  <h4 className="font-semibold mt-3 mb-1">Assigned Cleaners</h4>

  {selectedEvent.client.cleaners?.length > 0 ? (
    <div className="space-y-3">
      {selectedEvent.client.cleaners.map((c) => {
        const profile = c.profile;
        const displayName =
          profile?.first_name || c.username;

        return (
          <div
            key={c.assignment_id}
            className="flex items-center gap-3 border rounded-lg p-2"
          >
            {/* Photo */}
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name + Role */}
            <div>
              <div className="font-semibold text-gray-800">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {c.type}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <p className="text-gray-500 italic">No cleaners assigned</p>
  )}
</div>
{isAssignedToMe(selectedEvent) && (
  <StartShift
    schedule={selectedEvent}
    onStarted={(shift) => {
      alert("Shift started successfully!");
      setSelectedEvent(null); // close modal if you want
    }}
  />
)}


            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
