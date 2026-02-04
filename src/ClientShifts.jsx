import React from "react";
import {
  formatDuration,
  intervalToDuration,
  parseISO,
  format,
} from "date-fns";

/* ---------- Helpers ---------- */

function getFullName(shift) {
  const profile = shift.staff?.profile || shift.admin?.profile;

  if (profile?.first_name || profile?.last_name) {
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  }

  return shift.staff?.username || shift.admin?.username || "Unknown";
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return format(new Date(iso), "MMM d, yyyy • h:mm a");
}

function getDuration(start, end) {
  try {
    const dur = intervalToDuration({
      start: parseISO(start),
      end: parseISO(end),
    });
    return formatDuration(dur, { format: ["hours", "minutes"] });
  } catch {
    return "—";
  }
}

/* ---------- Component ---------- */

export default function ClientShifts({ shifts = [] }) {
  if (!shifts.length) {
    return <p className="text-gray-500 italic">No shifts found.</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {shifts.map((shift) => {
        const name = getFullName(shift);
        const role = shift.staff ? "Staff" : "Admin";

        return (
          <div
            key={shift.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">
                👤 {name}
              </div>

              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  role === "Staff"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-sky-100 text-sky-700"
                }`}
              >
                {role}
              </span>
            </div>

            {/* Times */}
            <div className="text-sm text-gray-600 leading-relaxed">
              ⏱ <strong>Check‑In:</strong>{" "}
              {formatDateTime(shift.check_in_at)}
              <br />
              ⌛ <strong>Check‑Out:</strong>{" "}
              {formatDateTime(shift.check_out_at)}
              <br />
              ⌚ <strong>Duration:</strong>{" "}
              {shift.check_out_at
                ? getDuration(shift.check_in_at, shift.check_out_at)
                : "Still working"}
            </div>

            {/* Notes */}
            {shift.message && (
              <div className="text-sm bg-amber-50 border-l-4 border-amber-400 p-2 rounded">
                📝 <em>{shift.message}</em>
              </div>
            )}

            {/* Photos */}
            {shift.image_urls?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {shift.image_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Shift photo ${i + 1}`}
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
