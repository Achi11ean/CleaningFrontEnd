import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ManageConsults({ onSelect }) {
  const { role, axios } = useAuthorizedAxios();

  const [consultations, setConsultations] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
const [clientsById, setClientsById] = useState({});
useEffect(() => {
  if (!axios) return;

  async function loadClients() {
    try {
      const res = await axios.get("/consultation/clients");

      const map = {};
      (res.data || []).forEach(c => {
        map[c.id] = `${c.first_name} ${c.last_name}`;
      });

      setClientsById(map);
    } catch (err) {
      console.error("Failed to load clients");
    }
  }

  loadClients();
}, [axios]);

  /* ───────────────────────────────
     Load consultations
     ─────────────────────────────── */
  useEffect(() => {
    if (!axios) return;

    async function load() {
      setLoading(true);
      try {
        const res = await axios.get("/consultations");
        setConsultations(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load consultations");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [axios]);

  /* ───────────────────────────────
     Actions
     ─────────────────────────────── */
  async function saveNotes(id) {
    try {
      await axios.patch(`/consultations/${id}`, {
        notes: editNotes,
      });

      setConsultations(prev =>
        prev.map(c =>
          c.id === id ? { ...c, notes: editNotes } : c
        )
      );

      setEditingId(null);
      setEditNotes("");
    } catch (err) {
      setError("Failed to update consultation");
    }
  }

  async function deleteConsultation(id) {
    const ok = window.confirm(
      "Are you sure you want to permanently delete this consultation?"
    );
    if (!ok) return;

    try {
      await axios.delete(`/consultations/${id}`);
      setConsultations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError("Failed to delete consultation");
    }
  }

  /* ───────────────────────────────
     Filter
     ─────────────────────────────── */
const filtered = consultations.filter(c => {
  const q = search.toLowerCase();
  const clientName = clientsById[c.client_id]?.toLowerCase() || "";

  return (
    c.id.toString().includes(q) ||
    c.client_id.toString().includes(q) ||
    clientName.includes(q) ||
    (c.notes || "").toLowerCase().includes(q)
  );
});


  if (!axios) {
    return <div className="text-red-600">Not authorized</div>;
  }

  /* ───────────────────────────────
     Render
     ─────────────────────────────── */
  return (
    <div className="space-y-6 p-4 border rounded bg-white">
      <h3 className="text-xl font-semibold">
        Manage Consultations
      </h3>

      <div className="text-sm text-gray-500">
        Logged in as <strong>{role}</strong>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by ID, client, or notes…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {loading && (
        <div className="text-gray-500">Loading consultations…</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-gray-500 italic">
          No consultations found.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(c => (
          <div
            key={c.id}
            className="border rounded p-4 bg-gray-50 space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
      
       <div className="text-sm text-gray-600">
  Client:{" "}
  <strong>
    {clientsById[c.client_id] || `Client #${c.client_id}`}
  </strong>
</div>
          <div className="font-semibold">
                  Consultation #{c.id}
                </div>

                <div className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </div>

              {onSelect && (
                <button
                  onClick={() => onSelect(c.id)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Open
                </button>
              )}
            </div>

            {/* Notes */}
            {editingId === c.id ? (
              <>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => saveNotes(c.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditNotes("");
                    }}
                    className="text-gray-600 px-3 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm">
                  <strong>Notes:</strong>{" "}
                  {c.notes || (
                    <span className="italic text-gray-400">
                      No notes
                    </span>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setEditNotes(c.notes || "");
                    }}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Edit
                  </button>

                  {(role === "admin" || role === "manager") && (
                    <button
                      onClick={() => deleteConsultation(c.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}

            <div className="text-sm">
              <strong>Total Points:</strong>{" "}
              {c.total_points ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
