import { useEffect, useState, useMemo } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import WeeklyTimeCards from "./WeeklyTimeCards";

export default function AdminWeekly() {
  const { role, axios } = useAuthorizedAxios();

  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Load available weeks
  useEffect(() => {
    if (!axios) return;

    const loadWeeks = async () => {
      try {
        const res = await axios.get("/admin/reports/weeks");
        setWeeks(res.data || []);
        if (res.data?.length > 0) {
          setSelectedWeek(res.data[0]);
        }
      } catch {
        setError("Failed to load weeks");
      }
    };

    loadWeeks();
  }, [axios]);

  // ✅ Load report for selected week
  useEffect(() => {
    if (!selectedWeek || !axios) return;

    const loadReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get("/admin/reports/weekly", {
          params: { start: selectedWeek.week_start },
        });
        setReport(res.data);
      } catch {
        setError("Failed to load weekly report");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [selectedWeek, axios]);

  const filteredStaff = useMemo(() => {
    if (!report?.staff_totals) return [];
    return report.staff_totals.filter((row) => {
      const name = (row.full_name || row.username || "").toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  }, [report, searchTerm]);

  // 🔒 Block access (after hooks so hook order stays stable)
  if (!["admin", "manager"].includes(role)) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Weekly Staff Hours</h2>
        <p className="mt-0.5 text-sm text-slate-400">
          Review logged hours for each employee, week by week.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
        {/* Week Selector */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Select Week
          </label>
          <select
            value={selectedWeek?.week_start || ""}
            onChange={(e) =>
              setSelectedWeek(weeks.find((w) => w.week_start === e.target.value))
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {weeks.map((w) => (
              <option key={w.week_start} value={w.week_start}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Search Employee
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by employee name…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <span className="text-sm font-medium">Loading weekly report…</span>
        </div>
      )}

      {error && (
        <div className="my-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <WeeklyTimeCards
          staffList={filteredStaff}
          weekStart={selectedWeek?.week_start}
        />
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}