import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

export default function BossTimeOff() {
  const { role, axios } = useAuthorizedAxios();

  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const formatDateWithWeekday = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00"); // avoid timezone drift
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

  if (!axios || (role !== "admin" && role !== "manager")) {
    return (
      <p className="text-red-600 font-semibold">
        Admin or Manager access required.
      </p>
    );
  }

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/time-off/all", {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load time off requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const setStatus = async (id, status) => {
    await axios.patch(`/time-off/${id}`, { status });
    fetchRequests();
  };

  const deleteRequest = async (id) => {
    if (!window.confirm("Delete this time off request?")) return;
    await axios.delete(`/time-off/${id}`);
    fetchRequests();
  };

  if (loading) {
    return <p className="italic text-gray-500">Loading time off requests…</p>;
  }

  if (error) {
    return <p className="text-red-600 font-semibold">{error}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          🧠 Time Off Approvals
        </h2>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-10 text-gray-500 italic">
          No time off requests found 🌤️
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-5"
            >
              {/* Top Row */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
             
<div className="flex items-center gap-2 flex-wrap">

  {/* Owner badge */}


  {/* 👤 Owner name (THIS WAS MISSING) */}
  <span className="text-sm font-medium text-gray-700">
    {r.owner.display_name}
  </span>

  <span
    className={`px-3 py-0.5 text-xs rounded-full border font-semibold ${
      STATUS_STYLES[r.status]
    }`}
  >
    {r.status.toUpperCase()}
  </span>
</div>



                    
                  </div>

                  <p className="text-xs text-gray-400">
                    Submitted{" "}
                    {new Date(r.created_at).toLocaleDateString()}{" "}
                    {new Date(r.created_at).toLocaleTimeString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 text-sm">
                  {r.status !== "approved" && (
                    <button
                      onClick={() => setStatus(r.id, "approved")}
                      className="px-3 py-1 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                    >
                      Approve
                    </button>
                  )}

                  {r.status !== "rejected" && (
                    <button
                      onClick={() => setStatus(r.id, "rejected")}
                      className="px-3 py-1 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600"
                    >
                      Reject
                    </button>
                  )}

                  <button
                    onClick={() => deleteRequest(r.id)}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4 text-sm text-gray-700">
                {r.description || (
                  <span className="italic text-gray-400">
                    No description provided
                  </span>
                )}
              </div>

              {/* Entries */}
              <div className="mt-4 flex flex-wrap gap-2">
               {r.entries.map((e, idx) => (
  <div
    key={idx}
    className="px-3 py-1.5 rounded-full text-xs bg-gray-100 border text-gray-700 flex items-center gap-1"
  >
    <span className="font-semibold">
      {formatDateWithWeekday(e.request_date)}
    </span>

    <span className="text-gray-500">
      • {e.is_all_day ? "All day" : `${e.start_time}–${e.end_time}`}
    </span>
  </div>
))}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
