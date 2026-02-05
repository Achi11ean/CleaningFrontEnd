// StaffClock.jsx
import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";

export default function StaffClock({ onRequestInventory }) {
  const { authAxios } = useStaff();

  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState(null);

  const [now, setNow] = useState(new Date());

  // ⏱️ Live timer tick every second when clocked in
  useEffect(() => {
    if (!clockedIn) return;

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [clockedIn]);

  // 🔍 Load current clock status on mount
  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get("/staff/me/clock-status");

      if (res.data.clocked_in) {
        setClockedIn(true);
        setEntry(res.data.entry);
      } else {
        setClockedIn(false);
        setEntry(null);
      }
    } catch (err) {
      setError("Failed to load clock status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // ▶️ Clock In
  const clockIn = async () => {
    try {
      setError(null);
      const res = await authAxios.post("/staff/clock-in");
      setClockedIn(true);
      setEntry(res.data.entry);
      setNow(new Date());
    } catch (err) {
      setError(err.response?.data?.error || "Failed to clock in");
    }
  };

  // ⏹️ Clock Out
  const clockOut = async () => {
    try {
      setError(null);
      const res = await authAxios.post("/staff/clock-out");

      const duration = (res.data.duration_seconds / 3600).toFixed(2);
      const goToInventory = window.confirm(
        `Clocked out.\nSession: ${duration} hours\n\nDo you need to report items used?`
      );

      setClockedIn(false);
      setEntry(null);

      if (goToInventory && typeof onRequestInventory === "function") {
        onRequestInventory();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to clock out");
    }
  };
  // 🧮 Current session duration
  let currentSeconds = 0;
  if (clockedIn && entry?.clock_in_at) {
    const start = new Date(entry.clock_in_at);
    currentSeconds = Math.max(
      0,
      Math.floor((now - start) / 1000)
    );
  }

  const hours = (currentSeconds / 3600).toFixed(2);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500 font-semibold">
        Loading clock status...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto text-center py-10">

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        ⏱️ Time Clock
      </h2>

      <p className="text-gray-500 mb-8">
        Track your work time
      </p>

      {error && (
        <div className="mb-6 text-red-600 font-semibold">
          {error}
        </div>
      )}

      {/* Status Card */}
      <div className="mb-10 p-6 rounded-xl border bg-gray-50 shadow-inner">

        {clockedIn ? (
          <>
            <div className="text-green-700 font-bold text-lg mb-2">
              ✅ You are clocked in
            </div>

            <div className="text-sm text-gray-500 mb-2">
              Clocked in at:
            </div>

            <div className="font-semibold mb-4">
              {new Date(entry.clock_in_at).toLocaleString()}
            </div>

            <div className="text-3xl font-mono font-bold text-blue-700">
              {hours} hrs
            </div>

            <div className="text-sm text-gray-500 mt-1">
              Current session
            </div>
          </>
        ) : (
          <>
            <div className="text-red-700 font-bold text-lg mb-2">
              ⛔ You are not clocked in
            </div>

            <div className="text-sm text-gray-500">
              Click below to start your shift
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-6">

        <button
          onClick={clockIn}
          disabled={clockedIn}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition ${
            clockedIn
              ? "bg-green-200 text-green-800 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          Clock In
        </button>

        <button
          onClick={clockOut}
          disabled={!clockedIn}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition ${
            !clockedIn
              ? "bg-red-200 text-red-800 cursor-not-allowed"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          Clock Out
        </button>

      </div>
    </div>
  );
}
