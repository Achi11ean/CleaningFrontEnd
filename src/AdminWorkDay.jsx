import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";

export default function AdminWorkDay() {
  const { authAxios } = useAdmin();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLive = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAxios.get("/admin/reports/live");
      setData(res.data);
    } catch (err) {
      setError("Failed to load live workday data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLive();

    const interval = setInterval(() => {
      loadLive();
    }, 30000); // refresh every 30s

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🟢 Live Work Day
      </h2>

      {loading && (
        <div className="py-10 text-gray-500 font-semibold">
          Loading live clock data...
        </div>
      )}

      {error && (
        <div className="py-6 text-red-600 font-semibold">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="mb-4 text-gray-600">
            Active employees:{" "}
            <span className="font-semibold">
              {data.active_count}
            </span>
          </div>

          {data.active_count === 0 ? (
            <div className="py-10 text-gray-500 font-semibold text-center">
              No employees are currently clocked in.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-left">Clocked In At</th>
                    <th className="px-4 py-3 text-left">Time Worked</th>
                    <th className="px-4 py-3 text-left">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.active.map((row) => (
                    <tr key={row.entry_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">
                        {row.username}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(row.clock_in_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {formatDuration(row.current_seconds)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {row.current_hours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
