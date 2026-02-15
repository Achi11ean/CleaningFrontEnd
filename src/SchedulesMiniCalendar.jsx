import { useMemo, useState, useEffect } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
    addWeeks,
  addMonths,
  isAfter,
  isBefore,
  parseISO,
  format,
  isSameMonth,
  isSameDay,
} from "date-fns";

export default function SchedulesMiniCalendar({
  schedules,
  onEdit,
  onDelete,
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { axios } = useAuthorizedAxios();
const [selectedAppointment, setSelectedAppointment] = useState(null);
const [editingAppt, setEditingAppt] = useState(false);
const [apptForm, setApptForm] = useState({});
const saveAppointment = async () => {
  try {
    await axios.patch(
      `/clients/${selectedAppointment.client_id}/appointments/${selectedAppointment.id}`,
      apptForm
    );

    setSelectedAppointment(null);
    setEditingAppt(false);

    // reload appointments
    const res = await axios.get("/appointments");
    setAppointments(res.data);
  } catch (err) {
    alert(err.response?.data?.error || "Failed to update appointment");
  }
};

const deleteAppointment = async () => {
  if (!window.confirm("Delete this consultation?")) return;

  try {
    await axios.delete(
      `/clients/${selectedAppointment.client_id}/appointments/${selectedAppointment.id}`
    );

    setSelectedAppointment(null);

    const res = await axios.get("/appointments");
    setAppointments(res.data);
  } catch (err) {
    alert(err.response?.data?.error || "Failed to delete appointment");
  }
};

  const [appointments, setAppointments] = useState([]);
useEffect(() => {
  if (!axios) return;

  axios
    .get("/appointments")
    .then(res => setAppointments(res.data))
    .catch(err => console.error("Failed to load consultations", err));
}, [axios]);


const { canceledMap, replacementMap } = useMemo(() => {
  const canceled = {};
  const replacements = {};

  schedules.forEach((s) => {
    if (!s.exceptions) return;

    s.exceptions.forEach((ex) => {
      // ❌ cancel original occurrence
      const cancelKey = `${s.id}-${ex.original_date}`;
      canceled[cancelKey] = true;

      // ➡️ add replacement occurrence
      if (ex.replacement_date) {
        replacements[ex.replacement_date] =
          replacements[ex.replacement_date] || [];

   replacements[ex.replacement_date].push({
  schedule: s,                 // 👈 keep the real schedule intact
  occurrenceDate: ex.replacement_date,
  isException: true,
  exceptionId: ex.id,
  originalDate: ex.original_date,
});


      }
    });
  });

  return { canceledMap: canceled, replacementMap: replacements };
}, [schedules]);


  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });

    const days = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentMonth]);

 const schedulesByDate = useMemo(() => {
  const map = {};

  const rangeStart = startOfMonth(currentMonth);
  const rangeEnd = endOfMonth(currentMonth);

  // ─────────────────────────────
  // BUILD CLEANING SCHEDULE MAP
  // ─────────────────────────────
  schedules.forEach((s) => {
    if (!s.start_date) return;

    const start = parseISO(s.start_date);

    // ONE-TIME
    if (s.schedule_type === "one_time") {
      const key = format(start, "yyyy-MM-dd");
      map[key] = map[key] || [];
      map[key].push(s);
      return;
    }

    // RECURRING
    let cursor = start;

    while (!isAfter(cursor, rangeEnd)) {
      if (!isBefore(cursor, rangeStart)) {
        const key = format(cursor, "yyyy-MM-dd");
        const cancelKey = `${s.id}-${key}`;

        if (!canceledMap[cancelKey]) {
          map[key] = map[key] || [];
          map[key].push(s);
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
  });

  // ─────────────────────────────
  // INJECT REPLACEMENTS
  // ─────────────────────────────
  Object.entries(replacementMap).forEach(([date, schedules]) => {
    map[date] = map[date] || [];
    map[date].push(...schedules);
  });

  // ─────────────────────────────
  // ADD CONSULTATION APPOINTMENTS (LAST!)
  // ─────────────────────────────
  appointments.forEach(appt => {
    if (!appt.scheduled_for) return;

    const key = format(parseISO(appt.scheduled_for), "yyyy-MM-dd");

    map[key] = map[key] || [];

    map[key].push({
      isAppointment: true,
      appointment: appt,
    });
  });

  return map;
}, [schedules, appointments, currentMonth, canceledMap, replacementMap]);

const [actionCtx, setActionCtx] = useState(null);

const formatTime = (timeStr) => {
  if (!timeStr) return "";

  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(h, m);

  return format(date, "h:mm a");
};


  return (
    <div className="rounded-2xl border bg-white shadow p-4 space-y-3">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
            )
          }
          className="px-2 py-1 rounded hover:bg-gray-100"
        >
          ◀
        </button>

        <h3 className="font-bold text-lg">
          {format(currentMonth, "MMMM yyyy")}
        </h3>

        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
            )
          }
          className="px-2 py-1 rounded hover:bg-gray-100"
        >
          ▶
        </button>
      </div>

      {/* DAYS */}
      <div className="grid grid-cols-7 text-xs font-semibold text-gray-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-1 text-xs">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const daySchedules = schedulesByDate[dateKey] || [];

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[90px] rounded-lg border p-1
                ${!isSameMonth(day, currentMonth) ? "bg-gray-50 text-gray-400" : ""}
                ${isSameDay(day, new Date()) ? "ring-2 ring-blue-400" : ""}
              `}
            >
              <div className="font-bold text-[11px] mb-1">
                {format(day, "d")}
              </div>

              <div className="space-y-1">
             {daySchedules.map((item) => {

if (item.isAppointment) {
  const appt = item.appointment;

  return (
    <div
      key={`appt-${appt.id}`}
onClick={() => {
  setSelectedAppointment(appt);
  setApptForm({
    scheduled_for: appt.scheduled_for,
    notes: appt.notes || "",
    assigned_user_id: appt.assigned_user_id || "",
    assigned_user_type: appt.assigned_user_type || "",
  });
  setEditingAppt(false);
}}
      className="
        cursor-pointer rounded
        bg-pink-100 text-pink-800
        px-1 py-0.5 truncate
        hover:bg-pink-200
      "
      title={`Consultation: ${appt.client_name}`}
    >
      🩷 {format(parseISO(appt.scheduled_for), "h:mm a")} {appt.client_name}
    </div>
  );
}


  // 🧼 CLEANING SCHEDULE
  const schedule = item.schedule || item;
  const occurrenceDate = item.occurrenceDate || dateKey;

  const key = item.isException
    ? `ex-${item.exceptionId}-${occurrenceDate}`
    : `sch-${schedule.id}-${occurrenceDate}`;

  return (
  <div
  key={key}
  onClick={() =>
    onEdit({
      schedule,
      occurrenceDate,
      isException: item.isException || false,
      exceptionId: item.exceptionId || null,
    })
  }
  className="
    cursor-pointer rounded bg-blue-100 text-blue-800
    px-1 py-0.5 truncate hover:bg-blue-200
  "
  title={`${schedule.client?.first_name} ${schedule.client?.last_name}`}
>
  🧼 {formatTime(schedule.start_time)} {schedule.client?.first_name}
</div>

  );
})}

              </div>
            </div>
          );
        })}
      </div>
     {selectedAppointment && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-[420px] space-y-4">

      <h3 className="text-xl font-bold text-pink-700">
        Consultation Appointment
      </h3>

      {!editingAppt ? (
        <>
          {/* VIEW MODE */}
          <div className="space-y-2 text-sm">

            <div>
              <span className="font-semibold">Client:</span>{" "}
              {selectedAppointment.client_name}
            </div>

            <div>
              <span className="font-semibold">Date:</span>{" "}
              {format(parseISO(selectedAppointment.scheduled_for), "PPP")}
            </div>

            <div>
              <span className="font-semibold">Time:</span>{" "}
              {format(parseISO(selectedAppointment.scheduled_for), "h:mm a")}
            </div>

            <div>
              <span className="font-semibold">Assigned:</span>{" "}
              {selectedAppointment.assigned_user_name || "Unassigned"}
            </div>

            <div>
              <span className="font-semibold">Notes:</span>
              <p className="text-gray-600 mt-1">
                {selectedAppointment.notes || "No notes"}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-2 pt-3">
            <button
              onClick={() => setEditingAppt(true)}
              className="flex-1 px-3 py-2 rounded bg-blue-600 text-white"
            >
              Edit
            </button>

            <button
              onClick={deleteAppointment}
              className="flex-1 px-3 py-2 rounded bg-red-600 text-white"
            >
              Delete
            </button>

            <button
              onClick={() => setSelectedAppointment(null)}
              className="flex-1 px-3 py-2 rounded bg-gray-300"
            >
              Close
            </button>
          </div>
        </>
      ) : (
        <>
          {/* EDIT MODE */}
          <div className="space-y-3">

            <div>
              <label className="text-xs font-semibold">Date & Time</label>
              <input
                type="datetime-local"
                value={apptForm.scheduled_for.slice(0, 16)}
                onChange={(e) =>
                  setApptForm({
                    ...apptForm,
                    scheduled_for: e.target.value,
                  })
                }
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Notes</label>
              <textarea
                rows={3}
                value={apptForm.notes}
                onChange={(e) =>
                  setApptForm({ ...apptForm, notes: e.target.value })
                }
                className="w-full border rounded p-2"
              />
            </div>

          </div>

          {/* ACTIONS */}
          <div className="flex gap-2 pt-3">
            <button
              onClick={saveAppointment}
              className="flex-1 px-3 py-2 rounded bg-green-600 text-white"
            >
              Save
            </button>

            <button
              onClick={() => setEditingAppt(false)}
              className="flex-1 px-3 py-2 rounded bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </>
      )}

    </div>
  </div>
)}


    </div>
  );
}
