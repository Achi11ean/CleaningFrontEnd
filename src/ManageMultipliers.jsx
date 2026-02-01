import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ManageMultipliers() {
  const { role, axios } = useAuthorizedAxios();
  const [multipliers, setMultipliers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    label: "",
    multiplier: 1,
    notes: "",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!axios) return;
    axios.get("/consultation/multipliers")
      .then(res => setMultipliers(res.data || []))
      .catch(() => setError("Failed to load multipliers"));
  }, [axios]);

  function startEdit(m) {
    setEditingId(m.id);
    setForm({
      label: m.label,
      multiplier: m.multiplier,
      notes: m.notes || "",
    });
  }

  async function save(id) {
    try {
      const res = await axios.patch(
        `/consultation/multipliers/${id}`,
        form
      );
      setMultipliers(prev =>
        prev.map(m => m.id === id ? res.data : m)
      );
      setEditingId(null);
    } catch {
      setError("Failed to update multiplier");
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this multiplier?")) return;
    await axios.delete(`/consultation/multipliers/${id}`);
    setMultipliers(prev => prev.filter(m => m.id !== id));
  }

  if (!axios) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-purple-700">
        ✖️ Manage Multipliers
      </h3>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {multipliers.map(m => (
        <div
          key={m.id}
          className="border rounded p-3 bg-purple-50 space-y-2"
        >
          {editingId === m.id ? (
            <>
              <input
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                className="w-full border rounded px-2 py-1"
                placeholder="Label"
              />
              <input
                type="number"
                step="0.1"
                value={form.multiplier}
                onChange={e =>
                  setForm({ ...form, multiplier: +e.target.value })
                }
                className="w-full border rounded px-2 py-1"
              />
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border rounded px-2 py-1"
                placeholder="Optional notes"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => save(m.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="font-medium">
                {m.label}{" "}
                <span className="text-sm text-gray-600">
                  (×{m.multiplier})
                </span>
              </div>

              {m.notes && (
                <div className="text-sm italic text-gray-500">
                  {m.notes}
                </div>
              )}

              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => startEdit(m)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>

                {role === "admin" && (
                  <button
                    onClick={() => remove(m.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
