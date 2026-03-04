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

  // 🔒 Block access early
  if (!["admin", "manager"].includes(role)) {
    return null;
  }

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

      {loading && (
        <div className="py-10 text-gray-500 font-semibold">
          Loading weekly report...
        </div>
      )}

      {error && (
        <div className="py-6 text-red-600 font-semibold">{error}</div>
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