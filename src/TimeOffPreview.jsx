import { useEffect, useState } from "react";

export default function TimeOffPreview({ authAxios, owner }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!owner) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await authAxios.get("/time-off/all");
        const filtered = (res.data || []).filter(
          (r) =>
            r.owner?.type === owner.type &&
            r.owner?.id === owner.id
        );
        setRows(filtered);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authAxios, owner]);

  if (loading) {
    return (
      <p className="text-xs italic text-gray-500">
        Loading time off…
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-xs italic text-gray-500">
        No time off requests
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.id}
          className={`
            rounded-lg border p-2 text-xs
            ${
              r.status === "approved"
                ? "bg-red-50 border-red-300"
                : r.status === "pending"
                ? "bg-yellow-50 border-yellow-300"
                : "bg-gray-100"
            }
          `}
        >
          <div className="font-semibold capitalize">
            {r.status} time off
          </div>

          {r.entries.map((e, i) => (
            <div key={i} className="text-gray-700">
              📅 {e.request_date}
              {!e.is_all_day && (
                <span>
                  {" "}
                  ({e.start_time}–{e.end_time})
                </span>
              )}
            </div>
          ))}

          {r.description && (
            <div className="italic text-gray-500 mt-1">
              “{r.description}”
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
