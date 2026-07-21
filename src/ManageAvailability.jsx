import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { toast } from "react-toastify";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function to12Hour(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const hour = h % 12 || 12;
  const period = h >= 12 ? "PM" : "AM";
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function initialsFrom(owner) {
  const source = owner?.display_name || owner?.username || "";
  const parts = source.trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || "•";
}

export default function ManageAvailability() {
  const { role, axios } = useAuthorizedAxios();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const matchedDay =
    normalizedSearch.length > 0
      ? DAYS.find((day) => day.startsWith(normalizedSearch))
      : null;

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/availability/all");
      setRows(res.data || []);
    } catch {
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [axios]);

  const updateSlot = (rowId, day, field, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              weekly: {
                ...r.weekly,
                [day]: {
                  ...(r.weekly?.[day] || { start: "", end: "" }),
                  [field]: value,
                },
              },
            }
          : r
      )
    );
  };

  const saveAvailability = async (row) => {
    try {
      setSavingId(row.id);
      await axios.patch(`/admin/staff/${row.owner.id}/availability`, {
        weekly: row.weekly,
      });
      toast.success("Availability updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const toggleLock = async (row) => {
    try {
      if (row.owner.type !== "staff") return;

      await axios.patch(`/admin/staff/${row.owner.id}/availability/lock`, {
        is_locked: !row.is_locked,
      });

      toast.success(row.is_locked ? "Unlocked" : "Locked");
      load();
    } catch {
      toast.error("Failed to update lock");
    }
  };

  const lockAll = async () => {
    await axios.patch("/admin/availability/lock-all");
    toast.success("All availability locked");
    load();
  };

  const unlockAll = async () => {
    await axios.patch("/admin/availability/unlock-all");
    toast.success("All availability unlocked");
    load();
  };

  // 🔐 Admins + Managers only (after hooks so hook order stays stable)
  if (!axios || (role !== "admin" && role !== "manager")) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">
        You don't have access to this page.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        <span className="text-sm font-medium">Loading availability…</span>
      </div>
    );
  }

  const filteredRows = rows.filter((row) => {
    if (!normalizedSearch) return true;

    const nameMatch =
      row.owner.display_name?.toLowerCase().includes(normalizedSearch) ||
      row.owner.username?.toLowerCase().includes(normalizedSearch);

    if (matchedDay) {
      const slot = row.weekly?.[matchedDay];
      return Boolean(slot && slot.start && slot.end);
    }

    return nameMatch;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employee Availability</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Set weekly hours and lock schedules so they can't be changed.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search by name or day (e.g. monday)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* GLOBAL CONTROLS */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={lockAll}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          <LockIcon />
          Lock All
        </button>
        <button
          onClick={unlockAll}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <UnlockIcon />
          Unlock All
        </button>
      </div>

      {filteredRows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-500">
            No availability matches your search.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Try a different name, or a weekday like “tuesday.”
          </p>
        </div>
      )}

      {filteredRows.map((row) => {
        const locked = row.is_locked;

        return (
          <div
            key={row.id}
            className={`overflow-hidden rounded-2xl border shadow-sm transition-shadow duration-300 hover:shadow-md hover:shadow-slate-300/40 ${
              locked ? "border-slate-200 bg-slate-50/80" : "border-slate-200 bg-white"
            }`}
          >
            {/* CARD HEADER */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${
                    locked
                      ? "bg-gradient-to-br from-slate-400 to-slate-500"
                      : "bg-gradient-to-br from-blue-600 to-cyan-500"
                  }`}
                >
                  {initialsFrom(row.owner)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">
                    {row.owner.display_name}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {row.owner.type}
                    {row.owner.role ? ` • ${row.owner.role}` : ""}
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-slate-600">
                        <LockIcon className="h-3 w-3" />
                        Locked
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {row.owner.type === "staff" && (
                <button
                  onClick={() => toggleLock(row)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    locked
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  }`}
                >
                  {locked ? <UnlockIcon className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
                  {locked ? "Unlock" : "Lock"}
                </button>
              )}
            </div>

            {/* WEEKLY GRID */}
            <div className="grid grid-cols-1 gap-2.5 p-4 md:grid-cols-2">
              {(matchedDay ? [matchedDay] : DAYS).map((day) => {
                const slot = row.weekly?.[day];
                const available = Boolean(slot);

                return (
                  <div
                    key={day}
                    className={`rounded-xl border p-3 transition ${
                      available
                        ? "border-slate-200 bg-white"
                        : "border-slate-100 bg-slate-50/60"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          available ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <strong className="text-sm font-semibold capitalize text-slate-700">
                        {day}
                      </strong>
                    </div>

                    {!available ? (
                      <p className="text-sm text-slate-400">Unavailable</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="time"
                            value={slot.start}
                            disabled={locked}
                            onChange={(e) =>
                              updateSlot(row.id, day, "start", e.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          />
                          <span className="text-slate-400">→</span>
                          <input
                            type="time"
                            value={slot.end}
                            disabled={locked}
                            onChange={(e) =>
                              updateSlot(row.id, day, "end", e.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                        <p className="text-xs font-medium text-slate-400">
                          {to12Hour(slot.start)} – {to12Hour(slot.end)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!locked && (
              <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                <button
                  onClick={() => saveAvailability(row)}
                  disabled={savingId === row.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:shadow-md hover:shadow-blue-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60"
                >
                  {savingId === row.id ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving…
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================= INLINE ICONS ================= */
function SearchIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${className}`}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

function LockIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function UnlockIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 7.5-1.8" />
    </svg>
  );
}