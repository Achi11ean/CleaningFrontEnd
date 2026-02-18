import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ConsultationList({ onSelect }) {
  const { axios } = useAuthorizedAxios();
  const [consultations, setConsultations] = useState([]);
  const [clientsById, setClientsById] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!axios) return;

    async function load() {
      try {
        const [consultRes, clientRes] = await Promise.all([
          axios.get("/consultations"),
          axios.get("/consultation/clients"),
        ]);

        setConsultations(consultRes.data || []);

        const clientMap = {};
        for (const c of clientRes.data || []) {
          clientMap[c.id] = `${c.first_name} ${c.last_name}`;
        }
        setClientsById(clientMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [axios]);
async function handleDelete(consultationId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this consultation?\n\nThis will remove ALL rooms and entries."
  );

  if (!confirmed) return;

  try {
    await axios.delete(`/consultations/${consultationId}`);

    // remove from UI immediately
    setConsultations(prev =>
      prev.filter(c => c.id !== consultationId)
    );

  } catch (err) {
    console.error(err);
    alert("Failed to delete consultation");
  }
}

  const filteredConsultations = consultations.filter((c) => {
    const name = clientsById[c.client_id] || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return <div className="text-gray-500">Loading consultations…</div>;
  }

  if (consultations.length === 0) {
    return <div className="text-gray-500 italic">No consultations yet.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🧠 All Consultations</h2>

      {/* 🔍 Search Bar */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by client name…"
        className="w-full border rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      />

      {/* 📋 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConsultations.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border bg-white p-4 shadow hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {clientsById[c.client_id] || `Client #${c.client_id}`}
              </h3>
              <span className="text-sm text-gray-400">#{c.id}</span>
            </div>

            <p className="text-sm text-gray-600 mt-2">
              Total Points:{" "}
              <span className="font-semibold text-black">
                {c.total_points ?? "—"}
              </span>
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Created: {new Date(c.created_at).toLocaleString()}
            </p>

<div className="flex justify-between mt-4">

  <button
    onClick={() => onSelect(c.id)}
    className="text-sm text-blue-600 hover:underline"
  >
    View →
  </button>

  <button
    onClick={() => handleDelete(c.id)}
    className="text-sm text-red-600 hover:underline"
  >
    Delete
  </button>

</div>

          </div>
        ))}
      </div>
<p className="text-6xl font-[Aspire] bg-gradient-to-br from-cyan-500 via-cyan-200 to-cyan-500 border-black border">View Section</p>
      {filteredConsultations.length === 0 && (
        <p className="text-gray-400 italic">No consultations match that search.</p>
      )}
    </div>
  );
}
