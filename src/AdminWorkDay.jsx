import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function WorkDayLive() {
  const { role, axios } = useAuthorizedAxios();

  const [allStaff, setAllStaff] = useState([]);
  const [liveData, setLiveData] = useState({});
  const [staffProfiles, setStaffProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const canManage = role === "admin" || role === "manager";

  const loadAll = async () => {
    if (!axios || !canManage) return;

    setLoading(true);
    try {
      const [staffRes, liveRes] = await Promise.all([
        axios.get("/staff/all"),
        axios.get("/admin/reports/live"),
      ]);

      setAllStaff(staffRes.data);

      const liveMap = {};
      liveRes.data.active.forEach((entry) => {
        liveMap[entry.staff_id] = entry;
      });
      setLiveData(liveMap);

      const profilePromises = staffRes.data.map((staff) =>
        axios.get(`/admin/staff/${staff.id}/profile`).then((res) => ({
          staff_id: staff.id,
          profile: res.data.profile,
        }))
      );

      const resolved = await Promise.all(profilePromises);

      const profileMap = {};
      resolved.forEach(({ staff_id, profile }) => {
        profileMap[staff_id] = profile;
      });

      setStaffProfiles(profileMap);
    } catch (err) {
      setError("Failed to load workday data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, [axios, role]);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

const handleClock = async (staffId, action) => {
  setActionLoading((prev) => ({ ...prev, [staffId]: true }));

  try {
    await axios.post("/admin/staff-clock", {
      staff_id: staffId,
      action,
    });

    await loadAll();
  } catch (err) {
    console.error("Clock action failed", err);
  } finally {
    setActionLoading((prev) => ({ ...prev, [staffId]: false }));
  }
};
  const getDisplayName = (staff) => {
    const profile = staffProfiles[staff.id];
    if (profile && (profile.first_name || profile.last_name)) {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    }
    return staff.username;
  };

  if (!canManage) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🟢 Live Work Day
      </h2>

      {loading ? (
        <div className="py-10 text-gray-500 font-semibold">
          Loading live clock data...
        </div>
      ) : error ? (
        <div className="py-6 text-red-600 font-semibold">{error}</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {allStaff.map((staff) => {
            const live = liveData[staff.id];
            const clockedIn = !!live;

            return (
              <div
                key={staff.id}
                className={`rounded-xl border p-4 shadow-sm ${
                  clockedIn
                    ? "bg-emerald-50 border-emerald-300"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="font-semibold text-gray-800 mb-1">
                  {getDisplayName(staff)}
                </div>

                <div className="text-sm text-gray-600">
                  Status:{" "}
                  <span
                    className={`font-bold ${
                      clockedIn ? "text-emerald-700" : "text-gray-500"
                    }`}
                  >
                    {clockedIn ? "Clocked In" : "Not Clocked In"}
                  </span>
                </div>

                {clockedIn && (
                  <>
                    <div className="text-xs mt-1 text-gray-500">
                      ⏰ {new Date(live.clock_in_at).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Duration: {formatDuration(live.current_seconds)}
                    </div>
                  </>
                )}

                <button
                  onClick={() =>
                    handleClock(staff.id, clockedIn ? "out" : "in")
                  }
                  disabled={actionLoading[staff.id]}
                  className={`mt-3 w-full text-sm font-semibold px-3 py-2 rounded ${
                    clockedIn
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                  }`}
                >
                  {actionLoading[staff.id]
                    ? "Updating..."
                    : clockedIn
                    ? "Clock Out"
                    : "Clock In"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}