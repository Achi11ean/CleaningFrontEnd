import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function AllExceptions() {
  const { role, axios } = useAuthorizedAxios();
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!axios) return;

    const fetchExceptions = async () => {
      try {
        const res = await axios.get("/schedule-exceptions");
        setExceptions(res.data);
      } catch (err) {
        toast.error("Failed to load schedule exceptions");
      } finally {
        setLoading(false);
      }
    };

    fetchExceptions();
  }, [axios]);

  const deleteException = async (id) => {
    if (!window.confirm("Delete this exception? This cannot be undone.")) return;

    try {
      await axios.delete(`/schedule-exceptions/${id}`);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
      toast.success("Exception deleted");
    } catch {
      toast.error("Failed to delete exception");
    }
  };

  if (!["admin", "manager"].includes(role)) {
    return <p className="text-red-600 font-semibold">Unauthorized</p>;
  }

  if (loading) {
    return <p className="italic text-gray-500">Loading exceptions…</p>;
  }

  if (exceptions.length === 0) {
    return <p className="italic text-gray-500">No schedule exceptions found.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold text-purple-700">
        🚨 All Schedule Exceptions
      </h2>

      {exceptions.map((ex) => (
        <div
          key={ex.id}
          className="border border-purple-300 rounded-xl p-4 bg-white shadow-sm space-y-2"
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-semibold text-gray-800">
                Schedule #{ex.schedule_id} — Client #{ex.schedule?.client_id}
              </p>

              <p className="text-sm text-gray-600">
                ❌ Original:{" "}
                <span className="font-mono">
                  {format(new Date(ex.original_date), "MMM d, yyyy")}
                </span>
              </p>

              {ex.replacement_date && (
                <p className="text-sm text-green-700">
                  🔁 Replacement:{" "}
                  <span className="font-mono">
                    {format(new Date(ex.replacement_date), "MMM d, yyyy")}
                  </span>
                </p>
              )}

              {ex.start_time && ex.end_time && (
                <p className="text-xs text-gray-500">
                  ⏰ {ex.start_time} – {ex.end_time}
                </p>
              )}

              {ex.reason && (
                <p className="text-xs italic text-gray-500">
                  📝 {ex.reason}
                </p>
              )}
            </div>

            <button
              onClick={() => deleteException(ex.id)}
              className="px-3 py-1.5 text-sm font-bold rounded-lg
                         bg-red-100 text-red-700 hover:bg-red-200 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
