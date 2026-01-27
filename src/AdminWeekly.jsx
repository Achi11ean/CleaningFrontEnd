import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";

export default function AdminWeekly() {
  const { authAxios } = useAdmin();

  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all available weeks
  useEffect(() => {
    const loadWeeks = async () => {
      try {
        const res = await authAxios.get("/admin/reports/weeks");
        setWeeks(res.data || []);

        if (res.data && res.data.length > 0) {
          setSelectedWeek(res.data[0]); // default to most recent week
        }
      } catch (err) {
        setError("Failed to load weeks");
      }
    };

    loadWeeks();
  }, []);

  // Load report when week changes
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
      } catch (err) {
        setError("Failed to load weekly report");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [selectedWeek]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        ⏱️ Weekly Staff Hours
      </h2>

      {/* Week Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Select Week
        </label>
        <select
          value={selectedWeek?.week_start || ""}
          onChange={(e) => {
            const wk = weeks.find(
              (w) => w.week_start === e.target.value
            );
            setSelectedWeek(wk);
          }}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400"
        >
          {weeks.map((w) => (
            <option key={w.week_start} value={w.week_start}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-10 text-gray-500 font-semibold">
          Loading weekly report...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="py-6 text-red-600 font-semibold">
          {error}
        </div>
      )}

      {/* Report Table */}
      {!loading && !error && report && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Total Hours</th>
                <th className="px-4 py-3 text-left">Total Seconds</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.staff_totals.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No time entries for this week.
                  </td>
                </tr>
              )}

              {report.staff_totals.map((row) => (
                <tr key={row.staff_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">
                    {row.username}
                  </td>
                  <td className="px-4 py-3">
                    {row.total_hours} hrs
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {row.total_seconds}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
