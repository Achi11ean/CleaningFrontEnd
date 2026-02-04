import { useState } from "react";
import { useAdmin } from "./AdminContext";
import toast from "react-hot-toast";

export default function EditTimeCard({ entry, onUpdate, onDelete }) {
  const { authAxios } = useAdmin();
  const [editing, setEditing] = useState(false);
  const [clockIn, setClockIn] = useState(entry.clock_in_at);
  const [clockOut, setClockOut] = useState(entry.clock_out_at);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authAxios.patch(`/admin/staff-time-entry/${entry.id}`, {
        clock_in_at: clockIn,
        clock_out_at: clockOut,
      });
      onUpdate(res.data); // update parent state
      toast.success("Updated!");
      setEditing(false);
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      await authAxios.delete(`/admin/staff-time-entry/${entry.id}`);
      onDelete(entry.id); // remove from parent state
      toast.success("Deleted!");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete.");
    }
  };

  return (
    <div className="border bg-gray-50 rounded-lg p-3 shadow-sm text-sm space-y-2 relative group">
      {editing ? (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Clock In</label>
            <input
              type="datetime-local"
              value={clockIn?.slice(0, 16)}
              onChange={(e) => setClockIn(e.target.value)}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Clock Out</label>
            <input
              type="datetime-local"
              value={clockOut?.slice(0, 16)}
              onChange={(e) => setClockOut(e.target.value)}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setEditing(false)}
              className="text-gray-500 hover:underline"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-gray-700 font-medium">
            🕒 {((entry.duration_seconds || 0) / 3600).toFixed(2)} hrs
          </div>
          <div className="text-gray-500 text-xs mt-1">
            In: {new Date(entry.clock_in_at).toLocaleString()}
            <br />
            Out: {new Date(entry.clock_out_at).toLocaleString()}
          </div>
        </>
      )}

      {/* Action Buttons */}
      {!editing && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition text-xs space-x-2">
          <button
            onClick={() => setEditing(true)}
            className="text-blue-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
