import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ManageServices() {
  const { role, axios } = useAuthorizedAxios();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // 🔐 Only admin or manager
  if (!axios || (role !== "admin" && role !== "manager")) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        You do not have permission to manage services.
      </div>
    );
  }

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/services");
      setServices(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!axios) return;
    loadServices();
  }, [axios]);

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({
      title: s.title,
      description: s.description || "",
      image_url: s.image_url || "",
      is_active: s.is_active,
      position: s.position,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      await axios.patch(`/admin/services/${id}`, editForm);
      setEditingId(null);
      loadServices();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update service");
    }
  };

  const deleteService = async (id) => {
    const ok = window.confirm("Delete this service?");
    if (!ok) return;

    await axios.delete(`/admin/services/${id}`);
    loadServices();
  };

  // 🔼🔽 Move service up or down
  const moveService = async (index, direction) => {
    const current = services[index];
    const swapWith =
      direction === "up" ? services[index - 1] : services[index + 1];

    if (!swapWith) return;

    try {
      await Promise.all([
        axios.patch(`/admin/services/${current.id}`, {
          position: swapWith.position,
        }),
        axios.patch(`/admin/services/${swapWith.id}`, {
          position: current.position,
        }),
      ]);

      loadServices();
    } catch {
      alert("Failed to reorder services");
    }
  };

  if (loading) return <p>Loading services...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🛠️ Manage Services</h2>

      {services.length === 0 ? (
        <p className="text-gray-500">No services yet.</p>
      ) : (
        <div className="space-y-4">
          {services.map((s, index) => (
            <div
              key={s.id}
              className="border rounded-lg p-4 flex gap-4 items-start bg-white shadow-sm"
            >
              {/* Reorder Controls */}
              <div className="flex flex-col gap-1 pt-2">
                <button
                  disabled={index === 0}
                  onClick={() => moveService(index, "up")}
                  className={`px-2 py-1 rounded text-sm border ${
                    index === 0
                      ? "text-gray-300 border-gray-200 cursor-not-allowed"
                      : "text-blue-600 border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  ▲
                </button>
                <button
                  disabled={index === services.length - 1}
                  onClick={() => moveService(index, "down")}
                  className={`px-2 py-1 rounded text-sm border ${
                    index === services.length - 1
                      ? "text-gray-300 border-gray-200 cursor-not-allowed"
                      : "text-blue-600 border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  ▼
                </button>
              </div>

              {/* Image */}
              {s.image_url && (
                <img
                  src={s.image_url}
                  alt={s.title}
                  className="w-24 h-24 object-cover rounded border"
                />
              )}

              {/* Content */}
              <div className="flex-1 space-y-2">
                {editingId === s.id ? (
                  <>
                    <input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="w-full border rounded px-2 py-1 font-semibold"
                    />

                    <textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full border rounded px-2 py-1"
                    />
{/* IMAGE URL */}
<div className="space-y-1">
  <label className="text-xs font-semibold text-gray-500">
    Image URL
  </label>

  <input
    value={editForm.image_url || ""}
    onChange={(e) =>
      setEditForm({ ...editForm, image_url: e.target.value })
    }
    placeholder="https://example.com/image.jpg"
    className="w-full border rounded px-2 py-1 text-sm"
  />

  {editForm.image_url && (
    <img
      src={editForm.image_url}
      alt="Preview"
      className="mt-2 w-24 h-24 object-cover rounded border"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  )}
</div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            is_active: e.target.checked,
                          })
                        }
                      />
                      <span>Active</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(s.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                      >
                        Save
                      </button>

                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-200 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">
                        {s.title}
                        <span className="ml-2 text-xs text-gray-400">
                          (#{s.position})
                        </span>
                      </h3>
                      <span
                        className={`text-sm font-semibold ${
                          s.is_active ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="text-gray-700 whitespace-pre-line">
                      {s.description || "—"}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(s)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteService(s.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
