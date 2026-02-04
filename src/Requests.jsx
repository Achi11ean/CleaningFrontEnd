import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function ManagerRequests() {
  const { axios } = useAuthorizedAxios();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!axios) return;

    const fetchRequests = async () => {
      try {
        const res = await axios.get("/client-requests");
        setRequests(res.data);
      } catch (err) {
        toast.error("Failed to fetch requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [axios]);

  const getNextStatus = (status) => {
    if (status === "new") return "read";
    if (status === "read") return "completed";
    return "new";
  };

  const updateStatus = async (id, currentStatus) => {
    const newStatus = getNextStatus(currentStatus);
    try {
      await axios.patch(`/client-requests/${id}/status`, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm("Delete this request?")) return;
    try {
      await axios.delete(`/client-requests/${id}`);
      toast.success("Request deleted");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Failed to delete request");
    }
  };

  const statusColor = (status) => {
    if (status === "new") return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
    if (status === "read") return "bg-blue-100 border-blue-300 hover:bg-blue-200";
    return "bg-green-100 border-green-300 hover:bg-green-200";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-emerald-700 mb-6">
        📝 Client Requests
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500 italic">No requests found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {requests.map((r) => (
            <div
              key={r.id}
              onClick={() => updateStatus(r.id, r.status)}
              className={`cursor-pointer border rounded-xl p-4 shadow-sm transition ${statusColor(
                r.status
              )}`}
            >
              <div className="text-sm font-semibold text-gray-800">
                {r.client.first_name} {r.client.last_name}
              </div>
              <div className="text-xs text-gray-600 mb-1">
                📧 {r.client.email} | 📞 {r.client.phone}
              </div>

              <div className="text-sm mb-1">
                <span className="font-semibold">Category:</span> {r.category}
              </div>
              <div className="text-sm text-gray-700 mb-2 line-clamp-3">
                {r.description}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="italic capitalize">Status: {r.status}</span>
                <span>{format(new Date(r.created_at), "MMM d, h:mm a")}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRequest(r.id);
                }}
                className="text-red-500 hover:underline text-xs mt-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
