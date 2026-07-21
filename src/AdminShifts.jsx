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

      const url = mode === "all" ? "/admin/shifts" : "/admin/shifts/me";

      const res = await authAxios.get(url);
      setShifts(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [mode]);

  // Close modal on Escape + lock scroll while open
  useEffect(() => {
    if (!viewImageUrl) return;
    const onKey = (e) => e.key === "Escape" && setViewImageUrl(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [viewImageUrl]);

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

  const initials = (s) => {
    const a = s.client?.first_name?.[0] || "";
    const b = s.client?.last_name?.[0] || "";
    return (a + b).toUpperCase() || "•";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
        <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
        <span className="text-sm font-medium">Loading shift history…</span>
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-500">No shifts found.</p>
        <p className="mt-1 text-xs text-slate-400">
          Completed shifts will appear here once they're logged.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {mode === "all" ? "All Work Shifts" : "My Admin Shifts"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {shifts.length} {shifts.length === 1 ? "shift" : "shifts"} logged
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {shifts.map((s) => (
          <div
            key={s.id}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md hover:shadow-slate-300/40"
          >
            {/* HEADER */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white shadow-sm">
                  {initials(s)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-slate-800">
                    {s.client?.first_name} {s.client?.last_name}
                  </h3>

                  {mode === "all" && (
                    <p className="truncate text-xs font-medium text-slate-500">
                      {s.owner_type === "admin" ? (
                        <>
                          {s.admin?.profile?.first_name || s.admin?.username}{" "}
                          {s.admin?.profile?.last_name || ""}
                          <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            admin
                          </span>
                        </>
                      ) : (
                        <>
                          {s.staff?.profile?.first_name || s.staff?.username}{" "}
                          {s.staff?.profile?.last_name || ""}
                          <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            staff
                          </span>
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                {formatDuration(s.duration_seconds)}
              </span>
            </div>

            <div className="space-y-4 p-5">
              {/* SCHEDULE */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm">
                {s.schedule ? (
                  <div className="space-y-1.5">
                    <div className="font-semibold capitalize text-slate-700">
                      {s.schedule.schedule_type.replace("_", " ")}
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <ClockIcon />
                      <span>
                        {formatTo12Hour(s.schedule.start_time)} →{" "}
                        {formatTo12Hour(s.schedule.end_time)}
                      </span>
                    </div>

                    {s.schedule.day_of_week !== null && (
                      <div className="flex items-center gap-2 font-medium text-slate-600">
                        <CalendarIcon />
                        <span>{formatDayOfWeek(s.schedule.day_of_week)}</span>
                      </div>
                    )}

                    {s.schedule.description && (
                      <div className="italic text-slate-400">
                        {s.schedule.description}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="italic text-slate-400">Manual / Unscheduled</span>
                )}
              </div>

              {/* TIMES */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Check In
                  </div>
                  <div className="mt-0.5 text-sm text-slate-700">
                    {formatDateTime(s.check_in_at)}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Check Out
                  </div>
                  <div className="mt-0.5 text-sm text-slate-700">
                    {formatDateTime(s.check_out_at)}
                  </div>
                </div>
              </div>

              {/* TEAM */}
              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Assigned Team
                </div>

                {s.client?.cleaners?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {s.client.cleaners.map((c) => {
                      const name = c.profile?.first_name || c.username;

                      return (
                        <span
                          key={c.assignment_id}
                          className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100"
                        >
                          {name}
                          <span className="ml-1 font-normal text-blue-400">
                            {c.type}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-sm italic text-slate-400">None assigned</span>
                )}
              </div>

              {/* NOTES */}
              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Notes
                </div>
                <p className="text-sm text-slate-600">{s.message || "—"}</p>
              </div>

              {/* PHOTOS */}
              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Photos
                </div>

                {s.image_urls && s.image_urls.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {s.image_urls.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setViewImageUrl(url)}
                        className="overflow-hidden rounded-lg ring-1 ring-slate-200 transition hover:ring-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <img
                          src={url}
                          alt={`Shift photo ${i + 1}`}
                          loading="lazy"
                          className="h-14 w-14 object-cover transition-transform duration-300 hover:scale-110"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm italic text-slate-400">No photos</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* IMAGE MODAL */}
      {viewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setViewImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Shift photo"
        >
          <div
            className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-slate-900/90 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewImageUrl(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/70 text-lg text-slate-200 transition-colors hover:bg-blue-500/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              ✕
            </button>

            <img
              src={viewImageUrl}
              alt="Shift photo"
              className="max-h-[80vh] w-full bg-slate-950/60 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* Inline icons — keep the layout dependency-free */
function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-slate-400"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-slate-400"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </svg>
  );
}