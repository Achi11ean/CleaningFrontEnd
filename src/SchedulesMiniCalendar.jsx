import { useMemo, useState } from "react";
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
  ...s,
  _isException: true,
  _originalDate: ex.original_date,
  _exceptionId: ex.id,          // ✅ THIS IS CRITICAL
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

  // ✅ INJECT replacement occurrences HERE
  Object.entries(replacementMap).forEach(([date, schedules]) => {
    map[date] = map[date] || [];
    map[date].push(...schedules);
  });

  return map;
}, [schedules, currentMonth, canceledMap, replacementMap]);
const [actionCtx, setActionCtx] = useState(null);



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
                {daySchedules.map((s) => (
                  <div
                    key={s.id}
onClick={() =>
  onEdit({
    schedule: s,
    occurrenceDate: dateKey,
    isException: s._isException,
    exceptionId: s._exceptionId,
  })
}

                    className="
                      cursor-pointer rounded bg-blue-100 text-blue-800
                      px-1 py-0.5 truncate hover:bg-blue-200
                    "
                    title={`${s.client?.first_name} ${s.client?.last_name}`}
                  >
                    {s.client?.first_name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
