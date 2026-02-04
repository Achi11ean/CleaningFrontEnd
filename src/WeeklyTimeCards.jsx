import { useState } from "react";
import { useAdmin } from "./AdminContext";
import EditTimeCard from "./EditTimeCards";
export default function WeeklyTimeCards({ staffList, weekStart }) {
  const { authAxios } = useAdmin();
  const [expandedStaffId, setExpandedStaffId] = useState(null);
  const [entryMap, setEntryMap] = useState({});
  const [loadingStaffId, setLoadingStaffId] = useState(null);

  const toggleStaff = async (staffId) => {
    if (expandedStaffId === staffId) {
      setExpandedStaffId(null);
      return;
    }

    if (!entryMap[staffId]) {
      setLoadingStaffId(staffId);
      try {
        const res = await authAxios.get(
          `/admin/reports/weekly/${staffId}/entries`,
          {
            params: { start: weekStart },
          }
        );
        setEntryMap((prev) => ({ ...prev, [staffId]: res.data }));
      } catch (err) {
        console.error("Failed to load entries", err);
      } finally {
        setLoadingStaffId(null);
      }
    }

    setExpandedStaffId(staffId);
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {staffList.map((row) => (
       <div
  key={row.staff_id}
  className="rounded-xl border border-gray-200 bg-white shadow-sm transition p-4 space-y-2"
>
  <div
    className="cursor-pointer hover:text-emerald-700"
    onClick={() => toggleStaff(row.staff_id)}
  >
    <div className="text-lg font-semibold text-gray-800">
      {row.full_name || row.username}
    </div>
    <div className="text-sm text-gray-600">
      Total Hours:{" "}
      <span className="font-bold text-emerald-700">
        {row.total_hours}
      </span>
    </div>
    <div className="text-xs text-gray-400">
      Total Seconds: {row.total_seconds}
    </div>
  </div>

          {/* Expanded Section */}
          {expandedStaffId === row.staff_id && (
            <div className="mt-4 space-y-2">
              {loadingStaffId === row.staff_id ? (
                <div className="text-gray-400 italic">Loading entries...</div>
              ) : entryMap[row.staff_id]?.length > 0 ? (
                entryMap[row.staff_id].map((entry) => (
                 <EditTimeCard
  entry={entry}
  onUpdate={(updated) => {
    setEntryMap((prev) => ({
      ...prev,
      [row.staff_id]: prev[row.staff_id].map((e) =>
        e.id === updated.id ? updated : e
      ),
    }));
  }}
  onDelete={(deletedId) => {
    setEntryMap((prev) => ({
      ...prev,
      [row.staff_id]: prev[row.staff_id].filter((e) => e.id !== deletedId),
    }));
  }}
/>

                ))
              ) : (
                <div className="text-gray-400 italic">No entries found.</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
