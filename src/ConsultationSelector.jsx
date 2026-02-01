import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ConsultationSelector({ value, onSelect }) {
  const { axios } = useAuthorizedAxios();

  const [consultations, setConsultations] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientsById, setClientsById] = useState({});

  const [mode, setMode] = useState("select"); // "select" | "create"
  const [newClientId, setNewClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!axios) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [consultRes, clientRes] = await Promise.all([
          axios.get("/consultations"),
          axios.get("/consultation/clients"),
        ]);

        setConsultations(consultRes.data || []);
        setClients(clientRes.data || []);

        const map = {};
        (clientRes.data || []).forEach((c) => {
          map[c.id] = `${c.first_name} ${c.last_name}`;
        });
        setClientsById(map);

      } catch (err) {
        console.error(err);
        setError("Failed to load consultations");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [axios]);

  async function createConsultation() {
    if (!newClientId) return;

    try {
      setLoading(true);
      const res = await axios.post("/consultations", {
        client_id: Number(newClientId),
      });

      onSelect(res.data.id);
    } catch (err) {
      console.error(err);
      setError("Failed to create consultation");
    } finally {
      setLoading(false);
    }
  }

  if (!axios) return null;

  return (
    <div className="p-4 border rounded-lg bg-white space-y-4">

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Step 1: Consultation
        </h3>

        <div className="flex gap-2">
          <button
            onClick={() => setMode("select")}
            className={`px-3 py-1 rounded text-sm ${
              mode === "select"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Select Existing
          </button>
          <button
            onClick={() => setMode("create")}
            className={`px-3 py-1 rounded text-sm ${
              mode === "create"
                ? "bg-green-100 text-green-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ➕ New
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {/* ───────── SELECT EXISTING ───────── */}
      {mode === "select" && (
        <select
          value={value || ""}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
          disabled={loading}
        >
          <option value="">Select a consultation…</option>

          {consultations.map((c) => {
            const clientName =
              clientsById[c.client_id] || `Client #${c.client_id}`;

            return (
              <option key={c.id} value={c.id}>
                {clientName} —{" "}
                {new Date(c.created_at).toLocaleDateString()} — #{c.id}
              </option>
            );
          })}
        </select>
      )}

      {/* ───────── CREATE NEW ───────── */}
      {mode === "create" && (
        <div className="space-y-3 p-3 border rounded bg-green-50">

          <label className="block text-sm font-medium text-green-800">
            Select Client
          </label>

          <select
            value={newClientId}
            onChange={(e) => setNewClientId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Choose a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>

          <button
            onClick={createConsultation}
            disabled={!newClientId || loading}
            className="bg-green-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create & Continue"}
          </button>
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500">
          Working…
        </div>
      )}
    </div>
  );
}
