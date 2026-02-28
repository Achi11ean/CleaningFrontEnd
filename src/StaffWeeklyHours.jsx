import React, { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";

export default function StaffWeeklyHours() {
  const { authAxios } = useStaff();

  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [entries, setEntries] = useState([]);
  const [totalHours, setTotalHours] = useState(0);

  const [loadingWeeks, setLoadingWeeks] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);

  useEffect(() => {
    fetchWeeks();
  }, []);

  const fetchWeeks = async () => {
    try {
      const res = await authAxios.get("/staff/me/weeks");
      setWeeks(res.data);

      if (res.data.length > 0) {
        selectWeek(res.data[0]);
      }
    } catch (err) {
      console.error("Failed loading weeks", err);
    } finally {
      setLoadingWeeks(false);
    }
  };

  const selectWeek = async (week) => {
    setSelectedWeek(week);
    setLoadingEntries(true);

    try {
      const res = await authAxios.get("/staff/me/weekly-entries", {
        params: { start: week.week_start },
      });

      setEntries(res.data.entries);
      setTotalHours(res.data.total_hours);
    } catch (err) {
      console.error("Failed loading entries", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatHours = (seconds) => (seconds / 3600).toFixed(2);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 via-black to-slate-900 rounded-2xl border border-white/10 text-white">
      
      <h2 className="text-3xl font-bold mb-6 text-center">
        🕒 Weekly Hours
      </h2>

      {/* WEEK SELECTOR */}
      {loadingWeeks ? (
        <p className="text-center text-white/60">Loading weeks...</p>
      ) : (
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {weeks.map((week) => (
            <button
              key={week.week_start}
              onClick={() => selectWeek(week)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                selectedWeek?.week_start === week.week_start
                  ? "bg-purple-600 shadow-lg"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {week.label}
            </button>
          ))}
        </div>
      )}

      {/* WEEK TOTAL */}
      {!loadingEntries && (
        <div className="mb-6 text-center">
          <div className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
            <div className="text-xs uppercase tracking-wider opacity-80">
              Total This Week
            </div>
            <div className="text-3xl font-bold">
              {totalHours.toFixed(2)} hrs
            </div>
          </div>
        </div>
      )}

      {/* ENTRY BREAKDOWN */}
      <div className="bg-black/40 rounded-xl p-4">
        {loadingEntries ? (
          <p className="text-center text-white/60">Loading hours...</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-white/60">No hours logged</p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center bg-white/5 p-3 rounded-lg"
              >
                <div className="text-sm text-white/70">
                  {formatDate(e.clock_in_at)} → {formatDate(e.clock_out_at)}
                </div>
                <div className="font-semibold text-lg">
                  {formatHours(e.duration_seconds)} hrs
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}