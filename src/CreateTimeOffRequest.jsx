import React, { useState } from "react";
import { useAdmin } from "./AdminContext";
import { useStaff } from "./StaffContext";
import { toast } from "react-toastify";

export default function CreateTimeOffRequest({ onSuccess }) {
  // Detect which auth context is active
  let authAxios = null;
  let role = null;

  try {
    const adminCtx = useAdmin();
    if (adminCtx?.token) {
      authAxios = adminCtx.authAxios;
      role = "admin";
    }
  } catch {}

  try {
    const staffCtx = useStaff();
    if (staffCtx?.token) {
      authAxios = staffCtx.authAxios;
      role = "staff";
    }
  } catch {}

  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState([
    { request_date: "", is_all_day: true, start_time: "", end_time: "" },
  ]);
  const [loading, setLoading] = useState(false);

  if (!authAxios || !role) {
    return (
      <div className="p-4 text-red-600 font-semibold">
        You must be logged in as staff or admin to request time off.
      </div>
    );
  }

  const updateEntry = (index, field, value) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { request_date: "", is_all_day: true, start_time: "", end_time: "" },
    ]);
  };

  const removeEntry = (index) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    setLoading(true);

    try {
      await authAxios.post("/time-off", {
        description,
        entries: entries.map((e) => ({
          request_date: e.request_date,
          is_all_day: e.is_all_day,
          start_time: e.is_all_day ? null : e.start_time,
          end_time: e.is_all_day ? null : e.end_time,
        })),
      });

      toast.success("Time off request submitted");
      setDescription("");
      setEntries([
        { request_date: "", is_all_day: true, start_time: "", end_time: "" },
      ]);

      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Request Time Off</h2>

      <textarea
        className="w-full border rounded p-3 mb-4"
        placeholder="Optional description or notes"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="space-y-4">
        {entries.map((entry, i) => (
          <div
            key={i}
            className="border rounded-lg p-4 bg-gray-50 relative"
          >
            {entries.length > 1 && (
              <button
                className="absolute top-2 right-2 text-red-500"
                onClick={() => removeEntry(i)}
              >
                ✕
              </button>
            )}

            <label className="block font-semibold mb-1">Date</label>
            <input
              type="date"
              className="border rounded p-2 w-full mb-2"
              value={entry.request_date}
              onChange={(e) => updateEntry(i, "request_date", e.target.value)}
            />

            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={entry.is_all_day}
                onChange={(e) =>
                  updateEntry(i, "is_all_day", e.target.checked)
                }
              />
              All day
            </label>

            {!entry.is_all_day && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-semibold mb-1">Start</label>
                  <input
                    type="time"
                    className="border rounded p-2 w-full"
                    value={entry.start_time}
                    onChange={(e) =>
                      updateEntry(i, "start_time", e.target.value)
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold mb-1">End</label>
                  <input
                    type="time"
                    className="border rounded p-2 w-full"
                    value={entry.end_time}
                    onChange={(e) => updateEntry(i, "end_time", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="mt-4 text-blue-600 font-semibold"
        onClick={addEntry}
      >
        + Add another date
      </button>

      <button
        disabled={loading}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
        onClick={submit}
      >
        {loading ? "Submitting..." : "Submit Time Off Request"}
      </button>
    </div>
  );
}
