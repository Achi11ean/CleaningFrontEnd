import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ManageIntensity() {
  const { role, axios } = useAuthorizedAxios();
  const [intensities, setIntensities] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: "", points: 1 });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!axios) return;
    axios.get("/consultation/intensities")
      .then(res => setIntensities(res.data || []))
      .catch(() => setError("Failed to load intensities"));
  }, [axios]);

  function startEdit(i) {
    setEditingId(i.id);
    setForm({ label: i.label, points: i.points });
  }

  async function save(id) {
    try {
      const res = await axios.patch(
        `/consultation/intensities/${id}`,
        form
      );
      setIntensities(prev =>
        prev.map(i => i.id === id ? res.data : i)
      );
      setEditingId(null);
    } catch {
      setError("Failed to update intensity");
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this intensity?")) return;
    await axios.delete(`/consultation/intensities/${id}`);
    setIntensities(prev => prev.filter(i => i.id !== id));
  }

  if (!axios) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-orange-700">
        🔥 Manage Intensities
      </h3>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {intensities.map(i => (
        <div
          key={i.id}
          className="border rounded p-3 bg-orange-50 space-y-2"
        >
          {editingId === i.id ? (
            <>
              <input
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                className="w-full border rounded px-2 py-1"
                placeholder="Label"
              />
              <input
                type="number"
                value={form.points}
                onChange={e => setForm({ ...form, points: +e.target.value })}
                className="w-full border rounded px-2 py-1"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => save(i.id)}
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
                {i.label} <span className="text-sm text-gray-600">(×{i.points})</span>
              </div>

              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => startEdit(i)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>

                {role === "admin" && (
                  <button
                    onClick={() => remove(i.id)}
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
