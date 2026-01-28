import React, { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function AllAvailability() {
  const { role, axios } = useAuthorizedAxios();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
function to12Hour(time24) {
  if (!time24) return "";

  const [h, m] = time24.split(":").map(Number);
  const hour = h % 12 || 12;
  const period = h >= 12 ? "PM" : "AM";

  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

  useEffect(() => {
    if (!axios) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/availability/all");
        setRows(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load availability");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [axios]);

  if (!axios) {
    return (
      <p className="text-center text-red-600 font-semibold">
        You must be logged in to view availability.
      </p>
    );
  }

  if (loading) {
    return <p className="text-center italic">Loading availability…</p>;
  }

  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">
        🗓️ Team Availability
      </h2>

      {rows.length === 0 ? (
        <p className="text-center italic">
          No availability submitted yet.
        </p>
      ) : (
        rows.map((row) => (
          <div
            key={row.id}
            className={`rounded-xl border p-4 shadow ${
              row.is_locked
                ? "bg-gray-100 border-gray-400"
                : "bg-white"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
             <div>
  <p className="font-semibold">
    {row.owner.display_name}
  </p>

  <p className="text-xs text-gray-500">
    {row.owner.type.toUpperCase()}
    {row.owner.role ? ` • ${row.owner.role}` : ""}
  </p>

  {row.owner.phone_number && (
    <p className="text-xs text-gray-600 mt-1">
      📞{" "}
      <a
        href={`tel:${row.owner.phone_number}`}
        className="hover:underline text-blue-600"
      >
        {row.owner.phone_number}
      </a>
    </p>
  )}
</div>

              {row.is_locked && (
                <span className="text-xs font-bold text-red-600">
                  🔒 Locked
                </span>
              )}
            </div>

            {/* Weekly grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DAYS.map((day) => {
                const slot = row.weekly?.[day];

return (
  <div key={day} className="text-sm">
    <strong className="capitalize">{day}</strong>

    {!slot ? (
      <p className="text-gray-400">Unavailable</p>
    ) : (
 <p className="ml-2">
  {to12Hour(slot.start)} – {to12Hour(slot.end)}
</p>

    )}
  </div>
);

              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
