// src/ManageReviews.jsx
import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ManageReviews() {
  const { role, axios } = useAuthorizedAxios();

  // 🔐 Only admin or manager
  if (!axios || (role !== "admin" && role !== "manager")) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        You do not have permission to manage reviews.
      </div>
    );
  }

  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/reviews", {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setReviews(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditForm({
      first_name: r.first_name,
      last_initial: r.last_initial,
      rating: r.rating,
      message: r.message,
      status: r.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      await axios.patch(`/admin/reviews/${id}`, editForm);
      setEditingId(null);
      loadReviews();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update review");
    }
  };

  const approve = async (id) => {
    await axios.patch(`/admin/reviews/${id}/approve`);
    loadReviews();
  };

  const remove = async (id) => {
    const ok = window.confirm("Delete this review permanently?");
    if (!ok) return;

    await axios.delete(`/admin/reviews/${id}`);
    loadReviews();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⭐ Manage Reviews</h2>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          onClick={loadReviews}
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading reviews...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="border rounded-xl p-4 bg-white shadow-md flex flex-col justify-between"
            >
              {editingId === r.id ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={editForm.first_name}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          first_name: e.target.value,
                        })
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                    <input
                      value={editForm.last_initial}
                      maxLength={1}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          last_initial: e.target.value,
                        })
                      }
                      className="border rounded px-2 py-1 w-16 text-center uppercase"
                    />
                  </div>

                  <select
                    value={editForm.rating}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        rating: Number(e.target.value),
                      })
                    }
                    className="border rounded px-2 py-1 mb-2"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ⭐
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={editForm.message}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        message: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full border rounded px-2 py-1 mb-2"
                  />

                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value,
                      })
                    }
                    className="border rounded px-2 py-1 mb-3"
                  >
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(r.id)}
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
                      {r.first_name} {r.last_initial}. — {r.rating} ⭐
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        r.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : r.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="mt-3 text-gray-700 text-sm whitespace-pre-line max-h-32 overflow-y-auto pr-1">
                    {r.message}
                  </div>

                  <p className="mt-3 text-xs text-gray-400">
                    Created: {new Date(r.created_at).toLocaleString()}
                  </p>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => startEdit(r)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      Edit
                    </button>

                    {r.status !== "approved" && (
                      <button
                        onClick={() => approve(r.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                      >
                        Approve
                      </button>
                    )}

                    <button
                      onClick={() => remove(r.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
