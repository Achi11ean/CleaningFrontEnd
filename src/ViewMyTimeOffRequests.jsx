import React, { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import { toast } from "react-toastify";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

export default function ViewMyTimeOffRequests() {
  const { authAxios } = useStaff();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState("");
const [editEntries, setEditEntries] = useState([]);
const [expandedId, setExpandedId] = useState(null);
const toggleExpand = (id) => {
  setExpandedId((prev) => (prev === id ? null : id));
};

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get("/time-off/me");
      setRequests(res.data || []);
    } catch {
      toast.error("Failed to load time off requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

const startEdit = (req) => {
  setEditingId(req.id);
  setEditDescription(req.description || "");
  setEditEntries(
    req.entries.map((e) => ({
      request_date: e.request_date,
      is_all_day: e.is_all_day,
      start_time: e.start_time || "",
      end_time: e.end_time || "",
    }))
  );
};

const updateEntry = (idx, field, value) => {
  setEditEntries((prev) =>
    prev.map((e, i) =>
      i === idx ? { ...e, [field]: value } : e
    )
  );
};

const removeEntry = (idx) => {
  setEditEntries((prev) => prev.filter((_, i) => i !== idx));
};

const addEntry = () => {
  setEditEntries((prev) => [
    ...prev,
    {
      request_date: "",
      is_all_day: true,
      start_time: "",
      end_time: "",
    },
  ]);
};

  const cancelEdit = () => {
    setEditingId(null);
    setEditDescription("");
  };

  const saveEdit = async (req) => {
    try {
      await authAxios.patch(`/time-off/me/${req.id}`, {
        description: editDescription,
        entries: req.entries,
      });
      toast.success("Request updated");
      cancelEdit();
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm("Delete this time off request?")) return;
    try {
      await authAxios.delete(`/time-off/me/${id}`);
      toast.success("Request deleted");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  if (loading) {
    return <p className="italic text-gray-500">Loading your time off…</p>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 italic">
        No time off requests yet 🌤️
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {requests.map((req) => (
        <div
          key={req.id}
          className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-5"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
{/* Header (collapsible trigger) */}
<button
  onClick={() => toggleExpand(req.id)}
  className="w-full text-left flex justify-between items-center mb-2 group"
>
  <div className="flex items-center gap-3">
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold border ${
        STATUS_STYLES[req.status]
      }`}
    >
      {req.status.toUpperCase()}
    </span>

    <span className="text-xs text-gray-400">
      Submitted{" "}
      {new Date(req.created_at).toLocaleDateString()}{" "}
      {new Date(req.created_at).toLocaleTimeString()}
    </span>
  </div>

  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-500 italic hidden sm:block">
      {req.description
        ? req.description.slice(0, 40) +
          (req.description.length > 40 ? "…" : "")
        : "No reason"}
    </span>

    <span
      className={`text-lg transition-transform ${
        expandedId === req.id ? "rotate-180" : ""
      }`}
    >
      ▾
    </span>
  </div>
</button>

          </div>

          {/* Description */}
          <div className="mb-4">
            {editingId === req.id ? (
              <textarea
                className="w-full border rounded-xl p-3 text-sm focus:ring focus:ring-blue-200"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional description"
              />
            ) : (
              <p className="text-gray-700 text-sm">
                {req.description || (
                  <span className="italic text-gray-400">
                    No description provided
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Entries */}
        {expandedId === req.id && (
  <div className="mt-4 space-y-4">


    {/* ENTRIES */}
    <div className="space-y-3">
      {(editingId === req.id ? editEntries : req.entries).map((e, i) => (
        <div
          key={i}
          className="border rounded-lg p-3 bg-gray-50 relative"
        >
          {editingId === req.id && editEntries.length > 1 && (
            <button
              onClick={() => removeEntry(i)}
              className="absolute top-2 right-2 text-red-500"
            >
              ✕
            </button>
          )}

          <input
            type="date"
            disabled={editingId !== req.id}
            className="border rounded p-2 w-full mb-2"
            value={e.request_date}
            onChange={(ev) =>
              updateEntry(i, "request_date", ev.target.value)
            }
          />

          <label className="flex items-center gap-2 mb-2 text-sm">
            <input
              type="checkbox"
              disabled={editingId !== req.id}
              checked={e.is_all_day}
              onChange={(ev) =>
                updateEntry(i, "is_all_day", ev.target.checked)
              }
            />
            All day
          </label>

          {!e.is_all_day && (
            <div className="flex gap-3">
              <input
                type="time"
                disabled={editingId !== req.id}
                className="border rounded p-2 w-full"
                value={e.start_time}
                onChange={(ev) =>
                  updateEntry(i, "start_time", ev.target.value)
                }
              />
              <input
                type="time"
                disabled={editingId !== req.id}
                className="border rounded p-2 w-full"
                value={e.end_time}
                onChange={(ev) =>
                  updateEntry(i, "end_time", ev.target.value)
                }
              />
            </div>
          )}
        </div>
      ))}

      {editingId === req.id && (
        <button
          onClick={addEntry}
          className="text-blue-600 text-sm font-semibold"
        >
          + Add another date
        </button>
      )}
    </div>

    {/* ACTIONS */}
    {req.status === "pending" && (
      <div className="flex gap-2 justify-end pt-2">
        {editingId === req.id ? (
          <>
            <button
              onClick={() => saveEdit(req)}
              className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => startEdit(req)}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={() => deleteRequest(req.id)}
              className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
            >
              Delete
            </button>
          </>
        )}
      </div>
    )}
  </div>
)}

        </div>
      ))}
    </div>
  );
}
