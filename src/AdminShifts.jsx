import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";
import { format } from "date-fns";

export default function AdminShifts({ mode = "me" }) {
  const { authAxios } = useAdmin();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const loadShifts = async () => {
    try {
      setLoading(true);

      const url =
        mode === "all"
          ? "/admin/shifts"
          : "/admin/shifts/me";

      const res = await authAxios.get(url);
      setShifts(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [mode]);

  const WEEKDAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const formatDayOfWeek = (num) => {
    if (num === null || num === undefined) return null;
    return WEEKDAYS[num] || `Day ${num}`;
  };

  const formatTo12Hour = (timeStr) => {
    if (!timeStr) return "—";
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return format(date, "h:mm a");
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    return format(new Date(iso), "MMM d, yyyy • h:mm a");
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) return <p>Loading shift history...</p>;

  if (shifts.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-xl p-4 text-gray-600 italic">
        No shifts found.
      </div>
    );
  }

return (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">
      🧾 {mode === "all" ? "All Work Shifts" : "My Admin Shifts"}
    </h2>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {shifts.map((s) => (
        <div
          key={s.id}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-5 space-y-4"
        >
          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-extrabold text-gray-800">
                {s.client?.first_name} {s.client?.last_name}
              </h3>

            {mode === "all" && (
  <p className="text-xs text-gray-500 font-medium">
    {s.owner_type === "admin" ? (
      <>
        {s.admin?.profile?.first_name || s.admin?.username}{" "}
        {s.admin?.profile?.last_name || ""}
        <span className="ml-1 italic text-gray-400">(admin)</span>
      </>
    ) : (
      <>
        {s.staff?.profile?.first_name || s.staff?.username}{" "}
        {s.staff?.profile?.last_name || ""}
        <span className="ml-1 italic text-gray-400">(staff)</span>
      </>
    )}
  </p>
)}

            </div>

            <span className="text-sm font-bold text-emerald-700">
              {formatDuration(s.duration_seconds)}
            </span>
          </div>

          {/* SCHEDULE */}
          <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
            {s.schedule ? (
              <>
                <div className="font-semibold capitalize">
                  {s.schedule.schedule_type.replace("_", " ")}
                </div>

                <div>
                  ⏰ {formatTo12Hour(s.schedule.start_time)} →{" "}
                  {formatTo12Hour(s.schedule.end_time)}
                </div>

                {s.schedule.day_of_week !== null && (
                  <div className="text-gray-600 font-medium">
                    📅 {formatDayOfWeek(s.schedule.day_of_week)}
                  </div>
                )}

                {s.schedule.description && (
                  <div className="italic text-gray-500">
                    {s.schedule.description}
                  </div>
                )}
              </>
            ) : (
              <span className="italic text-gray-400">
                Manual / Unscheduled
              </span>
            )}
          </div>

          {/* TIMES */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500 font-semibold">
                Check In
              </div>
              <div>{formatDateTime(s.check_in_at)}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500 font-semibold">
                Check Out
              </div>
              <div>{formatDateTime(s.check_out_at)}</div>
            </div>
          </div>

          {/* TEAM */}
          <div>
            <div className="text-xs text-gray-500 font-semibold mb-1">
              Assigned Team
            </div>

            {s.client?.cleaners?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {s.client.cleaners.map((c) => {
                  const name =
                    c.profile?.first_name || c.username;

                  return (
                    <span
                      key={c.assignment_id}
                      className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"
                    >
                      {name} ({c.type})
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="italic text-gray-400 text-sm">
                None assigned
              </span>
            )}
          </div>

          {/* NOTES */}
          <div>
            <div className="text-xs text-gray-500 font-semibold mb-1">
              Notes
            </div>
            <p className="text-sm text-gray-700">
              {s.message || "—"}
            </p>
          </div>

          {/* PHOTOS */}
          <div>
            <div className="text-xs text-gray-500 font-semibold mb-1">
              Photos
            </div>

            {s.image_urls && s.image_urls.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {s.image_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Shift photo ${i + 1}`}
                    onClick={() => setViewImageUrl(url)}
                    className="w-14 h-14 object-cover rounded-lg cursor-pointer hover:brightness-110"
                  />
                ))}
              </div>
            ) : (
              <span className="italic text-gray-400 text-sm">
                No photos
              </span>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* IMAGE MODAL (unchanged) */}
    {viewImageUrl && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-4 max-w-3xl w-full mx-4 relative">
          <button
            onClick={() => setViewImageUrl(null)}
            className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl font-bold"
          >
            ✕
          </button>

          <img
            src={viewImageUrl}
            alt="Shift Photo"
            className="w-full max-h-[80vh] object-contain rounded"
          />
        </div>
      </div>
    )}
  </div>
);

}
