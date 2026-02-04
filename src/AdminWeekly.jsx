import { useEffect, useState, useMemo } from "react";
import { useAdmin } from "./AdminContext";
import WeeklyTimeCards from "./WeeklyTimeCards";

export default function AdminWeekly() {
  const { authAxios } = useAdmin();

  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load available weeks
  useEffect(() => {
    const loadWeeks = async () => {
      try {
        const res = await authAxios.get("/admin/reports/weeks");
        setWeeks(res.data || []);
        if (res.data?.length > 0) {
          setSelectedWeek(res.data[0]);
        }
      } catch {
        setError("Failed to load weeks");
      }
    };
    loadWeeks();
  }, []);

  // Load report for selected week
  useEffect(() => {
    if (!selectedWeek) return;
    const loadReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authAxios.get("/admin/reports/weekly", {
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
  }, [selectedWeek]);

  const filteredStaff = useMemo(() => {
    if (!report?.staff_totals) return [];
    return report.staff_totals.filter((row) => {
      const name = (row.full_name || row.username || "").toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
  }, [report, searchTerm]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        ⏱️ Weekly Staff Hours
      </h2>

      {/* Week Selector */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Select Week
        </label>
        <select
          value={selectedWeek?.week_start || ""}
          onChange={(e) =>
            setSelectedWeek(
              weeks.find((w) => w.week_start === e.target.value)
            )
          }
          className="w-full sm:max-w-xs px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400"
        >
          {weeks.map((w) => (
            <option key={w.week_start} value={w.week_start}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by employee name..."
          className="w-full sm:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-10 text-gray-500 font-semibold">
          Loading weekly report...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="py-6 text-red-600 font-semibold">{error}</div>
      )}

      {/* Cards */}
     {!loading && !error && (
  <WeeklyTimeCards
    staffList={filteredStaff}
    weekStart={selectedWeek?.week_start}
  />
)}

    </div>
  );
}
