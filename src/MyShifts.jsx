import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import { format } from "date-fns";

export default function MyShifts({ mode = "staff" }) {
  // mode: "staff" | "admin"
  const { authAxios } = useStaff();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
const formatTo12Hour = (timeStr) => {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return format(date, "h:mm a"); // 12-hour with am/pm
};
  const loadShifts = async () => {
    try {
      setLoading(true);

      const url =
        mode === "admin"
          ? "/admin/shifts"
          : "/staff/shifts";

      const res = await authAxios.get(url);
      setShifts(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const [viewImages, setViewImages] = useState([]);


const formatDayOfWeek = (num) => {
  if (num === null || num === undefined) return null;
  return WEEKDAYS[num] || `Day ${num}`;
};

  useEffect(() => {
    loadShifts();
  }, [mode]);

  
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
    <div className="space-y-4">

      <h2 className="text-2xl font-bold">
        🧾 {mode === "admin" ? "All Work Shifts" : "My Work Shifts"}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border rounded-lg text-sm">
          <thead className="bg-gray-100">
            <tr>
              {mode === "admin" && (
                <th className="p-2 border text-left">Staff</th>
              )}

              <th className="p-2 border text-left">Client</th>
              <th className="p-2 border text-left">Assigned Team</th>
              <th className="p-2 border text-left">Schedule</th>

              <th className="p-2 border text-left">Check In</th>
              <th className="p-2 border text-left">Check Out</th>
              <th className="p-2 border text-left">Duration</th>
              <th className="p-2 border text-left">Notes</th>
              <th className="p-2 border text-left">Photo</th>
            </tr>
          </thead>

          <tbody>
            {shifts.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 align-top">

                {/* STAFF (ADMIN MODE ONLY) */}
                {mode === "admin" && (
                  <td className="p-2 border font-medium">
                    {s.staff?.username || s.staff_id}
                  </td>
                )}

                {/* CLIENT */}
                <td className="p-2 border font-semibold">
                  {s.client?.first_name} {s.client?.last_name}
                </td>

                {/* ASSIGNED TEAM */}
                <td className="p-2 border text-xs">
                  {s.client?.cleaners?.length > 0 ? (
                    <div className="space-y-1">
                      {s.client.cleaners.map((c) => {
                        const name =
                          c.profile?.first_name ||
                          c.username;

                        return (
                          <div key={c.assignment_id}>
                            • {name} ({c.type})
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="italic text-gray-400">None</span>
                  )}
                </td>

                {/* SCHEDULE */}
                <td className="p-2 border text-xs">
                  {s.schedule ? (
                    <div className="space-y-1">
                      <div className="font-semibold capitalize">
                        {s.schedule.schedule_type.replace("_", " ")}
                      </div>

                   <div>
  {formatTo12Hour(s.schedule.start_time)} →{" "}
  {formatTo12Hour(s.schedule.end_time)}
</div>

{s.schedule.day_of_week !== null && (
  <div className="text-gray-600 font-medium">
    {formatDayOfWeek(s.schedule.day_of_week)}
  </div>
)}


                      {s.schedule.description && (
                        <div className="italic text-gray-500">
                          {s.schedule.description}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="italic text-gray-400">
                      Manual / Unscheduled
                    </span>
                  )}
                </td>

                {/* CHECK IN */}
                <td className="p-2 border">
                  {formatDateTime(s.check_in_at)}
                </td>

                {/* CHECK OUT */}
                <td className="p-2 border">
                  {formatDateTime(s.check_out_at)}
                </td>

                {/* DURATION */}
                <td className="p-2 border font-semibold">
                  {formatDuration(s.duration_seconds)}
                </td>

                {/* NOTES */}
                <td className="p-2 border max-w-xs text-xs">
                  {s.message || "—"}
                </td>

                {/* PHOTO */}
<td className="p-2 border">
  {Array.isArray(s.image_urls) && s.image_urls.length > 0 ? (
    <button
      onClick={() => setViewImages(s.image_urls)}
      className="text-blue-600 hover:underline font-semibold"
    >
      View ({s.image_urls.length})
    </button>
  ) : (
    "—"
  )}
</td>



              </tr>
            ))}
          </tbody>
        </table>
      {viewImages.length > 0 && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-4 max-w-4xl w-full mx-4 relative">

      <button
        onClick={() => setViewImages([])}
        className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl font-bold"
      >
        ✕
      </button>

      <h3 className="font-semibold mb-3">
        Shift Photos ({viewImages.length})
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {viewImages.map((url, idx) => (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={url}
              alt={`Shift photo ${idx + 1}`}
              className="h-40 w-full object-cover rounded hover:opacity-90 transition"
            />
          </a>
        ))}
      </div>

    </div>
  </div>
)}


      </div>
    </div>
  );
}
