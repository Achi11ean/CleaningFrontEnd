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
const DAY_STYLES = {
  monday: "from-pink-200 to-pink-100",
  tuesday: "from-purple-200 to-purple-100",
  wednesday: "from-blue-200 to-blue-100",
  thursday: "from-teal-200 to-teal-100",
  friday: "from-green-200 to-green-100",
  saturday: "from-yellow-200 to-yellow-100",
  sunday: "from-rose-200 to-rose-100",
};

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const [search, setSearch] = useState("");

const normalizedSearch = search.trim().toLowerCase();

const filteredRows = rows.filter((row) => {
  if (!normalizedSearch) return true;

  // Match name
  const nameMatch =
    row.owner?.display_name
      ?.toLowerCase()
      .includes(normalizedSearch);

  // Match day of week
  const dayMatch = DAYS.some(
    (day) =>
      day.includes(normalizedSearch) &&
      row.weekly?.[day]
  );

  return nameMatch || dayMatch;
});

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
  <div className="space-y-8">

    {/* Sticky Header */}
    <div className="sticky top-0 z-10 bg-white pb-4">
      <h2 className="text-xl sm:text-2xl font-bold text-center">
        🗓️ Team Availability
      </h2>

      <div className="mt-3 px-1">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or day (Mon, Tue, Friday…) 🔍"
          className="
            w-full
            max-w-md
            mx-auto
            block
            border
            rounded-full
            px-5
            py-3
            text-sm
            shadow-sm
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
          "
        />
      </div>
    </div>

    {/* Empty State */}
    {filteredRows.length === 0 ? (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">😕 No availability found</p>
        <p className="text-sm mt-1">
          Try searching a name or a day like <strong>Monday</strong>
        </p>
      </div>
    ) : (

      filteredRows.map((row) => (
        <div
          key={row.id}
          className={`
            rounded-3xl
            border
            p-5
            shadow-md
            space-y-5
            ${
              row.is_locked
                ? "bg-gray-100 border-gray-300"
                : "bg-white"
            }
          `}
        >

          {/* Person Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold">
                {row.owner.display_name}
              </p>

              <p className="text-xs text-gray-500 mt-0.5">
                {row.owner.type.toUpperCase()}
                {row.owner.role ? ` • ${row.owner.role}` : ""}
              </p>

              {row.owner.phone_number && (
                <a
                  href={`tel:${row.owner.phone_number}`}
                  className="
                    inline-flex
                    items-center
                    gap-1
                    mt-2
                    text-sm
                    font-medium
                    text-blue-700
                    bg-blue-50
                    px-3
                    py-1.5
                    rounded-full
                    active:scale-95
                  "
                >
                  📞 {row.owner.phone_number}
                </a>
              )}
            </div>

    
          </div>

          {/* Day Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DAYS.map((day) => {
              const slot = row.weekly?.[day];

              return (
                <div
                  key={day}
                  className={`
                    rounded-2xl
                    p-4
                    shadow-sm
                    bg-gradient-to-br
                    ${DAY_STYLES[day]}
                    ${slot ? "text-gray-900" : "opacity-50"}
                  `}
                >
                  <p className="capitalize font-semibold text-xl border-b border-black">
                    {day}
                  </p>

                  {slot ? (
                    <p className="mt-1 text-sm font-bold">
                      {to12Hour(slot.start)} – {to12Hour(slot.end)}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs italic">
                      Unavailable
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
