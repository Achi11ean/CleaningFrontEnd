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
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useAdmin } from "./AdminContext";
import AdminStartShift from "./AdminStartShift";
import AdminActiveShiftPanel from "./AdminActiveShiftPanel";

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

    const startDate = new Date(s.start_date);

    const [sh, sm] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);

    const makeEvent = (date) => {
      const start = new Date(date);
      start.setHours(sh, sm, 0, 0);

      const end = new Date(date);
      end.setHours(eh, em, 0, 0);

      events.push({
        id: `${s.id}-${date.toISOString()}`,
        title: `${s.client.first_name} ${s.client.last_name}`,
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

    // Align cursor to first correct weekday
    if (s.day_of_week !== null) {
      while (cursor.getDay() !== (s.day_of_week + 1) % 7) {
        cursor = addDays(cursor, 1);
      }
    }

    while (!isAfter(cursor, rangeEnd)) {
      if (!isAfter(rangeStart, cursor)) {
        makeEvent(cursor);
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
  });

  return events;
}

export default function ClientSchedulesCalendar() {
  const { authAxios, admin } = useAdmin();
  const myAdminId = admin?.id;

  const [showWeekly, setShowWeekly] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week
  const [showTimeOff, setShowTimeOff] = useState(false);
  const [timeOffRows, setTimeOffRows] = useState([]); // raw TimeOffRequest rows
  const [timeOffLoading, setTimeOffLoading] = useState(false);
const [selectedTimeOff, setSelectedTimeOff] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
const isMobile = () => window.innerWidth < 640;

const dayFormat = (date, culture, localizer) => {
  if (isMobile()) {
    // Mobile: S M T W T F S
    return format(date, "EEEEE");
  }

  // Desktop: SUN MON TUE WED THUR FRI SAT
  return format(date, "EEE").toUpperCase();
};


  const getGoogleMapsLink = (address) => {
    if (!address) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const formatDateTime = (date) => {
    return format(date, "EEEE, MMM d • h:mm a");
  };

  const getTelLink = (phone) => {
    if (!phone) return null;
    // Strip everything except digits and plus
    const cleaned = phone.replace(/[^\d+]/g, "");
    return `tel:${cleaned}`;
  };

  const getMailLink = (email) => {
    if (!email) return null;
    return `mailto:${email}`;
  };

  function formatTo12Hour(timeStr) {
    if (!timeStr) return "";

    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);

    return format(date, "h:mm a"); // e.g. 2:30 PM
  }

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

  const scheduleEvents = useMemo(() => {
    const rangeStart = addDays(new Date(), -60);
    const rangeEnd = addDays(new Date(), 180);

    return expandSchedules(schedules, rangeStart, rangeEnd);
  }, [schedules]);

  const isAssignedToMe = (schedule) => {
    if (!schedule?.client?.cleaners || !myAdminId) return false;

    return schedule.client.cleaners.some(
      (c) => c.type === "admin" && c.id === myAdminId,
    );
  };

  const nextShift = useMemo(() => {
  const now = new Date();

  const myUpcoming = scheduleEvents
    .filter((e) => {
      const schedule = e.resource;
      return isAssignedToMe(schedule) && e.start > now;
    })
    .sort((a, b) => a.start - b.start);

  return myUpcoming.length > 0 ? myUpcoming[0] : null;
}, [scheduleEvents, myAdminId]);

  const weekStart = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset);
    return startOfWeek(base, { weekStartsOn: 1 }); // Monday
  }, [weekOffset]);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const timeOffEvents = useMemo(() => {
    return showTimeOff ? expandTimeOffRequests(timeOffRows) : [];
  }, [showTimeOff, timeOffRows]);
  const allEvents = useMemo(() => {
    return [...scheduleEvents, ...timeOffEvents];
  }, [scheduleEvents, timeOffEvents]);

  const myWeeklyEvents = useMemo(() => {
    return scheduleEvents
      .filter((e) => {
        const schedule = e.resource;
        const assignedToMe = isAssignedToMe(schedule);
        return assignedToMe && e.start >= weekStart && e.start < weekEnd;
      })
      .sort((a, b) => a.start - b.start);
  }, [scheduleEvents, weekStart, weekEnd, myAdminId]);
  const toggleTimeOff = async () => {
  const next = !showTimeOff;
  setShowTimeOff(next);

  if (next && timeOffRows.length === 0) {
    try {
      setTimeOffLoading(true);
const res = await authAxios.get("/time-off/all");
      console.log("🛑 time off rows:", res.data);
      setTimeOffRows(res.data || []);
    } finally {
      setTimeOffLoading(false);
    }
  }
};


  if (loading) return <p className="p-6">Loading calendar...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🗓️ Cleaning Schedule Calendar</h2>

      {/* NEXT ADMIN SHIFT BANNER */}
      {nextShift ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700 font-semibold">
              Your next scheduled admin shift is:
            </p>
            <p className="text-lg font-bold text-green-900">
              {formatDateTime(nextShift.start)}
            </p>
            <p className="text-sm text-green-800">
              {nextShift.resource.client.first_name}{" "}
              {nextShift.resource.client.last_name}
            </p>
          </div>

          <div className="text-sm text-green-700 font-semibold">
            {formatTo12Hour(nextShift.resource.start_time)} →{" "}
            {formatTo12Hour(nextShift.resource.end_time)}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-600 italic">
          You have no upcoming assigned admin shifts.
        </div>
      )}

      {/* WEEKLY SCHEDULE DROPDOWN */}
      <div className="bg-white border rounded-xl shadow-sm">
        <button
          onClick={() => setShowWeekly((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 font-semibold text-gray-800 hover:bg-gray-50 rounded-xl"
        >
          <span>📅 See My Weekly Admin Schedule</span>
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
                ◀ Previous Week
              </button>

              <div className="font-semibold text-gray-700">
                {format(weekStart, "MMM d")} –{" "}
                {format(addDays(weekStart, 6), "MMM d, yyyy")}
              </div>

              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
              >
                Next Week ▶
              </button>
            </div>

            {/* Weekly List */}
            {myWeeklyEvents.length === 0 ? (
              <p className="text-gray-500 italic">
                You have no assigned admin shifts this week.
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
      <div className="bg-white border rounded-xl shadow-sm p-3 flex items-center justify-between">
        <div className="font-semibold text-gray-800">⛔ Time Off Overlay</div>

        <button
          onClick={toggleTimeOff}
          className={`px-3 py-1 rounded font-semibold text-sm ${
            showTimeOff
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {showTimeOff ? "Hide time off" : "Show time off"}
        </button>
      </div>

      {timeOffLoading && (
        <p className="text-sm text-gray-500 italic px-2">Loading time off…</p>
      )}

      <div className="bg-white rounded-xl shadow p-4" style={{ height: 700 }}>
<Calendar
  localizer={localizer}
  events={allEvents}
  startAccessor="start"
  endAccessor="end"
  defaultView="week"
  views={["month", "week", "day"]}
  popup
  selectable

  formats={{
  dayFormat,
}}


  onSelectSlot={({ start, end }) => {
    console.log("📅 Date clicked:", start, end);
  }}

  onSelectEvent={(event) => {
    if (event?.resource?.type === "time_off") {
      setSelectedTimeOff(event.resource);
      return;
    }

    setSelectedEvent(event.resource);
  }}

  eventPropGetter={(event) => {
    if (event?.resource?.type === "time_off") {
      return {
        style: {
          backgroundColor: "#dc2626",
          color: "white",
          borderRadius: "6px",
          border: "2px solid #991b1b",
          fontWeight: 800,
        },
      };
    }

    const assignedToMe = isAssignedToMe(event.resource);
    return {
      style: {
        backgroundColor: assignedToMe ? "#16a34a" : "#2563eb",
        borderRadius: "6px",
        color: "white",
        border: assignedToMe ? "2px solid #14532d" : "none",
        boxShadow: assignedToMe
          ? "0 0 8px rgba(22, 163, 74, 0.7)"
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
                <strong>Name:</strong> {selectedEvent.client.first_name}{" "}
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
                <strong>Schedule Type:</strong> {selectedEvent.schedule_type}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {formatTo12Hour(selectedEvent.start_time)} →{" "}
                {formatTo12Hour(selectedEvent.end_time)}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mt-3 mb-1">Assigned Cleaners</h4>
              {selectedEvent.client.cleaners?.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvent.client.cleaners.map((c) => {
                    const profile = c.profile;
                    const displayName = profile?.first_name || c.username;

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
              <AdminStartShift
                schedule={selectedEvent}
                onStarted={(shift) => {
                  alert("Admin shift started successfully!");
                  setSelectedEvent(null);
                }}
              />
            )}

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
      {!loading && <AdminActiveShiftPanel />}
{selectedTimeOff && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4">
      <h3 className="text-xl font-bold text-red-700">
        ⛔ Time Off Request
      </h3>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Name:</strong>{" "}
          {selectedTimeOff.request.owner.display_name}
        </p>

        <p>
          <strong>Role:</strong>{" "}
          {selectedTimeOff.request.owner.type}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          <span className="capitalize font-semibold">
            {selectedTimeOff.request.status}
          </span>
        </p>

        <p>
          <strong>Date:</strong>{" "}
          {format(
            new Date(selectedTimeOff.entry.request_date),
            "EEEE, MMM d, yyyy"
          )}
        </p>

        <p>
          <strong>Time:</strong>{" "}
          {selectedTimeOff.entry.is_all_day
            ? "All Day"
            : `${selectedTimeOff.entry.start_time} → ${selectedTimeOff.entry.end_time}`}
        </p>

        <p>
          <strong>Reason:</strong>{" "}
          {selectedTimeOff.request.description || (
            <span className="italic text-gray-400">
              No reason provided
            </span>
          )}
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={() => setSelectedTimeOff(null)}
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

function expandTimeOffRequests(rows) {
  const events = [];

  rows.forEach((r) => {
    const name = r.owner?.display_name || "Unknown";
    const role = r.owner?.type === "admin" ? "Admin" : "Staff";

    (r.entries || []).forEach((e, idx) => {
      const base = new Date(`${e.request_date}T00:00:00`);

      let start = new Date(base);
      let end = new Date(base);

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
        title: `⛔ ${name}`,
        start,
        end,
        allDay: e.is_all_day,
        resource: {
          type: "time_off",
          request: r,
          entry: e,
        },
      });
    });
  });

  return events;
}
